// 入口文件
var express = require('express');
var fortune = require('./lib/fortune.js');
var http = require('http');
var https = require('https');
var fs = require('fs');
var mongoose = require('mongoose');
var Vacation = require('./models/vacation.js');
var Attraction = require('./models/attraction.js');
var formidable = require('formidable'); // 安装文件上传处理模块；
var jqupload = require('jquery-file-upload-middleware'); // 安装文件上传控制的中间件模块；
var credentials = require('./credentials.js');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var vhost = require('vhost');
var cors = require('cors');
var Rest = require('connect-rest');
var bundler = require('connect-bundle');
var static = require('./lib/static.js').map;
// 用于开启https服务的证书和私钥；
// var options = {
// 	key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
// 	cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
// };
var nodemailer = require('nodemailer'); // 引入邮件模块
var smtpTransport = require('nodemailer-smtp-transport'); // 引入SMTP服务器转发模块；
// 验证email的正则表达式；
const VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
// 创建应用实例
var app = express();
// 引入handlebars视图引擎，create()方法创建handlebars实例来注册应用的引擎
var handlebars = require('express-handlebars').create({
	defaultLayout: 'main',
	helpers: {
		section: function (name, options) {
			if (!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		},
		static: function (name) {
			return require('./lib/static.js').map(name);
		}
	}
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);
// 禁止返回服务器信息Express;
app.disable('x-powered-by');

app.use(bundler(require('./config.js')));

var opts = {
	keepAlive: 1,
	useNewUrlParser: true
};
switch(app.get('env')) {
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, opts); // 连接MongoDB云端数据库，并传入opts配置对象；
		console.log('database connected.');
		break;
	case 'production':
		mongoose.connect(credentials.mongo.production.connectionString, opts);
		console.log('database connected.');
		break;
	default:
		throw new Error('Unknown execution environment ' + app.get('env'))
}
// 服务器端配置cors进行跨域请求管理，只允许/api开头的路径跨域请求；
app.use('/api', cors());

app.use(function (req, res, next) {
	var domain = require('domain').create();
	domain.on('error', function (err) {
		console.error('DOMAIN ERROR CAUGHT\n', err.stack);
		try {
			setTimeout(function () {
				console.error('Failsafe shutdown.');
				process.exit(1);
			}, 5000);
			var worker = require('cluster').worker;
			if (worker) {
				worker.disconnect();
			}
			server.close();
			try {
				next(err);
			} catch (err) {
				console.error('Express error mechanism failed.\n', err.stack);
				res.status(500).send('Server error.');
			}
		} catch (err) {
			console.error('Unable to send 500 response.\n', err.stack);
		}		
	});
	domain.add(req);
	domain.add(res);
	domain.run(next);
});

app.use(express.static('public'));
app.use(require('body-parser')());
// 页面测试用中间件，若请求的URL中包含查询字符串test=1则next()
app.use(function (req, res, next) {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1'; // locals是要传给视图的本地变量组成的Object
	next();
});

switch(app.get('env')) {
	case 'development':
		app.use(require('morgan')('dev')); // 紧凑的彩色的开发日志；
		break;
	case 'production':
		app.use(require('express-logger')({ // 支持日志循环；
			path: __dirname + '/log/requests.log'
		}));
		break;
}

app.use(cookieParser(credentials.cookieSecret));
app.use(expressSession({
	secret: credentials.cookieSecret,
	cookie: { // 这里设置的cookie属于在服务端session里存储的cookie，只有匹配相应的路径服务器才会通知浏览器设置此cookie；
		path: '/',
		maxAge: null
	}
}));

app.use(require('csurf')()); // 引入token验证机制，放置csrf攻击, 所有把表单和Ajax提交都应该附上token；
app.use(function (req, res, next) {
	res.locals._csrfToken = req.csrfToken();
	next();
})

app.use(function (req, res, next) {
	// console.log(req.session);
	if (req.session.flash) {
		res.locals.flash = req.session.flash;
	}
	delete req.session.flash; // 删除会话中的即显消息；
	next();
})
// 模仿数据库存储数据；
// function newsletterSignup() {

// }
// newsletterSignup.prototype.save = function (cb) {
// 	cb();
// }

// 利用Gmail当邮箱转发服务器，这时候需要开启Gmail的安全性较低的应用的访问权限，见https://myaccount.google.com/lesssecureapps
// var mailTransport = nodemailer.createTransport(smtpTransport({
// 	service: 'gmail',
// 	host: 'smtp.gmail.com',
// 	auth: {
// 		user: credentials.gmail.user,
// 		pass: credentials.gmail.password
// 	},
// 	connectionTimeout: 5000
// }));
// mailTransport.sendMail({
// 	from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
// 	to: 'mxydl2009@163.com',
// 	subject: 'Your Meadowlark Travel Tour',
// 	html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with Meadowlark Travel.</p>',
// 	text: 'Thank you for visiting.'
// }, function (err, info) {
// 	if (err) console.error('Unable to send email: ' + err);
// 	else console.log('Email sent: ' + info.response);
// });

app.use(function (req, res, next) {
	var cluster = require('cluster');
	if (cluster.isWorker) {
		console.log('Worker %d received request', cluster.worker.process.pid);
	}
	next();
})

app.use(function (req, res, next) {
	var now = new Date();
	res.locals.logoImage = now.getMonth() === 7?
	static('/img/logo_bud_clark.png'): static('/img/logo.png');
	next();
})

app.use(function(req, res, next) {
	if (req.session.cart) {
		var cart = req.session.cart;
		res.locals.cartItems = cart && cart.items ? cart.items.length : 0;
	}
	next();
});
// app.get('/api/attractions', function (req, res, next) {
// 	Attraction.find({approved: true}, function (err, attractions) {
// 		if (err) { return res.send(500, 'Error occurred: database error.')}
// 		res.json(attractions.map(function (a) {
// 			return  {
// 				name: a.name,
// 				id: a._id,
// 				description: a.description,
// 				location: a.location
// 			}
// 		}));
// 	});
// });
// app.post('/api/attraction', function (req, res) {
// 	var a = new Attraction({
// 		name: req.body.name,
// 		description: req.body.description,
// 		location: {
// 			lat: req.body.lat,
// 			lng: req.body.lng
// 		},
// 		history: {
// 			event: 'created',
// 			email: req.body.email,
// 			date: new Date()
// 		},
// 		approved: false
// 	});
// 	a.save(function (err, a) {
// 		if (err) { return res.send(500, 'Error occurred: database error.');}
// 		res.json({
// 			id: a._id
// 		});
// 	});
// });
// app.get('/api/attraction/:id', function (req, res) {
// 	Attraction.findById(req.params.id, function (err, a) {
// 		if (err) { return res.send(500, 'Error occurred: database error.');}
// 		res.json({
// 			name: a.name,
// 			id: a._id,
// 			description: a.description,
// 			location: a.location
// 		});
// 	});
// });
// 子域名admin路由
var admin = express.Router();
app.use(vhost('admin.*', admin));
admin.get('/', function (req, res) {
	res.render('admin/home');
});
admin.get('/users', function (req, res) {
	res.render('admin/users');
});
require('./routes.js')(app);
// 域名路由；移动到了./handlers/main.js
// app.get('/', (req, res) => {
// 	// console.log(req.signedCookies);
// 	// console.log(req.session);
// 	// console.log(req.sessionID);
// 	res.render('home');
// });

// // app.get('/querytest/', function (req, res, next) {
// // 	var name = req.query.name;
// // 	var city = req.query.city;
// // 	console.log('name: ' + name + '\n' + 'city: ' + city);
// // 	res.send('OK');
// // })

// app.get('/about', (req, res) => {
// 	let randomFortune = fortune.getFortune();
// 	res.render('about', {
// 		fortune: randomFortune,
// 		pageTestScript: '/qa/tests-about.js'
// 	});
// });

// app.get('/tours/hood-river', function (req, res) {
// 	res.render('tours/hood-river');
// });

// app.get('/tours/request-group-rate', (req, res) => {
// 	res.render('tours/request-group-rate');
// });

// app.get('/newsletter', function (req, res) {
// 	res.render('newsletter', {csrf: 'CSRF token goes here'});
// });
// app.post('/newsletter', function (req, res) {
// 	var name = req.body.name || '',
// 		email = req.body.email || '';
// 	console.log(email);
// 	if (!email) {
// 		// console.log(email.match(VALID_EMAIL_REGEX));
// 		if (req.xhr) return res.json({error: 'Invalid name email address.'});
// 		req.session.flash = {
// 			type: 'danger',
// 			intro: 'Validation error!',
// 			message: 'The email address you entered was not valid.'
// 		};
// 		return res.redirect(303, '/newsletter/archive');
// 	}
// 	new newsletterSignup({name: name, email: email}).save(function (err) {
// 		if (err) {
// 			if (req.xhr) return res.json({error: 'Database error.'});
// 			req.session.flash = {
// 				type: 'danger',
// 				intro: 'Database error!',
// 				message: 'There was a database error; please try again later.'
// 			};
// 			return res.redirect(303, '/newsletter/archive');
// 		}
// 		if (req.xhr) return res.json({success: true});
// 		req.session.flash = {
// 			type: 'success',
// 			intro: 'Thank you!',
// 			message: 'You have now been signed up for the newsletter.'
// 		};
// 		return res.redirect(303, '/newsletter/archive');
// 	});
// });

// app.post('/process', function (req, res) {
// 	// console.log('Form (from querystring): ' + req.query.form);
// 	// console.log('CSRF token (from hidden form field): ' + req.body._csrf);
// 	// console.log('Name (from visible form field): ' + req.body.name);
// 	// console.log('Email (from visible form field): ' + req.body.email);
// 	// res.redirect(303, '/thank-you');
// 	res.render('home');
// 	// if (req.xhr || req.accepts('json, html') === 'json') {
// 	// 	res.send({success: true});
// 	// } else {
// 	// 	res.redirect(303, '/thank-you');
// 	// }
// });
// 确定存在目录/data,如果没有则创建；
// var dataDir = __dirname + '/data';
// var vacationPhotoDir = dataDir + '/vacation-photo';
// fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
// fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);
// function saveContestEntry (contestName, email, year, month, photoPath) {
// // 存入数据库；
// }
// app.get('/contest/vacation-photo', function (req, res) {
// 	var now = new Date();
// 	res.render('contest/vacation-photo', {
// 		year: now.getFullYear(),
// 		month: now.getMonth()
// 	});
// });
// app.post('/contest/vacation-photo/:year/:month', function (req, res) {
// 	var form = new formidable.IncomingForm();
// 	// form.uploadDir = __dirname + '/uploadFiles';
// 	form.maxFileSize = 100; // 限制文件大小为100k以下；
// 	form.parse(req, function (err, fields, files) {
// 		// if (err) {
// 		// 	return res.redirect(303, '/error');
// 		// }
// 		if (err) {
// 			req.session.flash = {
// 				type: 'danger',
// 				intro: 'Oops',
// 				message: 'There was an error processing your submission. ' + 'Please try again.'
// 			};
// 			return res.redirect(303, '/contest/vacation-photo');
// 		}
// 		var photo = files.photo;
// 		var dir = vacationPhotoDir + '/' + Date.now();
// 		var path = dir + '/' + photo.name;
// 		fs.mkdirSync(dir);
// 		fs.renameSync(photo.path, dir + '/' + photo.name);
// 		saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
// 		req.session.flash = {
// 			type: 'success',
// 			intro: 'Good luck!',
// 			message: 'You have been entered into the contest.'
// 		};
// 		return res.redirect(303, '/contest/vacation-photo/entries');
// 		// console.log('received fields:');
// 		// console.log(fields);
// 		// console.log('received files:');
// 		// console.log(files);
// 		// res.redirect(303, '/thank-you');
// 	});
// });

// app.get('/vacation/:vacation', function (req, res, next) {
// 	Vacation.findOne({slug: req.params.vacation}, function (err, vacation) {
// 		if (err) {return next(err);}
// 		if (!vacation) return next();
// 		res.render('vacation', {vacation: vacation});
// 	})
// });
// app.get('/vacations', function (req, res) {
// 	Vacation.find({available: true}, function (err, vacations) {
// 		var context = {
// 			vacations: vacations.map(function (vacation) {
// 				return {
// 					sku: vacation.sku,
// 					name: vacation.name,
// 					description: vacation.description,
// 					price: vacation.getDisplayPrice(),
// 					inSeason: vacation.inSeason
// 				};
// 			})
// 		};
// 		res.render('vacations', context);
// 	});
// });
// app.get('/cart', function (req, res, next) {
// 	var cart = req.session.cart;
// 	if (!cart) {
// 		next();
// 	}
// 	res.render('cart', {cart: cart});
// })
// app.get('/cart/checkout', function (req, res, next) {
// 	var cart = req.session.cart;
// 	if (!cart) {
// 		next();
// 	}
// 	res.render('cart-checkout');
// })
// app.post('/cart/checkout', function (req, res, next) {
// 	var cart = req.session.cart;
// 	if (!cart) {
// 		next(new Error('Cart does not exist.'));
// 	}
// 	var name = req.body.name || '',
// 		email = req.body.email || '';
// 	if (!email.match(VALID_EMAIL_REGEX)) {
// 		next(new Error('Invalid email address.')); // 原作中的return res.next()有误，应为next()
// 	}
// 	cart.number = Math.random().toString().replace(/^0\.0*/, '');
// 	cart.billing = {
// 		name: name,
// 		email: email
// 	};
// 	// email通知客户收到订单；
// 	// res.render('email/cart-thank-you', {layout: null, cart: cart}, function (err, html) {
// 	// 	if (err) {console.log('error in email template')};
// 	// 	emailService.send(cart.billing.email, 'Thank you for booking your trip with Meadowlark Travel!', html);
// 	// });
// 	res.render('cart-thank-you', {cart: cart});
// })
// app.get('/cart/add', function (req, res, next) {
// 	var cart = req.session.cart || (req.session.cart = { items: [] });
// 	Vacation.findOne({ sku: req.query.sku }, function(err, vacation){
// 		if(err) return next(err);
// 		if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.query.sku));
// 		cart.items.push({
// 			vacation: vacation,
// 			guests: req.body.guests || 1,
// 		});
// 		res.redirect(303, '/cart');
// 	});
// })
// app.post('/cart/add', function (req, res, next) {
// 	var cart = req.session.cart || (req.session.cart = { items: [] });
// 	Vacation.findOne({sku: req.body.sku}, function (err, vacation) {
// 		if (err) {return next(err)};
// 		if (!vacation) {
// 			return next(new Error('Unknown vacation SKU: ' + req.body.sku));
// 		}
// 		cart.items.push({
// 			vacation: vacation,
// 			guests: req.body.guests || 1
// 		});
// 		res.redirect(303, '/cart');
// 	})
// })
app.use('/upload', function (req, res) {
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function () {
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function () {
			return '/uploads/' + now;
		}
	})(req, res, next); 
});

