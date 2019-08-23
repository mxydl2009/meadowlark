var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var vacationSchema = new Schema({
    name: String,
    slug: String,
    category: String,
    sku: String,
    description: String,
    priceInCents: Number,
    tags: [String],
    inSeason: Boolean,
    available: Boolean,
    requireWaiver: Boolean,
    maximumGuests: Number,
    notes: String,
    packagesSold: Number
});
vacationSchema.methods.getDisplayPrice = function () {
    return '$' + (this.priceInCents / 100).toFixed(2);
};
var Vacation = mongoose.model('Vacation', vacationSchema);
module.exports = Vacation;
