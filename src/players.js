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
};
