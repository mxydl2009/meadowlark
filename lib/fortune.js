let fortunesCookies = [
	"Conquer your fears or they will conquer you.",
	'Rivers need spring.',
	"Do not fear what you don't know.",
	'You will have a pleasant surprise.',
	'Whenever possible, keep it simple.'
];
module.exports.getFortune = function () {
    let idx = Math.floor(Math.random() * fortuneCookies.length);
    return fortuneCookies[idex];
}