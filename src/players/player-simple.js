/** # Simple Risk player


*/
players.RiskSimplePlayer = declare(Player, {
	/** The player's constructor takes the following parameters:
	*/
	constructor: function RiskSimplePlayer(params) {
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

	/** The choice of territories to reinforce is random, yet it is biased towards territories with
	more conflicting frontiers.
	*/
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
		moves.sort(function (m1, m2) { // Descending order of frontier count.
			return frontiers[m2] - frontiers[m1];
		});
		return moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},

	/** This player waits until it can attack with the maximum amount of armies. If there is more
	than one possible attack, the move is chosen randomly.
	*/
	decisionAttack: function decisionAttack(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		moves = moves.filter(function (m) {
			return m[0] === 'ATTACK' && m[3] === game.MAX_ATTACK;
			/* */
		});
		return random.choice(moves) || game.PASS_MOVE;// como ponderar para que tenga preferencia el ataque por territorio que determina conq de cont
	},

	/** This player always occupies with as much armies as possible.
	*/
	decisionOccupy: function decisionOccupy(game, role) {
		var moves = game.moves()[role];
		var maxCount = iterable(moves).select(1).max();
		return maxCount < 2 ? moves[0] : ["OCCUPY", maxCount - 1];
	},

	/** The choice of territory to fortify is also random, yet it is biased towards greater
	movements of armies.
	*/
	decisionFortify: function decisionFortify(game, role) {
		var moves = game.moves()[role],
			random = this.random;
		moves = moves.filter(function (m) {
			return m[0] === 'FORTIFY' && game.armyCount(m[1]) - m[3] >= game.armyCount(m[2]);
		});
		moves.sort(function (m1, m2) {
			return m2[3] - m1[3]; // Descending order of amount.
		});
		return moves.length < 1 ? game.PASS_MOVE : moves[Math.min(random.randomInt(moves.length), random.randomInt(moves.length))];
	},

	// ### Utilities ###############################################################################

	/** Player serialization uses `Sermat`.
	*/
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
