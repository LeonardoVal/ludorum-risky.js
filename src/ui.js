/** # User interface

User interface for playtesters based on [Scalable Vector Graphics (SVG)](https://www.w3.org/Graphics/SVG/).

Each territory and continent must be defined as a group (`<g>` element), with the identifier 
`territory-name` or `continent-name`. Territory groups must include a path element (`<path>`) 
demarking the territory area, and a text element (`<text>`) to indicate the amount of armies present
in the territory. The player owning each territory is indicated with their colour.

It is recommended to include any other drawings or details of the board in two groups called 
`foreground` and `background`.  
*/
exports.RiskSVGInterface = base.declare(ludorum.players.UserInterface, {
	/** The constructor takes the `config` argument all ludorum's `UserInterface` take. The 
	`container` key defines the SVG element to use. This can be a reference to the SVG element 
	itself, or its `id` as a string. If it is missing, the first SVG element in the document is
	used.  
	*/
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

	/** Conquered territories must be highlighted with the corresponding colour of the player that
	owns them. The `fillColours` property defines the colours (in CSS format) that are assigned to 
	the areas in the SVG for each territory.
	*/
	fillColours: {
		White:  'rgba(255,255,255,0.66)',
		Yellow: 'rgba(255,255, 50,0.66)',
		Red:    'rgba(255, 50, 50,0.66)',
		Green:  'rgba(  0,200,  0,0.66)',
		Blue:   'rgba( 50, 50,255,0.66)',
		Black:  'rgba(128,128,128,0.66)'
	},

	/** The given SVG element must be checked to include all territories and continents defined in
	the game's `BoardMap`.
	*/
	__checkSVG__: function __checkSVG__(game, svg) {
		//TODO
	},

	/** The display of the board simply updates army counts and territory colours.
	*/
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
