/** # User interface

User interface for playtesters based on [Scalable Vector Graphics (SVG)](https://www.w3.org/Graphics/SVG/).

*/

/** ## User interface ##############################################################################
*/
exports.RiskSVGInterface = base.declare(ludorum.players.UserInterface, {
	constructor: function RiskSVGInterface(config) {
		config = config || {};
		ludorum.players.UserInterface.call(this, config);
		this.document = config.document || base.global.document;
		this.container = config.container;
		if (!this.container) {
			this.container = this.document.getElementsByTagName('svg')[0];
		} else if (typeof this.container === 'string') {
			this.container = this.document.getElementById(this.container);
		}
	},

	fillColours: {
		White:  'rgba(255,255,255,0.66)',
		Yellow: 'rgba(255,255, 50,0.66)',
		Red:    'rgba(255, 50, 50,0.66)',
		Green:  'rgba(  0,200,  0,0.66)',
		Blue:   'rgba( 50, 50,255,0.66)',
		Black:  'rgba(128,128,128,0.66)'
	},

	/**
	*/
	__checkSVG__: function __checkSVG__(game, svg) {
		//TODO
	},

	display: function display(game) {
		if (game.isContingent) {
			return;
		}
		var ui = this,
			document = this.document,
			armies = game.uncompressGameState(game.armies);
		iterable(armies).forEachApply(function (t, s) {
			raiseIf(!document.querySelector('#territory-'+ t),
				"No element found for #territory-", t, "!");
			var area = document.querySelector('#territory-'+ t +' path'),
				text = document.querySelector('#territory-'+ t +' text tspan') ||
					document.querySelector('#territory-'+ t +' text'),
				army = s[0],
				count = +s[1];
			area.style.fill = ui.fillColours[army];
			text.innerHTML = count +"";
		});
	}
}); // RiskSVGInterface
