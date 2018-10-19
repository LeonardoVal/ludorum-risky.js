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

		ui.clearConstructedAction();
		ui.container.onclick = this.handleUserLeftClick.bind(null,ui);
		ui.container.oncontextmenu = this.handleUserRightClick.bind(null,ui);
		document.getElementById("setNumberOfArmies").onclick = this.handleUserSetNumberOfArmies.bind(null,ui);
		document.getElementById("pass").onclick = this.handleUserPass.bind(null,ui);
	},

	constructedAction: {},

	/** Forget the action that user was constructing		
	*/
	clearConstructedAction: function(){
		this.constructedAction={};
	},


	handleUserPass : function(ui){
		ui.constructedAction.pass=true;
		ui.performConstructedActionIfPossible();
	},

	/** Called every time the user clicks. This function is responsible of constructing the user action,
	based on the previous state of the constructed action, and the new interaction detected. 
	Once it detects that an action was completly contracted, it triggers app.ui.perform
	*/
	handleUserLeftClick : function(ui,clickEvent){
		var country = ui.resolveTargetCountry(clickEvent);
		var button = clickEvent.button; // 0 = left, 1=middle, 2=right

		if(country==="NaC"){
			ui.clearConstructedAction(); // The human clicked outside of country, so he wanted to cancel everything
		}else if(button===0){ 
			/**The user used "Primary action", 
			he either selected the "action country", wanting to abort the others steps of the action
			or selected a new "action country", aborting the other steps of the actions
			or he didn't have an "action country" yet
			THEN, I cancel everything and set the clicked country as action country
			*/
			ui.clearConstructedAction();
			ui.constructedAction.actionCountry = country;
		}

		ui.performConstructedActionIfPossible();
	},

	handleUserRightClick : function(ui,clickEvent){
		clickEvent.preventDefault(); //This is to avoid the context menu
		var country = ui.resolveTargetCountry(clickEvent);
		var button = clickEvent.button; // 0 = left, 1=middle, 2=right
		
		if(country==="NaC"){
			// The human clicked outside of country, so nothing will be done
		}else if(button===2){ 
			/**The user used "target action" */
			ui.constructedAction.targetCountry = country;
		}

		ui.performConstructedActionIfPossible();
	},

	handleUserSetNumberOfArmies : function(ui){
		var numberOfArmies = document.getElementById("numberOfArmys").value;

		ui.constructedAction.numberOfArmies = numberOfArmies;

		ui.performConstructedActionIfPossible();
	},

	/** Receives a clickEvent, and returns the name of clicked country. Returns "NaC" if the target is not a country
	*/
	resolveTargetCountry : function(clickEvent){
		var id = clickEvent.target.parentNode.id;
		var country = "NaC";
		if(/territory-\w+/.test(id)){
			country = id.split("-")[1];
		}

		return country;
	},

	generateAction : function(){
		var action;
		if(this.constructedAction.pass){
			action = ["PASS"];
			return action;
		}else{
			if(typeof this.constructedAction.actionCountry==="undefined"){
			//No action country, Nothing I can do
			}else{
				if(typeof this.constructedAction.numberOfArmies==="undefined"){
					//Action country, but no number of armies, nothing I can do
				}else{				
					if(typeof this.constructedAction.targetCountry==="undefined"){
						//I have an action country and a number of armys

						//It may be a reinforce
						action = ["REINFORCE",this.constructedAction.actionCountry,parseInt(this.constructedAction.numberOfArmies)];
						if(this.match.state().isValidReinforce(action)){
							return action;
						}

						//Or it may be a occupy
						action = ["OCCUPY", parseInt(this.constructedAction.numberOfArmies)];
						if(this.match.state().isValidOccupy(action)){
							return action;
						}
					}else{
						//I have an action country, a number of armies, and a target

						//It may be an attack
						action = ["ATTACK", 
										this.constructedAction.actionCountry,
										this.constructedAction.targetCountry,
										parseInt(this.constructedAction.numberOfArmies)];
						if(this.match.state().isValidAttack(action)){
							return action;
						}

						//Or it may be a fortify
						action = ["FORTIFY", 
										this.constructedAction.actionCountry,
										this.constructedAction.targetCountry,
										parseInt(this.constructedAction.numberOfArmies)];
						if(this.match.state().isValidFortify(action)){
							return action;
						}
					}
				}
			}
		}
		
		return "NaA";
	},

	performConstructedActionIfPossible : function(){
		var action = this.generateAction();
		if(action!=="NaA"){
			this.perform(action);
		}
	}



}); // RiskSVGInterface
