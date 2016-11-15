/** # RiskPlayer

Automatic player for the Risk game.
*/
var RiskPlayer = exports.RiskPlayer = declare(Player, {
	constructor: function RiskPlayer(params) {
		ludorum.Player.call(this, params);
		this.__reinforcer__ = new ludorum.players.HeuristicPlayer({
			name: '__reinforcer__',
			heuristic: this.reinforceHeuristic,
			random: params.random || Randomness.DEFAULT
		});
		this.__attacker__ = new ludorum.players.RandomPlayer();
	},
	
	decision: function decision(game, role) {
		if (game.stage[0] === 0 || game.stage[0] === 3) {
			return this.__reinforcer__.decision(game, role);
		} else {
			return this.__attacker__.decision(game, role);
		}
	},
	
	reinforceHeuristic: function reinforceHeuristic(game, role) {
		return Risk.heuristics.heuristicConquestProbability(game, role);
	},
	
	/*
	attackHeuristic: function attackHeuristic(game, role) {
		//return Risk.heuristics.heuristicPru(game, role);
		return Risk.heuristics.heuristicReinforcements(game, role);
	},
	*/	
	
	// ## Utilities ################################################################################
	
	'static __SERMAT__': {
		identifier: 'RiskPlayer',
		serializer: function serialize_RiskPlayer(obj) {
			return Player.__SERMAT__.serializer(obj);
		}
	}
}); // declare RiskPlayer