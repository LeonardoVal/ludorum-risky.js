/** # Risk players

Automatic players for Risk.
*/
var players = exports.players = {};

/** ## Heuristics ##################################################################################

Heuristic functions that may be used in MCTS or MiniMax. Risk is very complex, so if one of these
algorithms is used, expect decisions of the automatic player to take a considerable amount of time.
*/
players.heuristics = {
	/** + `territoryCount` returns the proportion of territories a given player controls.
	*/
	territoryCount: function territoryCount(game, player) {
		return game.playerTerritories(player).length / game.boardMap.territories.length;
	},
	
	/** + `continentCount` returns the proportion of continents a given player controls.
	*/
	continentCount: function continentCount(game, player) {
		return game.playerContinents(player).length / game.boardMap.continents.length;
	},
	
	/** + ``
	*/
	territoryHeuristic: function territoryHeuristic(game, player) {
		var armies = game.uncompressGameState(game.armies),
			counts = {},
			totalCount = 0;
		iterable(armies).forEachApply(function (n, t) {
			counts[t[0]] = (counts[t[0]] |0) + 1;
			totalCount++;
		});
		var countMax = -Infinity,
			countMin = +Infinity,
			playerCount = 0;
		iterable(counts).forEachApply(function (p, c) {
			if (countMax < c) countMax = c;
			if (countMin > c) countMin = c;
			playerCount++;
		});
		return countMax === countMin ? 0 
			: ((counts[player] |0) - totalCount / playerCount) / (countMax - countMin);
	},
	
	heuristicPru: function heuristicPru(game, player) {
		//return ((game.playerContinents(player).length + 1) / game.boardMap.continents.length) * (game.playerTerritories(player).length / game.boardMap.territories.length);
		return (game.playerContinents(player).length * 4 + game.playerTerritories(player).length) / (game.boardMap.continents.length * 4 + game.boardMap.territories.length);
	},
	heuristicReinforcements: function heuristicReinforcements(game, player) {
		return game.playerReinforcements(player) / 38 - 0.5;
	},
	heuristicConquestProbability: function heuristicConquestProbability(game, player) {
		var count = 0;
		return game.conflictFrontiers(player).mapApply(function (t1, t2){
			var c1 = game.armyCount(t1),
				c2 = game.armyCount(t2);
			count++;
			return conquestProbability(c1, c2) - conquestProbability(c2, c1); 
		}).sum() / count;
	},
	heuristic2: function heuristic2(game, player) {
		var b = 0.8;
		return b * Risk.heuristics.heuristicPru(game, player) +
			(1 - b) * Risk.heuristics.heuristicConquestProbability(game, player);
	}
	//TODO
};	

/** ## Simple player ###############################################################################

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
	
	// ### Utilities ###############################################################################
	
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