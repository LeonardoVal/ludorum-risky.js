/** # Risk continent player

The `RiskContinentPlayer` focuses on conquering continents, seeking an advantage in the continents'
bonuses for reinforcements.
*/
players.RiskContinentPlayer = declare(Player, {
	/** The player's constructor takes the following parameters:
	*/
	constructor: function RiskContinentPlayerPlayer(params) {
		params = params || {};
		Player.call(this, params);
		/** + `random`: an instance of `creatartis-base.Randomness`.
		*/
		this.random = params.random || Randomness.DEFAULT;
	},

	/** The `decision` for each stage is considered separately.
	*/
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

	/** The player always strives to conquer one `targetContinent` entirely. This `targetContinent`
	is the easier to conquer in the current game state, i.e. the one with more territories
	controled by the player.
	*/
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

	/**
	*/
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

	/**
	*/
	decisionAttack: function decisionAttack(game, role) {
		var moves = game.moves()[role],
			random = this.random,
			continent = this.targetContinent(game, role);
		moves = moves.filter(function (m) {
			return m[0] === 'ATTACK' && m[3] === game.MAX_ATTACK && game.boardMap.territoryContinent(m[2]) === continent || conquestProbability(game.armyCount(m[1]), game.armyCount(m[2]) > 0.75);
		});
		return random.choice(moves) || game.PASS_MOVE;
	},

	/** This player always occupies with as much armies as possible.
	*/
	decisionOccupy: function decisionOccupy(game, role) {
		var moves = game.moves()[role];
		var maxCount = iterable(moves).select(1).max();
		return maxCount < 2 ? moves[0] : ["OCCUPY", maxCount - 1];
	},

	/** This player never fortifies.
	*/
	decisionFortify: function decisionFortify(game, role) {
		return ["PASS"];
	},

	// ## Utilities ################################################################################

	/** Player serialization uses `Sermat`.
	*/
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
