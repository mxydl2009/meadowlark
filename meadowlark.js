// 入口文件
let express = require('express');
let forturne = require('./lib/fortune.js');
// 创建应用实例
let app = express();
// 引入handlebars视图引擎，create()方法创建handlebars实例来注册应用的引擎
let handlebars = require('express-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('home');
})

app.get('/about', (req, res) => {
	let randomFortune = fortunes.getFortune();
	res.render('about', {fortune: randomFortune});
})

app.use(function (req, res, next) {
	res.status(404);
	res.render('404');
})

app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.type('text/plain');
	res.status(500);
	res.render('500');
})

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl - C to terminate.');
})