// app.get('/thank-you', function (req, res) {
// 	res.send('thank you for visiting.');
// })

// app.get('/newsletter/archive', function (req, res) {
// 	res.render('newsletter/archive');
// })
// app.get('/epic_fail', function (req, res, next) {
// 	process.nextTick(function () {
// 		// try {
// 		// 	throw new Error('Kaboom!');
// 		// } catch (err) {
// 		// 	next(err);
// 		// }
// 		throw new Error('Broken');
// 	});
// })

var apiOptions = {
	context: '/',
	domain: require('domain').create()
}
var rest = Rest.create(apiOptions);
app.use(vhost('api.*', rest.processRequest()));
// app.use(rest.processRequest());
apiOptions.domain.on('error', function (err) {
	console.log('API domain error.\n', err.stack);
	setTimeout(function () {
		console.log('Server shutting down after API domain error.');
		process.exit(1);
	}, 5000);
	server.close();
	var worker = require('cluster').worker;
	if (worker) worker.disconnect();
});
rest.get('/attractions', async function (req, content) {
	Attraction.find({approved: true}, function (err, attractions) {
		if (err) return ({error: 'Internal error.'});
		attractions.map(function (attraction) {
			return {
				name: attraction.name,
				description: attraction.description,
				location: attraction.location
			}
		});
	});
});
rest.post('/attraction', async function (req, content) {
	var a = new Attraction({
		name: req.body.name,
		description: req.body.description,
		location: {
			lat: req.body.lat,
			lng: req.body.lng
		},
		history: {
			event: 'created',
			email: req.body.email,
			date: new Date()
		},
		approved: false
	});
	a.save(function (err,a) {
		if (err) return ({error: 'Unable to add attraction.'});
		return {id: a._id};
	});
});
rest.get('/attraction/:id', async function (req, content) {
	Attraction.findById(req.params.id, function (err, a) {
		if (err) return {error: 'Unable to retrieve attraction.'};
		return {
			name: a.name,
			description: a.description,
			location: a.location
		};
	});
});

