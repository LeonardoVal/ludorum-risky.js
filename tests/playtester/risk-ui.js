require.config({ paths: {
// RequireJS' plugins.
	'text': '../lib/require-text',
	'img': '../lib/require-image',
// Dependencies
	'creatartis-base': '../lib/creatartis-base', 
	'sermat': '../lib/sermat-amd',
	'ludorum': '../lib/ludorum',
	'ludorum-risky': '../lib/ludorum-risky',
	//'firebase' : 'https://www.gstatic.com/firebasejs/3.1.0/firebase.js'
}});
require([
	'ludorum', 'creatartis-base', 'sermat', 'ludorum-risky',
	'img!img/map_grey.jpg', 'img!img/names.png'
], function (ludorum, base, Sermat, ludorum_risky, img_MapGrey, img_Names) {
	// ## Global definitions. ######################################################################
	window.base = base;
	window.Sermat = Sermat;
	window.ludorum = ludorum;
	window.ludorum_risky = ludorum_risky;
	var APP = window.APP = { };
	
	// ## User interface ###########################################################################
	
	/** Custom HTML interface for Risk.
	*/
	var RiskUIPlayer = base.declare(ludorum.players.UserInterfacePlayer, {
		constructor: function RiskUIPlayer(params) {
			ludorum.players.UserInterfacePlayer.call(this, params);
			params.Risk.onTerritoryClick = this.onTerritoryClick.bind(this);
			params.Risk.onBackgroundClick = this.onBackgroundClick.bind(this);
		},
		
		decision: function decision(game, player) {
			var p = this;
			this.game = game;
			this.player = player;
			this.territoryFrom = null;
			if (game.stage[0] === game.STAGES.OCCUPY) {
				return this.onOccupy();
			} else {
				var r = ludorum.players.UserInterfacePlayer.prototype.decision.call(this, game, player);
				r.done(function () {
					p.game = null;
					p.player = null;
				});
				return r;
			}
		},
		
		onTerritoryClick: function onTerritoryClick(path, evt) {
			var game = this.game;
			if (game) {
				var t = TerritoryNames[path.attrs.id];
				switch (game.stage[0]) {
					case game.STAGES.REINFORCE: this.onClick_reinforce(t, evt); break;
					case game.STAGES.ATTACK: this.onClick_attack(t, evt); break;
					case game.STAGES.OCCUPY: this.onClick_occupy(t, evt); break;
					case game.STAGES.FORTIFY: this.onClick_fortify(t, evt); break;
				}
			}
		},
		
		onClick_reinforce: function onClick_reinforce(territory, evt) {
			var game = this.game,
				input = prompt("How many reinforcements for "+ territory +"?"),
				count = Math.floor(input), 
				move = ["REINFORCE", territory, count],
				onError = function(error){
					console.log(error);
					APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Information:") + "<strong>";
					APP.gameInfoMsg.innerHTML = base.Text.escapeXML("Cannot reinforce '"+ input +"' armies!");
				};
			if (input !== null && game.isValidReinforce(move, onError)) {
				this.perform(move);
				//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Information:") + "<strong>";
				APP.gameInfoMsg.innerHTML = base.Text.escapeXML("Reinforced "+ territory +" with "+ count +" armies.");
			}
		},
		
		onClick_attack: function onClick_attack(territory, evt) {
			if (evt.button === 0) { // Left click.
				this.territoryFrom = territory;
			} else if (evt.button === 2 && this.territoryFrom) { // Right click.
				var game = this.game,
					input = prompt("Attacking "+ territory +" from "+ this.territoryFrom +". Use how many armies?"),
					count = Math.floor(input),
					move = ["ATTACK", this.territoryFrom, territory, count],
					onError = function(error){
						console.log(error);
						//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Alert:") + "<strong>";
						APP.gameInfoMsg.innerHTML = base.Text.escapeXML(error);
					};
				if (game.isValidAttack(move, onError)){//count > 0 && count <= 3) {
					this.perform(move);
					//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Information:") + "<strong>";
					APP.gameInfoMsg.innerHTML = base.Text.escapeXML("Attacked "+ move[2] +" from "+ move[1] + " with " + move[3] + " armies.");
				}
			}
		},
			
		onOccupy: function onOccupy() {
			var game = this.game, input, count;
			do {
				input = prompt("Conquered "+ game.stage[2] +"! Occupy with how many armies?");
				count = Math.floor(input);
				move = ["OCCUPY", count];
				onError = function(error){
					console.log(error);
					//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Alert:") + "<strong>";
					APP.gameInfoMsg.innerHTML = base.Text.escapeXML(error);
				};
			} while (!game.isValidOccupy(move, onError));
			//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Information:") + "<strong>";
			APP.gameInfoMsg.innerHTML = base.Text.escapeXML("Occupied "+ game.stage[2] +" from "+ game.stage[1] + " with " + move[1] + " armies.");
			return ["OCCUPY", count];
		},
		
		onClick_fortify: function onClick_fortify(territory, evt) {
			var game = this.game, input, count;
			if (evt.button === 0) { // Left click.
				this.territoryFrom = territory;
			} else if (evt.button === 2 && this.territoryFrom) { // Right click.
				input = prompt("Fortifying "+ territory +" from "+ this.territoryFrom +". Use how many armies?");
				count = Math.floor(input);
				var move = ["FORTIFY", this.territoryFrom, territory, count],
				onError = function(error){
					console.log(error);
					//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Alert:") + "<strong>";
					APP.gameInfoMsg.innerHTML = base.Text.escapeXML(error);
				};
				if (game.isValidFortify(move, onError)) {
					this.perform(move);
					//APP.gameInfoTag.innerHTML = "<strong>" + base.Text.escapeXML("Information:") + "<strong>";
					APP.gameInfoMsg.innerHTML = base.Text.escapeXML("Fortified "+ move[2] +" from "+ move[1] + " with " + move[3] + " armies.");
				}
			}
		},
		
		onBackgroundClick: function onBackgroundClick(evt) {
			var game = this.game;
			if (game.stage[0] === game.STAGES.ATTACK && confirm("Stop attacking?")) {
				this.perform(game.PASS_MOVE);
			} else if (game.stage[0] === game.STAGES.FORTIFY && confirm("Pass fortifying?")) {
				this.perform(game.PASS_MOVE);
			}
		}
	});
	
	// ## Main #####################################################################################
	
	APP.boardMap = ludorum_risky.MAPS.classic;
	APP.players = ludorum_risky.Risk.prototype.players;
	//APP.round;
	//APP.armies;// = ludorum_risky.Risk.armyDistribution(APP.players, APP.boardMap);	
	//APP.scenario;
	
	
/* 	var input; 
	do {
		input = prompt("Enter ID to set map");
	}while (!Math.floor(input) && (input !== 1 || input !== 1100 || input !== 2200 || input !== 3300)); */
	//console.log(firebase);

	var input = prompt("Enter ID to set map", "Leave blank to load random map");	
		
	var scenario, players;
	//console.log(window.input);
	switch(input){
		case '123':
			APP.scenario = "allTotalitiesButWhite";
			APP.armies = ludorum_risky.scenarios.allTotalitiesButWhite;
			players = APP.players = base.Iterable.range(6).map(function (i) {
				return new ludorum_risky.players.RiskContinentPlayer({ name: 'Player#'+ i });
			}).toArray();
			break;
		case '312':
			APP.scenario = "spreadOut";
			APP.armies = ludorum_risky.scenarios.spreadOut;
			players = APP.players = base.Iterable.range(6).map(function (i) {
				return new ludorum_risky.players.RiskContinentPlayer({ name: 'Player#'+ i });
			}).toArray();
			break;
		case '231':
			APP.scenario = "whiteOceania";
			APP.armies = ludorum_risky.scenarios.whiteOceania;
			players = APP.players = base.Iterable.range(6).map(function (i) {
				return new ludorum_risky.players.RiskContinentPlayer({ name: 'Player#'+ i });
			}).toArray();
			break;
		default:
			APP.scenario = "aleatory";
			APP.armies = ludorum_risky.Risk.armyDistribution(APP.players, APP.boardMap);
			players = APP.players = base.Iterable.range(6).map(function (i) {
				return new ludorum.players.RandomPlayer({ name: 'Random#'+ (i+1) });
			}).toArray();
	}
	
	APP.game = new ludorum_risky.Risk({
		boardMap: APP.boardMap,
		armies: APP.armies//armies: ludorum_risky.Risk.armyDistribution(APP.players, APP.boardMap)//Risk.armyDistribution(APP.players, APP.boardMap)
		//rounds: 10
	});
	
	APP.gameStage = document.getElementById ("gameStage");
	APP.gameRound = document.getElementById ("gameRound");
	APP.gamePlayer = document.getElementById ("gamePlayer");
	APP.gameInfoTag = document.getElementById ("gameInfoTag");
	APP.gameInfoMsg = document.getElementById ("gameInfoMsg");
	
	
	Risk.init(APP.game);
	
/* 	var players = APP.players = base.Iterable.range(6).map(function (i) {
		//return new ludorum.players.RandomPlayer({ name: 'Random#'+ (i+1) });
		return new ludorum_risky.players.RiskContinentPlayer({ name: 'Player#'+ i });
	}).toArray(); */
	
	ludorum.players.WebWorkerPlayer.create({
		playerBuilder: new Function('return new ludorum_risky.players.RiskContinentPlayer({name: "RiskContinentPlayer"});'),
		dependencies: [ludorum_risky]
	}).then(function (p) { 
		//players[0] = p; //TODO
		
		
		players[0] = new RiskUIPlayer({ Risk: Risk });
		//players[0] = new ludorum_risky.players.RiskSimplePlayer({ name: 'Player#0' });
		
		var match = APP.match = new ludorum.Match(APP.game, APP.players);
		
		match.events.on('move', function (game, moves, match) {
		});
		
		match.events.on('next', function (gameBefore, gameAfter, match) {
			if (gameAfter instanceof ludorum_risky.Risk) {
				Risk.divideTerritories(gameAfter);
			}
		});
		
		match.events.on('end', function (game, result, match) {
			console.log(Sermat.ser(result));//FIXME
			console.log(result);
			var winner, r;
			for (r in result){
				if(result[r] === 5){
					winner = r;
				}
			}
			if(typeof winner === "undefined") {
				winner = "Nobody";
				
			}
			alert("************** " + winner + " won!!!! **************");
			
			////////// TODO ////////////
			var f = new Date();
			//var actualDate = f.getDate() + "/" + (f.getMonth() +1) + "/" + f.getFullYear();
			//console.log(actualDate);
			
			firebase.database().ref('matches/' + APP.scenario + '/' + window.user.uid).push({
				date: (new Date()).toLocaleString(), 
				email: window.user.email, 
				name: window.user.displayName, 
				scenario: APP.scenario, 
				rounds: APP.round,
				winner: winner
			});

					
			////////////////////////////
						
			Risk.divideTerritories(game);
			
		});
		return match.run();
	});
	//}
});