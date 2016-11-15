/** # Risk players

TODO
*/
var players = exports.players = {};

/** ## Simple player

TODO
*/
players.RiskSimplePlayer = declare(Player, {
	constructor: function RiskSimplePlayer(params) {
		Player.call(this, params);
		this.random = params.random || Randomness.DEFAULT;
	},
	
	decision: function decision(game, role) {
		var moves = game.moves()[role],
			random = this.random,
			move;
		switch (game.stage[0]) { 
			case game.STAGES.REINFORCE:
				return this.decisionReinforce(game, role);
			case game.STAGES.ATTACK:
				return this.decisionAttack(game, role);
			case game.STAGES.OCCUPY:
				return this.decisionOccupy(game, role);
			case game.STAGES.FORTIFY:
				return this.decisionFortify(game, role);
		}
		raise("Unsupported stage ", game.stage[0], "!");
	},
	
	decisionReinforce: function decisionReinforce(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		var frontiers = {};
		game.conflictFrontiers(role).forEachApply(function (t1, t2) {
			frontiers[t1] = (frontiers[t1] |0) + 1;
		});
		moves = moves.filter(function (m) {
			return frontiers.hasOwnProperty(m[1]);
		});
		moves.sort(function (m1, m2) {
			return frontiers[m2] - frontiers[m1]; // Descending order of frontier count.
		});
		// Random biased towards territories with more conflicting frontiers.
		return moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},
	
	decisionAttack: function decisionAttack(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		moves = moves.filter(function (m) {
			return m[0] === 'ATTACK' && m[3] === game.MAX_ATTACK;
			/* */
		});
		return random.choice(moves) || game.PASS_MOVE;// como ponderar para que tenga preferencia el ataque por territorio que determina conq de cont
	},
	
	decisionOccupy: function decisionOccupy(game, role) {
		var moves = game.moves()[role];
		var maxCount = iterable(moves).select(1).max();
		return maxCount < 2 ? moves[0] : ["OCCUPY", maxCount - 1];
	},
	
	decisionFortify: function decisionFortify(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		moves = moves.filter(function (m) {
			return m[0] === 'FORTIFY' && game.armyCount(m[1]) - m[3] >= game.armyCount(m[2]);
		});
		moves.sort(function (m1, m2) {
			return m2[3] - m1[3]; // Descending order of amount.
		});
		// Random biased towards greater moves of armies. 
		return moves.length < 1 ? game.PASS_MOVE : moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},
	
	// ## Utilities ################################################################################
	
	'static __SERMAT__': {
		identifier: 'RiskSimplePlayer',
		serializer: function serialize_RiskSimplePlayer(obj) {
			var ser = Player.__SERMAT__.serializer(obj),
				args = ser[0];
			args.random = obj.random;
			return ser;
		}
	}
});


/** 
TODO
*/
players.RiskContinentPlayer = declare(Player, {
	constructor: function RiskContinentPlayerPlayer(params) {
		params = params || {};
		Player.call(this, params);
		this.random = params.random || Randomness.DEFAULT;
	},
	
	decision: function decision(game, role) {
		var moves = game.moves()[role],
			random = this.random,
			move;
		switch (game.stage[0]) { 
			case game.STAGES.REINFORCE:
				return this.decisionReinforce(game, role);
			case game.STAGES.ATTACK:
				return this.decisionAttack(game, role);
			case game.STAGES.OCCUPY:
				return this.decisionOccupy(game, role);
			case game.STAGES.FORTIFY:
				return this.decisionFortify(game, role);
		}
		raise("Unsupported stage ", game.stage[0], "!");
	},
	
	targetContinent: function targetContinent(game, role) {
		var continent = "",
			count = 13;
		iterable(game.playerPendingTerritories(role)).forEachApply(function (c, a) {
			
			if (a !== 0 && a < count && game.continentAdyacent(role, c)){
				count = a;
				continent = c;
			}
		});
		return continent;
	},
	
	decisionReinforce: function decisionReinforce(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		var frontiers = {},
			continent = this.targetContinent(game, role);
		game.conflictFrontiers(role).forEachApply(function (t1, t2) {
			if(game.boardMap.territoryContinent(t2) === continent){
				frontiers[t1] = (frontiers[t1] |0) + 1;
			}
		});

		moves = moves.filter(function (m) {
			return frontiers.hasOwnProperty(m[1]);
			

		});
		moves.sort(function (m1, m2) {
			return frontiers[m2] - frontiers[m1]; 
		});

		return moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},
	

	decisionAttack: function decisionAttack(game, role) {
		var moves = game.moves()[role],
			random = this.random,
			continent = this.targetContinent(game, role);
		moves = moves.filter(function (m) {
			return m[0] === 'ATTACK' && m[3] === game.MAX_ATTACK && game.boardMap.territoryContinent(m[2]) === continent || conquestProbability(game.armyCount(m[1]), game.armyCount(m[2]) > 0.75);
		});
		return random.choice(moves) || game.PASS_MOVE;
	},
	
	decisionOccupy: function decisionOccupy(game, role) {
		var moves = game.moves()[role];
		var maxCount = iterable(moves).select(1).max();
		return maxCount < 2 ? moves[0] : ["OCCUPY", maxCount - 1];
	},
	
	decisionFortify: function decisionFortify(game, role) {
		/*var moves = game.moves()[role],
			random = this.random;
		moves = moves.filter(function (m) {
			return m[0] === 'FORTIFY' && game.armyCount(m[1]) - m[3] >= game.armyCount(m[2]);
		});
		moves.sort(function (m1, m2) {
			return m2[3] - m1[3]; // Descending order of amount.
		});
		// Random biased towards greater moves of armies. */
		return ["PASS"];//moves.length < 1 ? game.PASS_MOVE : moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},
	
	// ## Utilities ################################################################################
	
	'static __SERMAT__': {
		identifier: 'RiskContinentPlayer',
		serializer: function serialize_RiskContinentPlayer(obj) {
			var ser = Player.__SERMAT__.serializer(obj),
				args = ser[0];
			args.random = obj.random;
			return ser;
		}
	}
});