var autoViews = {};
app.use(function (req, res, next) {
	var path = req.path.toLowerCase();
	if (autoViews[path]) res.render(autoViews[path]);
	if (fs.existsSync(__dirname + '/views' + path + '.handlebars')) {
		autoViews[path] = path.replace(/^\//, '');
		res.render(autoViews[path]);
	}
});

app.use(function (req, res, next) {
	res.status(404);
	res.render('404');
});

app.use(function (err, req, res, next) {
	console.log('进入错误捕捉中间件');
	console.error(err.stack);
	res.type('text/html');
	res.status(500);
	res.render('500');
});
process.on('uncaughtException', function (err) {
	console.error(err.stack);
})
// app.listen(app.get('port'), function () {
// 	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl - C to terminate.');
// });

// http.createServer(app).listen(app.get('port'), function () {
// 	console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port')
// 	+ '; press Ctrl-C to terminate.');
// })

function startServer() {
	https.createServer(options, app).listen(app.get('port'), function () {
		console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port')
		+ '; press Ctrl-C to terminate.');
	});
}
// if (require.main === module) {
// 	startServer();
// } else {
// 	module.exports = startServer; // 暴露启动服务器的函数；
// }
var server = http.createServer(app).listen(app.get('port'), function () {
	console.log(`Listening on port ${app.get('port')}`);
})

