var main = require('./handlers/main.js');
var tours = require('./handlers/tours.js');
var contest = require('./handlers/contest.js');
var vacations = require('./handlers/vacations.js');

module.exports = function (app) {
    app.get('/', main.home);
    app.get('/about', main.about);
    app.get('/newsletter', main.newsletter);
    app.post('/newsletter', main.newsletterProcessPost);
    app.get('/newsletter/archive', main.newsletterArchive);
    app.get('/thank-you', main.thankYou);
    app.get('/epic_fail', main.epicFail);
    app.get('/tours/hood-river', tours.hoodRiver);
    app.get('/tours/request-group-rate', tours.requestGroupRate);
    app.get('/contest/vacation-photo', contest.vacationPhoto);
    app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoProcessPost);
    app.get('/vacation/:vacation', vacations.vacation);
    app.get('/vacations', vacations.vacations);
    app.get('/cart', vacations.cart);
    app.get('/cart/checkout', vacations.checkout);
    app.post('/cart/checkout', vacations.checkoutProcessPost);
    app.get('/cart/add', vacations.cartAdd);
    app.post('/cart/add', vacations.cartAddProcessPost);
}