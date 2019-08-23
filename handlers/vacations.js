var Vacation = require('../models/vacation.js');
module.exports.vacation = function (req, res, next) {
	Vacation.findOne({slug: req.params.vacation}, function (err, vacation) {
		if (err) {return next(err);}
		if (!vacation) return next();
		res.render('vacation', {vacation: vacation});
	})
}
module.exports.vacations = function (req, res) {
	Vacation.find({available: true}, function (err, vacations) {
		var context = {
			vacations: vacations.map(function (vacation) {
				return {
					sku: vacation.sku,
					name: vacation.name,
					description: vacation.description,
					price: vacation.getDisplayPrice(),
					inSeason: vacation.inSeason
				};
			})
		};
		res.render('vacations', context);
	});
}
module.exports.cart = function (req, res, next) {
	var cart = req.session.cart;
	if (!cart) {
		next();
	}
	res.render('cart', {cart: cart});
}
module.exports.checkout = function (req, res, next) {
	var cart = req.session.cart;
	if (!cart) {
		next();
	}
	res.render('cart-checkout');
}
module.exports.checkoutProcessPost = function (req, res, next) {
	var cart = req.session.cart;
	if (!cart) {
		next(new Error('Cart does not exist.'));
	}
	var name = req.body.name || '',
		email = req.body.email || '';
	if (!email.match(VALID_EMAIL_REGEX)) {
		next(new Error('Invalid email address.')); // 原作中的return res.next()有误，应为next()
	}
	cart.number = Math.random().toString().replace(/^0\.0*/, '');
	cart.billing = {
		name: name,
		email: email
	};
	res.render('cart-thank-you', {cart: cart});
}
module.exports.cartAdd = function (req, res, next) {
	var cart = req.session.cart || (req.session.cart = { items: [] });
	Vacation.findOne({ sku: req.query.sku }, function(err, vacation){
		if(err) return next(err);
		if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.query.sku));
		cart.items.push({
			vacation: vacation,
			guests: req.body.guests || 1,
		});
		res.redirect(303, '/cart');
	});
}
module.exports.cartAddProcessPost = function (req, res, next) {
	var cart = req.session.cart || (req.session.cart = { items: [] });
	Vacation.findOne({sku: req.body.sku}, function (err, vacation) {
		if (err) {return next(err)};
		if (!vacation) {
			return next(new Error('Unknown vacation SKU: ' + req.body.sku));
		}
		cart.items.push({
			vacation: vacation,
			guests: req.body.guests || 1
		});
		res.redirect(303, '/cart');
	})
}