// MongoDB数据库相关代码
// 初始化数据
Vacation.find(function (err, vacations) {
	if (vacations.length) return; // 如果有数据，则返回；
	new Vacation({
		name: 'Hood River Day Trip',
		slug: 'hood-river-day-trip',
		category: 'Day Trip',
		sku: 'HR199',
		description: 'Spend a day sailing on the Columbia and enjoying craft beers in Hood River!',
		priceInCents: 9995,
		tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
		inSeason: true,
		maximumGuests: 16,
		available: true,
		packagesSold: 0
	}).save();
	new Vacation({
		name: 'Oregon Coast Getaway',
		slug: 'oregon-coast-getaway',
		category: 'Weekend Getaway',
		sku: 'OC39',
		description: 'Enjoy the ocean air and quaint coastal town!',
		priceInCents: 269995,
		tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
		inSeason: false,
		maximumGuests: 8,
		available: true,
		packagesSold: 0
	}).save();
	new Vacation({
		name: 'Rock Climbing in Bend',
		slug: 'rock-climbing-in-bend',
		category: 'Adventure',
		sku: 'B99',
		description: 'Experience the thrill of climbing in the high desert.',
		priceInCents: 289995,
		tags: ['Weekend getaway', 'bend', 'high desert', 'rock climbing'],
		inSeason: true,
		requireWaiver: true,
		maximumGuests: 4,
		available: true,
		packagesSold: 0,
		notes: 'The tour guide is currently recovering from a skiing accident.'
	}).save();
});

Attraction.find(function (err, attractions) {
	if (attractions.length) return; // 如果有数据，则返回；
	new Attraction({
		name: 'china',
		description: 'a country',
		location: {
			lat: 30,
			lng: 39
		},
		history: {
			event: 'resolution',
			notes: 'nothing',
			email: 'mxydl2009@163.com',
			date: new Date()
		},
		updateId: 'no',
		approved: false
	}).save(function (err, attraction) {
		console.log('attraction is saved.');
	});
})