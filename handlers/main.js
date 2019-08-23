var fortune = require('../lib/fortune.js');
function newsletterSignup() {

}
newsletterSignup.prototype.save = function (cb) {
	cb();
}
// 首页路由处理器
module.exports.home = function (req, res) {
    res.render('home');
}

// about页路由处理器
module.exports.about = function (req, res) {
    let randomFortune = fortune.getFortune();
	res.render('about', {
		fortune: randomFortune,
		pageTestScript: '/qa/tests-about.js'
	});
}
// newsletter页路由处理器
module.exports.newsletter = function (req, res) {
	res.render('newsletter', {csrf: 'CSRF token goes here'});
}
module.exports.newsletterProcessPost = function (req, res) {
	var name = req.body.name || '',
		email = req.body.email || '';
	// console.log(email);
	if (!email) {
		// console.log(email.match(VALID_EMAIL_REGEX));
		if (req.xhr) return res.json({error: 'Invalid name email address.'});
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you entered was not valid.'
		};
		return res.redirect(303, '/newsletter/archive');
	}
	new newsletterSignup({name: name, email: email}).save(function (err) {
		if (err) {
			if (req.xhr) return res.json({error: 'Database error.'});
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.'
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if (req.xhr) return res.json({success: true});
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.'
		};
		return res.redirect(303, '/newsletter/archive');
	});
}
module.exports.newsletterArchive = function (req, res) {
	res.render('newsletter/archive');
}
// thank-you页面路由处理器
module.exports.thankYou = function (req, res) {
	res.render('thank-you');
}
// 异步抛出错误路由处理器
module.exports.epicFail = function (req, res) {
	process.nextTick(function () {
		throw new Error('Broken');
	});
}
