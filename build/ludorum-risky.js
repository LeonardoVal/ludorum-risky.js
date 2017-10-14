(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-risky"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Module wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
	/** Imports synonyms */
	var declare = base.declare,
		iterable = base.iterable,
		Iterable = base.Iterable,
		raise = base.raise,
		raiseIf = base.raiseIf,
		initialize = base.initialize,
		Randomness = base.Randomness,
		Game = ludorum.Game,
		Player = ludorum.Player;

	var exports = {
		__package__: 'ludorum-risky',
		__name__: 'ludorum_risky',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base] }
	};
/** See `__epilogue__.js`.
*/

/** # Probabilities

Risk-like games are use dice to resolve conflicts, and hence are non-deterministic games. Using the
dice probabilities is important for making good automatic players.
*/

// ## Attacks ######################################################################################

/** The `attackProbabilities` function calculates the chances of success and failure of all
possible attacks, given an attack army count and a defense army count.

Warning! At counts higher than 3 it can get really slow.
*/
exports.attackProbabilities = function attackProbabilities(attackCount, defenseCount) {
	var result = {},
		compFun = function (x,y) { return y-x;};
	Iterable.product.apply(Iterable, Iterable.repeat([1,2,3,4,5,6], attackCount + defenseCount).toArray())
		.forEach(function (dice) {
			var attackDice = dice.slice(0, attackCount).sort(compFun),
				defenseDice = dice.slice(attackCount).sort(compFun),
				attackWins = 0,
				defenseWins = 0,
				key;
			base.iterable(attackDice).zip(defenseDice).forEachApply(function (attackDie, defenseDie) {
				if (attackDie > defenseDie) {
					attackWins++;
				} else {
					defenseWins++;
				}
			});
			key = 'A'+ attackWins +'D'+ defenseWins;
			result[key] = (result[key] |0) + 1;
		});
	var totalCount = Math.pow(6, attackCount + defenseCount);
	for (var k in result) {
		result[k] = result[k] / totalCount;
	}
	return result;
};

/** The `ATTACK_PROBABILITIES` for the common scenarios have been pre-calculated. The keys are
defined like `/A\d+D\d+/` where each number is the amount of losses, for attacker and
defender.
*/
var ATTACK_PROBABILITIES = exports.ATTACK_PROBABILITIES = {
	A1D1: { A1D0: 0.5833333333333334, A0D1: 0.4166666666666667},
	A1D2: { A1D0: 0.7453703703703703, A0D1: 0.25462962962962965},
	A2D1: { A1D0: 0.4212962962962963, A0D1: 0.5787037037037037},
	A2D2: { A1D1: 0.32407407407407407, A2D0: 0.44830246913580246, A0D2: 0.22762345679012347},
	A3D1: { A1D0: 0.3402777777777778, A0D1: 0.6597222222222222},
	A3D2: { A1D1: 0.3357767489711934, A2D0: 0.2925668724279835, A0D2: 0.37165637860082307}
};

/** The aleatory variable used with Risk-like games does not consider all posible dice rolls. Most
dice rolls can be grouped in at 2 or 3 different results. Hence, only the results and their
probabilities are considered.
*/
var AttackAleatory = declare(ludorum.aleatories.Aleatory, {
	constructor: function UniformAleatory(distribution) {
		raiseIf(distribution.length < 1, "Aleatory cannot have an empty distribution!");
		this.__distribution__ = iterable(distribution);
	},

	distribution: function distribution() {
		return this.__distribution__;
	},

	value: function value(random) {
		return (random || Randomness.DEFAULT).weightedChoice(this.__distribution__);
	},

	'static __SERMAT__': {
		identifier: 'AttackAleatory',
		serializer: function serialize_UniformAleatory(obj) {
			return [obj.__distribution__.toArray()];
		}
	}
});

/** `ATTACK_ALEATORIES` is just the `Aleatory` representation of the `ATTACK_PROBABILITIES`.
*/
var ATTACK_ALEATORIES = exports.ATTACK_ALEATORIES = iterable(ATTACK_PROBABILITIES)
	.mapApply(function (amounts, results) {
		var distribution = iterable(results).mapApply(function (result, prob) {
			var value = {
				attack: -(result.charAt(1) |0),
				defence: -(result.charAt(3) |0)
			};
			return [value, prob];
		});
		return [amounts, new AttackAleatory(distribution)];
	}).toObject();

// ## Conquests ####################################################################################

/** The conquest probability is the chance of a certain number of attackers to defeat a certain
number of defenders. It is different from the attack probability, since a conquest may usually
involve many attacks.

The calculations assume that both players use as many armies as they can, and that the attacks
continue until all armies of either player get destroyed.
*/
var conquestProbability = exports.conquestProbability = function conquestProbability(attackCount,
		defenseCount, cache, attackProbs) {
	cache = cache || CONQUEST_PROBABILITIES;
	attackProbs = attackProbs || ATTACK_PROBABILITIES;
	if (attackCount < 1) {
		return 0;
	} else if (defenseCount < 1) {
		return 1;
	}
	var key = 'A'+ attackCount +'D'+ defenseCount,
		result = cache[key];
	if (!isNaN(result)) { // Hit cache.
		return result;
	} else {
		result = 1;
		if (defenseCount === 1) {
			if (attackCount === 1) {
				result = attackProbs.A1D1.A1D0;
			} else if (attackCount === 2) {
				result = attackProbs.A2D1.A1D0 +
					attackProbs.A2D1.A0D1 * conquestProbability(attackCount - 1, defenseCount, cache, attackProbs);
			} else if (attackCount >= 3) {
				result = attackProbs.A3D1.A1D0 +
					attackProbs.A3D1.A0D1 * conquestProbability(attackCount - 1, defenseCount, cache, attackProbs);
			}
		}
		if (defenseCount === 2){
			if (attackCount === 1) {
				result = attackProbs.A1D2.A1D0 * conquestProbability(attackCount, defenseCount - 1, cache, attackProbs);
			} else if (attackCount === 2) {
				result = attackProbs.A2D2.A2D0 +
					attackProbs.A2D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
			}
		}
		if (defenseCount >= 3){
			if (attackCount === 1) {
				result = attackProbs.A1D2.A1D0 * conquestProbability(attackCount, defenseCount - 1, cache, attackProbs);
			} else if (attackCount === 2) {
				result = attackProbs.A2D2.A2D0 * conquestProbability(attackCount, defenseCount - 2, cache, attackProbs) +
					attackProbs.A2D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
			}
		}
		if (attackCount >= 3 && defenseCount >= 2) {
			result = attackProbs.A3D2.A2D0 * conquestProbability(attackCount, defenseCount - 2, cache, attackProbs) +
				attackProbs.A3D2.A0D2 * conquestProbability(attackCount - 2, defenseCount, cache, attackProbs) +
				attackProbs.A3D2.A1D1 * conquestProbability(attackCount - 1, defenseCount - 1, cache, attackProbs);
		}
		cache[key] = result;
		return result;
	}
};

/** The `CONQUEST_PROBABILITIES` for the common scenarios have also been pre-calculated.
*/
var CONQUEST_PROBABILITIES = exports.CONQUEST_PROBABILITIES = (function () {
	var result = {};
	conquestProbability(30, 30, result, ATTACK_PROBABILITIES);
	return result;
})();


/** # Maps

In Risk-like games, maps are defined by a set of territories, their frontiers and the continents
they form.
*/
var BoardMap = exports.BoardMap = declare({
	/** The `BoardMap` constructor makes the following checks:
	*/
	constructor: function RiskyMap(territories, continents, bonuses) {
		/** + the board must have at least 2 territories.
		*/
		raiseIf(!territories || Object.keys(territories).length < 2, "Illegal territory definition ",
			JSON.stringify(territories), "!");
		continents = continents || {};
		bonuses = bonuses || {};

		this.adjacents = Object.freeze(territories);
		this.territories = Object.freeze(iterable(territories).mapApply(function (t, fs) {
			/** + all territories must have at least one frontier.
			*/
			raiseIf(fs.length < 1, "Territory ", t, " has no frontiers!");
			fs.forEach(function (f) {
				/** + all frontiers must be between declared territories.
				*/
				raiseIf(!territories.hasOwnProperty(f), "Territory ", t,
					" has a frontier with an unknown territory ", f, "!");
				/** + a territory cannot have a frontier with itself.
				*/
				raiseIf(t === f, "Territory ", t, " has a frontier with itself!");
			});
			return t;
		}).sorted().toArray());
		this.territoryIndexes = Object.freeze(iterable(this.territories).map(function (t, i) {
			return [t, i];
		}).toObject());
		this.continentTerritories = Object.freeze(continents);
		this.continents = Object.freeze(iterable(continents).mapApply(function (c, ts) {
			/** + all continents must have at least one territory.
			*/
			raiseIf(ts.length < 1, "Continent ", c, " has no territories!");
			ts.forEach(function (t) {
				/** + all continents' territories must be declared.
				*/
				raiseIf(!territories.hasOwnProperty(t), "Continent ", c, " has an unknown territory ",
					t, "!");
			});
			return c;
		}).sorted().toArray());
		/** + all bonuses' continents must be declared.
		*/
		iterable(bonuses).forEachApply(function (c, b) {
			raiseIf(!continents.hasOwnProperty(c), "Bonus defined for unknown continent ", c, "!");
		});
		this.bonuses = Object.freeze(bonuses);
		Object.freeze(this);
	},

	/** The method `territoryContinent` return the continent of the given territory.
	*/
	territoryContinent: function (t) {
		return iterable(this.continentTerritories).filterApply(function (c, ts) {
			var b = false;
			iterable(ts).forEach(function (te) {
				if(te === t) {
					b = true;
				}
			});
			return b;
		}, function (c, ts) {
			return c;
		}).toArray().toString();
	},

	/** Two territories are `adjacent` if if they share a frontier or a lane in the map.
	*/
	adjacent: function (t1, t2) {
		return this.adjacents[t1] && this.adjacents[t1].indexOf(t2) >= 0;
	},

	/** The `frontiers` of a map is a sequence of all pairs of adjacent territories.
	*/
	frontiers: function frontiers() {
		return iterable(this.adjacents).mapApply(function (t1, ts) {
			return ts.map(function (t2) {
				return [t1, t2];
			});
		}).flatten();
	},

	/** The `bonus` method returns the bonus for a continent or continents.
	*/
	bonus: function bonus() {
		var result = 0;
		for (var i = 0; i < arguments.length; i++) {
			result += this.bonuses[arguments[i]] || 0;
		}
		return result;
	},

	// ## Utility methods ##########################################################################

	/** Serialization and materialization using Sermat.
	*/
	'static __SERMAT__': {
		identifier: 'BoardMap',
		serializer: function serialize_BoardMap(obj) {
			return [obj.adjacents, obj.continentTerritories, obj.bonuses];
		}
	},
}); // class BoardMap

/** The `maps` object holds map definitions. */
var maps = exports.maps = {};


/** Test maps

Definitions of maps use to test the implementation of the game.
*/

/** `test01` is a very small, simple and symmetric map.
*/
maps.test01 = new BoardMap({
	"WhiteCountry": ["BlackCountry", "YellowCountry"],
	"YellowCountry": ["WhiteCountry", "RedCountry"],
	"RedCountry": ["YellowCountry", "GreenCountry"],
	"GreenCountry": ["RedCountry", "BlueCountry"],
	"BlueCountry": ["GreenCountry", "BlackCountry"],
	"BlackCountry": ["BlueCountry", "WhiteCountry"]
}, { // continents
	"GreyContinent": ["WhiteCountry", "BlackCountry"],
	"OrangeContinent": ["YellowCountry", "RedCountry"],
	"CyanContinent": ["GreenCountry", "BlueCountry"]
}, { // bonuses.
	"GreyContinent": 2,
	"OrangeContinent": 2,
	"CyanContinent": 2
});


/** # Classic Risk map

Definition of the classic Risk map to use with `ludorum-risky`.
*/
maps.classic = new BoardMap({
/* Territories with their adjacencies.
*/
	"Alaska": ["Alberta", "Northwest Territory", "Kamchatka"],
	"Alberta": ["Alaska", "Northwest Territory", "Ontario", "Western United States"],
	"Central America": ["Eastern United States", "Western United States", "Venezuela"],
	"Eastern United States": ["Alberta", "Central America", "Ontario", "Quebec", "Western United States"],
	"Greenland": ["Northwest Territory", "Ontario", "Quebec", "Iceland"],
	"Northwest Territory": ["Alaska", "Alberta", "Ontario", "Greenland"],
	"Ontario": ["Alberta", "Eastern United States", "Greenland", "Northwest Territory", "Quebec", "Western United States"],
	"Quebec": ["Eastern United States", "Greenland", "Ontario"],
	"Western United States": ["Alberta", "Central America", "Eastern United States", "Ontario"],
	"Argentina": ["Brazil", "Peru"],
	"Brazil": ["Argentina", "Peru", "Venezuela", "North Africa"],
	"Peru": ["Argentina", "Brazil", "Venezuela"],
	"Venezuela": ["Brazil", "Peru", "Central America"],
	"Great Britain": ["Iceland", "Northern Europe", "Scandinavia", "Western Europe"],
	"Iceland": ["Great Britain", "Scandinavia", "Greenland"],
	"Northern Europe": ["Great Britain", "Scandinavia", "Southern Europe", "Ukraine", "Western Europe"],
	"Scandinavia": ["Great Britain", "Iceland", "Northern Europe", "Ukraine"],
	"Southern Europe": ["Northern Europe", "Ukraine", "Western Europe", "Middle East", "Egypt", "North Africa"],
	"Ukraine": ["Northern Europe", "Scandinavia", "Southern Europe", "Afghanistan", "Middle East", "Ural"],
	"Western Europe": ["Great Britain", "Northern Europe", "Southern Europe", "North Africa"],
	"Congo": ["East Africa", "North Africa", "South Africa"],
	"East Africa": ["Congo", "Egypt", "Madagascar", "North Africa", "South Africa", "Middle East"],
	"Egypt": ["East Africa", "North Africa", "Southern Europe", "Middle East"],
	"Madagascar": ["East Africa", "South Africa"],
	"North Africa": ["Congo", "East Africa", "Egypt", "Southern Europe", "Western Europe", "Brazil"],
	"South Africa": ["Congo", "East Africa", "Madagascar"],
	"Afghanistan": ["China", "India", "Middle East", "Ural", "Ukraine"],
	"China": ["Afghanistan", "India", "Mongolia", "Siam", "Siberia", "Ural"],
	"India": ["Afghanistan", "China", "Middle East", "Siam"],
	"Irkutsk": ["Kamchatka", "Mongolia", "Siberia", "Yakutsk"],
	"Japan": ["Kamchatka", "Mongolia"],
	"Kamchatka": ["Irkutsk", "Japan", "Mongolia", "Yakutsk", "Alaska"],
	"Middle East": ["Afghanistan", "India", "Southern Europe", "Ukraine", "East Africa", "Egypt"],
	"Mongolia": ["China", "Irkutsk", "Japan", "Kamchatka", "Siberia"],
	"Siam": ["China", "India", "Indonesia"],
	"Siberia": ["China", "Irkutsk", "Mongolia", "Ural", "Yakutsk"],
	"Ural": ["Afghanistan", "China", "Siberia", "Ukraine"],
	"Yakutsk": ["Irkutsk", "Kamchatka", "Siberia"],
	"Eastern Australia": ["New Guinea", "Western Australia"],
	"Indonesia": ["New Guinea", "Western Australia", "Siam"],
	"New Guinea": ["Eastern Australia", "Indonesia", "Western Australia"],
	"Western Australia": ["Eastern Australia", "Indonesia", "New Guinea"]
}, {
/* Continents and the territories inside them.
*/
	"South America": ["Argentina", "Brazil", "Peru", "Venezuela"],
	"Australia" : ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"],
	"Africa" : ["Congo", "East Africa", "Egypt", "Madagascar", "North Africa", "South Africa"],
	"Europe" : ["Great Britain", "Iceland", "Northern Europe", "Scandinavia", "Southern Europe", "Ukraine", "Western Europe"],
	"North America" : ["Alaska", "Alberta", "Central America", "Eastern United States", "Greenland", "Northwest Territory", "Ontario", "Quebec", "Western United States"],
	"Asia" : ["Afghanistan", "China", "India", "Irkutsk", "Japan", "Kamchatka", "Middle East", "Mongolia", "Siam", "Siberia", "Ural", "Yakutsk"]
}, {
/* Reinforcement bonuses for each continent.
*/
	"Asia" : 7,
	"North America" : 5,
	"Europe" : 5,
	"Africa" : 3,
	"Australia" : 2,
	"South America" : 2
});


/** # Risk.

Implementation of the Risk game
*/
var Risk = exports.Risk = declare(Game, {
	name: 'Risk',

	/** There are six players, each named after a colour.
	*/
	players: ["White", "Yellow", "Red", "Green", "Blue", "Black"],

	/** The active player can be in one of the following stages in his turn:

	+ `REINFORCE`: The player is reinforcing the owned territories with more armies. This stage has
	the number of reinforcements available.

	+ `ATTACK`: After reinforcements, the player can attack neighbouring enemy territories.

	+ `OCCUPY`: After a successful attack, the player must decide with how many armies to occupy the
	invaded territory. This stage has the territory from which the attack was made, and the attacked
	territory.

	+ `FORTIFY`: After all attacks, the turn ends by regrouping forces from one territory to
	another.
	*/
	STAGES: {
		REINFORCE: 0, ATTACK: 1, OCCUPY: 2, FORTIFY: 3
	},

	/** The constructor takes the following parameters:
	*/
	constructor: function Risk(params) {
		params = params || {};
		initialize(this, params)
			/** + `boardMap`: The board's map must be an instance of `BoardMap`.
			*/
			.object('boardMap', { defaultValue: maps.classic })
			/** + `stage`: An array containing the current game stage information.
			*/
			.array('stage', { ignore: true })
			/** + `round`: The current round number. A round is completed after all players have
			finished their turns.
			*/
			.integer('round', { coerce: true, defaultValue: 0 })
			/** + `rounds`: A limit of rounds for the game. By default there isn't a limit.
			*/
			.number('rounds', { coerce: true, defaultValue: Infinity });
		Game.call(this, params.activePlayer);
		/** + `armies`: An object containing the game state, assigning every territory a player and
		an amount of armies. This representations is compressed in a string as an optimization.
		*/
		if (!params.armies) {
			this.armies = this.compressGameState(this.emptyGameState());
		} else if (typeof params.armies === 'string') {
			this.armies = params.armies;
		} else if (typeof params.armies === 'object') {
			this.armies = this.compressGameState(params.armies);
		} else {
			raise("Invalid armies < ", JSON.stringify(params.armies), " >!");
		}
		/** The default stage is `REINFORCE`.
		*/
		if (!this.stage) {
			this.stage = [this.STAGES.REINFORCE, this.playerReinforcements()];
		}
	},

	// ## Game state management ####################################################################

	/** An `emptyGameState` is an object with a property for every territory in the map, mapping to
	an array `["", 0]` (no player and no armies).
	*/
	emptyGameState: function emptyGameState() {
		return iterable(this.boardMap.territories).map(function (territory) {
			return [territory, ["", 0]];
		}).toObject();
	},

	/** To optimize memory requirements, the game state is compressed in a string. The `state`
	argument must be an object with a member for every territory, with a value of the form
	`[string, integer]` representing the player controlling the territory and the number of armies
	present in it.

	This is translated in a string with one character per territory, in the same order as
	`this.map.territories`. Each character's code is calculated by multiplying the army count by the
	number of players and adding the player index in `this.players` (or zero if no player owns the
	territory).
	*/
	compressGameState: function compressGameState(state) {
		var players = this.players,
			playerCount = players.length;
		return this.boardMap.territories.map(function (t) {
			var charCode = state[t][1];
			if (charCode > 0) { // There are armies in the territory.
				var playerIndex = players.indexOf(state[t][0]);
				raiseIf(playerIndex < 0, "Unknown player '", state[t][0], "!");
				charCode = charCode * playerCount + playerIndex;
			}
			return String.fromCharCode(charCode);
		}).join('');
	},

	/** Uncompressing the game state takes a string and returns the object describing the board
	state.
	*/
	uncompressGameState: function uncompressGameState(compressed) {
		var state = {},
			players = this.players,
			playerCount = players.length;
		iterable(this.boardMap.territories).zip(compressed).forEachApply(function (t, c) {
			c = c.charCodeAt(0);
			state[t] = c > 0 ? [players[c % playerCount], Math.floor(c / playerCount)] : ["", 0];
		});
		return state;
	},

	/** The `playerOf` a `territory` is the name of the player that has armies in the given
	territory.
	*/
	playerOf: function (territory) {
		var i = this.boardMap.territoryIndexes[territory],
			armies = this.armies.charCodeAt(i);
		return armies ? this.players[armies % this.players.length] : "";
	},

	/** The `armyCount` of a `territory` is amount of armies present in said territory.
	*/
	armyCount: function (territory) {
		var i = this.boardMap.territoryIndexes[territory],
			armies = this.armies.charCodeAt(i);
		return armies ? Math.floor(armies / this.players.length) : 0;
	},

	/** The `playerTerritories` returns an array of the territories currently controlled by the
	given `player` (or the active player by default).
	*/
	playerTerritories: function playerTerritories(player) {
		player = this.players.indexOf(player || this.activePlayer());
		var playerCount = this.players.length;
		return iterable(this.boardMap.territories).zip(this.armies).filterApply(function (t, a) {
			return a.charCodeAt(0) % playerCount === player;
		}, function (t, a) {
			return t;
		}).toArray();
	},

	/** The `playerContinents` returns an array of the continents currently controlled by the
	given `player` (or the active player by default).
	*/
	playerContinents: function playerContinents(player) {
		player = this.players.indexOf(player || this.activePlayer());
		var playerCount = this.players.length,
			armies = this.armies,
			territoryIndexes = this.boardMap.territoryIndexes;
		return iterable(this.boardMap.continentTerritories).filterApply(function (c, ts) {
			return iterable(ts).all(function (t) {
				return armies.charCodeAt(territoryIndexes[t]) % playerCount === player;
			});
		}, function (c, ts) {
			return c;
		}).toArray();
	},

	/**	The `playerPendingTerritories` method returns an object listing pending terrritories to
	complete the continent by the given `player` (or the active player by default).
	*/
	playerPendingTerritories: function playerPendingTerritories(player) {
		player = player || this.activePlayer();
		var game = this,
			cT = {};
		iterable(this.boardMap.continentTerritories).forEachApply(function (c, ts) {
			var count = 0;
			ts.forEach(function(t) {
					if (game.playerOf(t) != player){
						count = count + 1;
					}

			});
			cT[c] = count;
		});
		return cT;
	},

	/** The `hasPresence` method return true if the given `player` (or the active player by default)
	has presence in continent.
	*/
	hasPresence: function hasPresence(player, continent) {
		player = player || this.activePlayer();
		var game = this,
			aux = false;
		iterable(this.boardMap.continentTerritories[continent]).forEach(function (t) {
			if (game.playerOf(t) === player){
				aux = true; //como hago para cortar?
			}
		});
		return aux;
	},

	/** The `continentAdyacent` method return true if the given `player` (or the active player by
	default) has a territory adyacent to (or in) continent.
	*/
	continentAdyacent: function continentAdyacent(player, continent) {
		player = player || this.activePlayer();
		var game = this,
			aux = false;
		iterable(game.boardMap.continentTerritories[continent]).forEach(function (t) {
			game.conflictFrontiers(player).forEach(function (a) {
				//console.log(a);// + " - " + a[0] === t);
				if( a[1] === t) {
					aux = true;
				}
			});

		});
		return aux;
	},


	/** At the beginning of his turn every player gets an amount of reinforcements equal to the
	number of territories he controls divided by 3 (rounded down).
	*/
	playerReinforcements: function playerReinforcements(player) {
		player = player || this.activePlayer();
		var ts = this.playerTerritories(player).length / 3,
			cs = this.boardMap.bonus.apply(this.boardMap, this.playerContinents(player));
		return Math.floor(Math.max(this.MIN_REINFORCEMENTS, ts) + cs);
	},

	/** Still there is a minimum amount of reinforcements (`MIN_REINFORCEMENTS`, 3 by default)
	defined so players always have a fighting chance.
	*/
	MIN_REINFORCEMENTS: 3,

	// ## Game ending and result ###################################################################

	/** The score for each player in the game is equal to the amount of armies that could be
	reinforced if it where each player's round beginning.
	*/
	scores: function scores() {
		var game = this;
		return iterable(this.players).map(function (p) {
			return [p, game.playerTerritories(p).length];
		}).toObject();
	},

	/** The board is `dominated` when all territories are controlled by the same player. If that is
	the case this function returns this player, else returns `null`.
	*/
	dominated: function dominated() {
		var playerCount = this.players.length,
			p1 = -1, p2;
		for (var i = 0, len = this.armies.length; i < len; i++) {
			p2 = this.armies.charCodeAt(i) % playerCount;
			if (p1 !== p2) {
				if (p1 < 0) {
					p1 = p2;
				} else {
					return null; // Two different players found in the board.
				}
			}
		}
		return this.players[p1]; // Only one player is in the board if the loop did not abort.
	},

	/** The board is `moreHalfDominated` when more than 50% of territories are controlled by the
	same player. If that is the case this function returns this player, else returns `null`.
	*/
	moreHalfDominated: function moreHalfDominated() {
		var halfTerritoryCount = Math.round(this.boardMap.territories.length / 2),
			activePlayerCount = this.playerTerritories(this.activePlayer()).length;
		if (activePlayerCount > halfTerritoryCount) {
			return this.activePlayer();
		} else {
			return null;
		}
	},

	/** A game of Risk is finished when the whole board is owned by the winner, or when the round
	limit is reached.
	*/
	result: function result() {
		var r = this.__result__;
		if (typeof r === 'undefined') {
			var p = this.moreHalfDominated();
			if (p) { // One player conquered the whole board.
				r = this.victory(p, 5);
			} else if (this.round >= this.rounds) { // Round limit has been reached.
				var scores = this.scores(),
					ps = this.players.slice().sort(function (p1, p2) { // Sort players in decreasing order of score.
						return scores[p2] - scores[p1];
					});
				if (ps[0] > ps[1]) {
					r = this.victory(ps[0]);
				} else { // Tied game.
					r = this.draw();
				}
			} else {
				r = null; // Game goes on.
			}
			this.__result__ = r;
		}
		return r;
	},

	// ## Movement calculations ####################################################################

	/** The active player's `moves()` depend on the stage the turn is currently in.
	*/
	moves: function moves() {
		var r = this.__moves__;
		if (typeof r === 'undefined') {
			var activePlayer = this.activePlayer();
			if (this.result()) {
				r = null;
			} else {
				r = {};
				switch (this.stage[0]) {
					case this.STAGES.REINFORCE: r[activePlayer] = this.reinforceMoves(); break;
					case this.STAGES.ATTACK:    r[activePlayer] = this.attackMoves(); break;
					case this.STAGES.OCCUPY:    r[activePlayer] = this.occupyMoves(); break;
					case this.STAGES.FORTIFY:   r[activePlayer] = this.fortifyMoves(); break;
					default: raise("Invalid stage < ", JSON.stringify(this.stage), " >!");
				}
			}
			this.__moves__ = r;
		}
		return r;
	},

	/** The moves for reinforcements are arrays of the form `["REINFORCE", territory, integer]`.
	*/
	reinforceMoves: function reinforceMoves() {
		var game = this,
			activePlayer = this.activePlayer(),
			result = [];
		if (this.stage[0] === this.STAGES.REINFORCE) {
			result = Iterable.product(["REINFORCE"],
				this.playerTerritories(activePlayer),
				Iterable.range(1, this.stage[1] + 1)
			).toArray();
		}
		return result.length > 0 ? result : [this.PASS_MOVE];
	},

	/** The `conflictFrontiers` of the board are pairs of adjacent territories that are owned one by
	the given `player` (or the active player by default) and the other by a different player.
	*/
	conflictFrontiers: function conflictFrontiers(player) {
		player = player || this.activePlayer();
		var game = this;
		return iterable(this.boardMap.adjacents).mapApply(function (t1, ts) {
			var p1 = game.playerOf(t1);
			if (p1 === player) {
				return iterable(ts).filter(function (t2) {
					return game.playerOf(t2) !== player;
				}, function (t2) {
					return [t1, t2];
				});
			} else {
				return Iterable.EMPTY;
			}
		}).flatten();
	},

	/** The stages `ATTACK` and `FORTIFY` allow the player to pass the turn.
	*/
	PASS_MOVE: ["PASS"],

	/** The moves for attacks are arrays of the form `["ATTACK", territoryFrom, territoryTo, integer]`.
	*/
	attackMoves: function attackMoves() {
		var game = this,
			result = [this.PASS_MOVE];
		if (this.stage[0] === this.STAGES.ATTACK) {
			this.conflictFrontiers().forEach(function (pair) {
				var armyCount = Math.min(game.MAX_ATTACK, game.armyCount(pair[0]) - 1);
				for (var i = 1; i <= armyCount; i++) {
					result.push(["ATTACK", pair[0], pair[1], i]);
				}
			});
		}
		return result;
	},

	/** There is a maximum amount of armies that can be used in any attack.
	*/
	MAX_ATTACK: 3,

	/** The moves for occupations are arrays of the form `["OCCUPY", integer]`.
	*/
	occupyMoves: function occupyMoves() {
		if (this.stage[0] === this.STAGES.OCCUPY) {
			var territoryFrom = this.stage[1];
			return Iterable.range(1, this.armyCount(territoryFrom)).map(function (armyCount) {
				return ["OCCUPY", armyCount];
			}).toArray();
		} else {
			return [];
		}
	},

	/** The moves for fortifications are arrays of the form `["FORTIFY", territoryFrom, territoryTo, integer]`.
	*/
	fortifyMoves: function fortifyMoves() {
		var result = [this.PASS_MOVE];
		if (this.stage[0] === this.STAGES.FORTIFY) {
			var game = this,
				activePlayer = this.activePlayer();
			result = result.concat(iterable(this.boardMap.adjacents).mapApply(function (t1, ts) {
				var p1 = game.playerOf(t1),
					armyCount = game.armyCount(t1);
				if (p1 === activePlayer && armyCount > 1) {
					return iterable(ts).filter(function (t2) {
						return game.playerOf(t2) === activePlayer;
					}).product(Iterable.range(1, armyCount)).mapApply(function (t2, c) {
						return ["FORTIFY", t1, t2, c];
					});
				} else {
					return Iterable.EMPTY;
				}
			}).flatten().toArray());
		}
		return result;
	},

	// ## Movements validation #####################################################################

	isValidReinforce: function isValidReinforce(move, onError){
		var stage = this.stage;
		if (stage[0] !== this.STAGES.REINFORCE) {
			if (onError) onError("Cannot reinforce in this stage (" + stage + ")!");
			return false;
		}
		var remaining = stage[1] - move[2];
		if (!Math.floor(remaining + 1) || remaining < 0 || move[2] < 1 ) {
			if (onError) onError("Cannot reinforce " + move[2] + " armies!");
			return false;
		}
		var armies = this.uncompressGameState(this.armies),
			activePlayer = this.activePlayer();
		if (!armies[move[1]] || armies[move[1]][0] !== activePlayer) {
			if (onError) onError("Cannot reinforce territory " + move[1] + " because active player " + activePlayer + " does not own it!");
			return false;
		}
		return true;

	},

	isValidAttack: function isValidAttack(move, onError){
		var armies = this.uncompressGameState(this.armies),
			stage = this.stage,
			activePlayer = this.activePlayer();
		if (stage[0] !== this.STAGES.ATTACK) {
			if (onError) onError("Cannot attack in this stage (" + stage + ")!");
			return false;
		}
		if (!armies[move[1]] || armies[move[1]][0] !== activePlayer) {
			if (onError) onError("Cannot attack from " + move[1] + "!");
			return false;
		}
		if (!armies[move[2]] || armies[move[2]][0] === activePlayer) {
			if (onError) onError("Cannot attack to " + move[2] + "!");
			return false;
		}
		var remaining = armies[move[1]][1] - move[3];
		if (!Math.floor(remaining + 1) || remaining < 1 || move[3] > 3 || move[3] < 1) {
			if (onError) onError("Cannot attack with " + move[3] + " armies!");
			return false;
		}
		return true;
	},

	isValidOccupy: function isValidOccupy(move, onError){
		var stage = this.stage;
		if (stage[0] !== this.STAGES.OCCUPY) {
			if (onError) onError("Cannot occupy in this stage (" + stage + ")!");
			return false;
		}
		var armies = this.uncompressGameState(this.armies),
			activePlayer = this.activePlayer(),
			remaining = armies[stage[1]][1] - move[1];
		if (remaining < 1 || !Math.floor(move[1]) || armies[stage[1]][1] < move[1] || move[1] < 1) {
			if (onError) onError("Cannot occupy territory " + stage[2] + " with " + move[1] + " armies!");
			return false;
		}
		return true;
	},

	isValidFortify: function isValidFortify(move, onError){
		var stage = this.stage;
		if (stage[0] !== this.STAGES.FORTIFY) {
			if (onError) onError("Cannot fortify in this stage (" + stage + ")!");
			return false;
		}
		var armies = this.uncompressGameState(this.armies),
			activePlayer = this.activePlayer();
		if (!armies[move[1]] || armies[move[1]][0] !== activePlayer) {
			if (onError) onError("Cannot fortify from territory " + move[1] + "!");
			return false;
		}
		if (!armies[move[2]] || armies[move[2]][0] !== activePlayer || !this.boardMap.adjacent(move[1], move[2])) {
			if (onError) onError("Cannot fortify to territory " + move[2] + "!");
			return false;
		}
		if (!Math.floor(move[3]) || move[3] < 1 || armies[move[1]][1] <= move[3]) {
			if (onError) onError("Cannot fortify with " + move[3] + " armies!");
			return false;
		}
		return true;
	},

	// ## Application of moves #####################################################################

	/** The `next` method returns a new game state as a modification of this one.
	*/
	next: function next(moves, haps) {
		var activePlayer = this.activePlayer(),
			move = moves[activePlayer];
		raiseIf(!move, "Active player has no moves!");
		switch (move[0]) {
			case "REINFORCE": return this.nextReinforce(move);
			case "ATTACK":    return this.nextAttack(move, haps);
			case "OCCUPY":    return this.nextOccupy(move);
			case "FORTIFY":   return this.nextFortify(move);
			case "PASS":      return this.nextPass(move);
			default:          raise("Invalid move < ", JSON.stringify(move), " >!");
		}
	},

	/** A reinforcements increments the number of armies in one of the territories occupied by the
	active player. The `move` should be in the form `["REINFORCE", territory, amount]` and the
	game's `stage` should be in the form `[STAGES.REINFORCE, amount]`.
	*/
	nextReinforce: function nextReinforce(move) {
		if (this.isValidReinforce(move, raise)) {
			var stage = this.stage,
				armies = this.uncompressGameState(this.armies),
				remaining = stage[1] - move[2],
				activePlayer = this.activePlayer();
			armies[move[1]][1] += move[2];
			return new this.constructor({
				boardMap: this.boardMap,
				stage: remaining > 0 ? [this.STAGES.REINFORCE, remaining] : [this.STAGES.ATTACK],
				round: this.round,
				rounds: this.rounds,
				armies: armies,
				activePlayer: activePlayer
			});
		}
	},

	/** Attacks are the only instances of non-determinism in this game. The `move`
	should be in the form `["ATTACK", territoryFrom, territoryTo, amount]`, and the `haps` should
	be in the form `{ attack: amount, defence: amount }`.
	*/
	nextAttack: function nextAttack(move, haps) {
		var stage = this.stage,
			activePlayer = this.activePlayer();
		if (!haps) { // Dice rolls are provided.
			var aleaKey = 'A'+ move[3] +'D'+ Math.min(2, this.armyCount(move[2])),
				alea = ATTACK_ALEATORIES[aleaKey];
			raiseIf(!alea, "Could not find aleatory for ", aleaKey, "!");
			return new ludorum.Contingent(this, base.obj(activePlayer, move), { rolls: alea });
		} else if (this.isValidAttack(move, raise)) { // Dice rolls not available.
			var armies = this.uncompressGameState(this.armies);
			armies[move[1]][1] += haps.rolls.attack; // Change the board.
			armies[move[2]][1] += haps.rolls.defence;
			var conquest = armies[move[2]][1] < 1;
			if (conquest) {
				armies[move[2]][0] = activePlayer;
			}
			return new this.constructor({
				boardMap: this.boardMap,
				stage: conquest ? [this.STAGES.OCCUPY, move[1], move[2]] : this.stage,
				round: this.round,
				rounds: this.rounds,
				armies: armies,
				activePlayer: this.activePlayer()
			});
		}
	},

	/** After a successful attack the attacker must occupy the conquered territory. The `move`
	should be in the form `["OCCUPY", integer]`.
	*/
	nextOccupy: function nextOccupy(move) {
		if (this.isValidOccupy(move, raise)) {
			var stage = this.stage,
				armies = this.uncompressGameState(this.armies),
				activePlayer = this.activePlayer();
			armies[stage[1]][1] -= move[1]; // Change the board.
			armies[stage[2]] = [activePlayer, move[1]];
			return new this.constructor({
				boardMap: this.boardMap,
				stage: [this.STAGES.ATTACK],
				round: this.round,
				rounds: this.rounds,
				armies: armies,
				activePlayer: activePlayer
			});
		}
	},

	/** The last move in a turn can be a fortification, which is a movement of armies from one of
	the active player's turn to another. The `move` should be in the form
	`["FORTIFY", territoryFrom, territoryTo, amount]`.
	*/
	nextFortify: function nextFortify(move) {
		if (this.isValidFortify(move, raise)) {
			var armies = this.uncompressGameState(this.armies),
				activePlayer = this.activePlayer();
			armies[move[1]][1] -= move[3]; // Change the board.
			armies[move[2]][1] += move[3];
			return new this.constructor(this.__advanceTurn__({
				boardMap: this.boardMap,
				stage: null, // constructor will initialize this.
				round: this.round,
				rounds: this.rounds,
				armies: armies,
				activePlayer: activePlayer
			}));
		}
	},

	/** Attacks and fortifications can be passed. The `move` should be in the form `["PASS"]`.
	*/
	nextPass: function nextPass(moves) {
		var params = {
			boardMap: this.boardMap,
			round: this.round,
			rounds: this.rounds,
			armies: this.armies,
			activePlayer: this.activePlayer()
		};
		switch (this.stage[0]) {
			case this.STAGES.REINFORCE:
				params.stage = [this.STAGES.ATTACK];
				break;
			case this.STAGES.ATTACK:
				params.stage = [this.STAGES.FORTIFY];
				break;
			case this.STAGES.OCCUPY:
				raise("Cannot pass!");
				break;
			case this.STAGES.FORTIFY:
				params = this.__advanceTurn__(params);
				break;
		}
		return new this.constructor(params);
	},

	/** To get to the next turn this method takes the `params` for the constructor and changes the
	active player to the next player.
	*/
	__advanceTurn__: function __advanceTurn__(params) {
		var nextPlayer = (this.players.indexOf(params.activePlayer) + 1) % this.players.length;
		for (var i = 0; i < this.players.length; i++){
			if (nextPlayer === 0) {
				params.round++;
			}
			if(this.playerTerritories(this.players[nextPlayer]).length > 0){
				params.activePlayer = this.players[nextPlayer];
				break;
			}
			nextPlayer = (nextPlayer + 1) % this.players.length;
		}
		return params;
	},

	// ## Utility methods ##########################################################################

	/** Serialization and materialization using Sermat.
	*/
	'static __SERMAT__': {
		identifier: 'Risk',
		serializer: function serialize_Risk(obj) {
			return this.serializeAsProperties(obj, ['boardMap', 'stage', 'round', 'rounds', 'armies'], true);
		}
	},

	/** An `armyAleatoryDistribution` is an object with a property for every territory in the map,
	mapping to an aleatory array `["<territory>", <armiesNumber>]`.
	*/
	'static armyAleatoryDistribution': function armyAleatoryDistribution(players, boardMap) {
		var armies = {},
			territories = boardMap.territories,
			vec0 = Iterable.range(players.length).toArray(),
			vec = vec0.slice();
		territories.forEach(function(t) {
			if (vec.length < 1){
				vec = vec0.slice();
			}
			var aux = Math.floor(Math.random() * vec.length);
			armies[t] = [players[vec[aux]], Math.floor(Math.random() * 10) + 1];
			vec.splice(aux, 1);
		});
		return armies;
	},

	/** An `armyDistribution` is an object with a property for every territory in the map,
	mapping to an array `["<territory>", <armiesNumber>]`.
	*/
	'static armyDistribution': function armyDistribution(players, boardMap) {
		var armies = {},
			territories = boardMap.territories,
			vec0 = Iterable.range(players.length).toArray(),
			vec = vec0.slice(),
			vecArmies = [20, 20, 20, 20, 20, 20],
			count = 6;

		territories.forEach(function(t) {
			if (vec.length < 1){
				vec = vec0.slice();
				--count;
			}
			var aux = Math.floor(Math.random() * vec.length);
			armies[t] = [players[vec[aux]], Math.floor(Math.random() * (vecArmies[vec[aux]] - count)) + 1];
			vecArmies[vec[aux]] -= armies[t][1];
			vec.splice(aux, 1);
		});
		return armies;
	}
}); // declare Risk


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


/** # Scenarios

Scenarios are maps with armies already distributed. They are used to test the automatic players and
the to assess the game.
*/
var scenarios = exports.scenarios = (function () {
	var armies = function (c, n) {
			return [c, n|0];
		},
		White = armies.bind(null, "White"),
		Yellow = armies.bind(null, "Yellow"),
		Red = armies.bind(null, "Red"),
		Blue = armies.bind(null, "Blue"),
		Green = armies.bind(null, "Green"),
		Black = armies.bind(null, "Black");
	return iterable({
		/** ## White oceania #######################################################################

		This scenario asigns the whole Oceania and 3 adjacent territories in Asia to the White
		player. All other players are scattered evenly on the rest of the map.
		*/
		whiteOceania: [
			Green(12), //Afghanistan
			Black(12), //Alaska
			Blue(12), //Alberta
			Red(9), //Argentina
			Green(2), //Brazil
			Yellow(12), //Central America
			White(6), //China
			Black(2), //Congo
			Blue(1), //East Africa
			White(1), //Eastern Australia
			Green(2), //Eastern United States
			Yellow(2), //Egypt
			Blue(1), //Great Britain
			Red(2), //Greenland
			Blue(3), //Iceland
			White(6), //India
			White(1), //Indonesia
			Yellow(1), //Irkutsk
			Black(2), //Japan
			Green(1), //Kamchatka
			Black(1), //Madagascar
			Yellow(2), //Middle East
			Red(4), //Mongolia
			White(1), //New Guinea
			Red(1), //North Africa
			Blue(1), //Northern Europe
			Blue(1), //Northwest Territory
			Black(1), //Ontario
			Green(1), //Peru
			Yellow(1), //Quebec
			Green(1), //Scandinavia
			White(4), //Siam
			Yellow(1), //Siberia
			Red(1), //South Africa
			Blue(1), //Southern Europe
			Black(1), //Ukraine
			Red(1), //Ural
			Black(1), //Venezuela
			White(1), //Western Australia
			Yellow(1), //Western Europe
			Red(2), //Western United States
			Green(1) //Yakutsk
		],
		/** ## Black Oceania #######################################################################
		*/
		blackOceania: [
			Green(12), //Afghanistan
			White(12), //Alaska
			Blue(12), //Alberta
			Red(9), //Argentina
			Green(2), //Brazil
			Yellow(12), //Central America
			Black(6), //China
			White(2), //Congo
			Blue(1), //East Africa
			Black(1), //Eastern Australia
			Green(2), //Eastern United States
			Yellow(2), //Egypt
			Blue(1), //Great Britain
			Red(2), //Greenland
			Blue(3), //Iceland
			Black(6), //India
			Black(1), //Indonesia
			Yellow(1), //Irkutsk
			White(2), //Japan
			Green(1), //Kamchatka
			White(1), //Madagascar
			Yellow(2), //Middle East
			Red(4), //Mongolia
			Black(1), //New Guinea
			Red(1), //North Africa
			Blue(1), //Northern Europe
			Blue(1), //Northwest Territory
			White(1), //Ontario
			Green(1), //Peru
			Yellow(1), //Quebec
			Green(1), //Scandinavia
			Black(4), //Siam
			Yellow(1), //Siberia
			Red(1), //South Africa
			Blue(1), //Southern Europe
			White(1), //Ukraine
			Red(1), //Ural
			White(1), //Venezuela
			Black(1), //Western Australia
			Yellow(1), //Western Europe
			Red(2), //Western United States
			Green(1) //Yakutsk
		],
		/** ## White Africa ########################################################################
		*/
		whiteAfrica: [
			Green(12), //Afghanistan
			Black(12), //Alaska
			Blue(12), //Alberta
			Red(9), //Argentina
			White(5), //Brazil
			Yellow(12), //Central America
			Black(2), //China
			White(1), //Congo
			White(4), //East Africa
			Blue(1), //Eastern Australia
			Green(2), //Eastern United States
			White(5), //Egypt
			Blue(1), //Great Britain
			Red(2), //Greenland
			Blue(3), //Iceland
			Yellow(2), //India
			Black(1), //Indonesia
			Yellow(1), //Irkutsk
			Black(2), //Japan
			Green(1), //Kamchatka
			White(1), //Madagascar
			Yellow(2), //Middle East
			Red(4), //Mongolia
			Red(1), //New Guinea
			White(3), //North Africa
			Blue(1), //Northern Europe
			Blue(1), //Northwest Territory
			Black(1), //Ontario
			Green(1), //Peru
			Yellow(1), //Quebec
			Green(1), //Scandinavia
			Green(2), //Siam
			Yellow(1), //Siberia
			White(1), //South Africa
			Blue(1), //Southern Europe
			Black(1), //Ukraine
			Red(1), //Ural
			Black(1), //Venezuela
			Red(1), //Western Australia
			Yellow(1), //Western Europe
			Red(2), //Western United States
			Green(1) //Yakutsk
		],
		/** ## Black Africa ########################################################################
		*/
		blackAfrica: [
			Green(12), //Afghanistan
			White(12), //Alaska
			Blue(12), //Alberta
			Red(9), //Argentina
			Black(5), //Brazil
			Yellow(12), //Central America
			White(2), //China
			Black(1), //Congo
			Black(4), //East Africa
			Blue(1), //Eastern Australia
			Green(2), //Eastern United States
			Black(5), //Egypt
			Blue(1), //Great Britain
			Red(2), //Greenland
			Blue(3), //Iceland
			Yellow(2), //India
			White(1), //Indonesia
			Yellow(1), //Irkutsk
			White(2), //Japan
			Green(1), //Kamchatka
			Black(1), //Madagascar
			Yellow(2), //Middle East
			Red(4), //Mongolia
			Red(1), //New Guinea
			Black(3), //North Africa
			Blue(1), //Northern Europe
			Blue(1), //Northwest Territory
			White(1), //Ontario
			Green(1), //Peru
			Yellow(1), //Quebec
			Green(1), //Scandinavia
			Green(2), //Siam
			Yellow(1), //Siberia
			Black(1), //South Africa
			Blue(1), //Southern Europe
			White(1), //Ukraine
			Red(1), //Ural
			White(1), //Venezuela
			Red(1), //Western Australia
			Yellow(1), //Western Europe
			Red(2), //Western United States
			Green(1) //Yakutsk
		],
		/** ## Spread out ##########################################################################
		*/
		spreadOut: [
			Yellow(3), //Afghanistan
			White(3), //Alaska
			White(3), //Alberta
			White(2), //Argentina
			Green(3), //Brazil
			Blue(2), //Central America
			White(4), //China
			Blue(3), //Congo
			Yellow(4), //East Africa
			Green(2), //Eastern Australia
			Black(6), //Eastern United States
			Red(3), //Egypt
			Red(4), //Great Britain
			White(1), //Greenland
			Red(2), //Iceland
			Yellow(3), //India
			Green(4), //Indonesia
			White(5), //Irkutsk
			Green(4), //Japan
			Red(3), //Kamchatka
			Red(2), //Madagascar
			Yellow(3), //Middle East
			Black(5), //Mongolia
			Black(3), //New Guinea
			Black(2), //North Africa
			Green(1), //Northern Europe
			Yellow(2), //Northwest Territory
			Yellow(2), //Ontario
			Blue(2), //Peru
			Green(4), //Quebec
			Blue(3), //Scandinavia
			Yellow(3), //Siam
			Black(1), //Siberia
			Red(3), //South Africa
			Black(1), //Southern Europe
			Blue(3), //Ukraine
			Green(2), //Ural
			White(2), //Venezuela
			Red(3), //Western Australia
			Blue(3), //Western Europe
			Blue(4), //Western United States
			Black(2) //Yakutsk
		],
		/** ## Spread out Black ####################################################################
		*/
		spreadOutBlack: [
			Yellow(3), //Afghanistan
			Black(3), //Alaska
			Black(3), //Alberta
			Black(2), //Argentina
			Green(3), //Brazil
			Blue(2), //Central America
			Black(4), //China
			Blue(3), //Congo
			Yellow(4), //East Africa
			Green(2), //Eastern Australia
			White(6), //Eastern United States
			Red(3), //Egypt
			Red(4), //Great Britain
			Black(1), //Greenland
			Red(2), //Iceland
			Yellow(3), //India
			Green(4), //Indonesia
			Black(5), //Irkutsk
			Green(4), //Japan
			Red(3), //Kamchatka
			Red(2), //Madagascar
			Yellow(3), //Middle East
			White(5), //Mongolia
			White(3), //New Guinea
			White(2), //North Africa
			Green(1), //Northern Europe
			Yellow(2), //Northwest Territory
			Yellow(2), //Ontario
			Blue(2), //Peru
			Green(4), //Quebec
			Blue(3), //Scandinavia
			Yellow(3), //Siam
			White(1), //Siberia
			Red(3), //South Africa
			White(1), //Southern Europe
			Blue(3), //Ukraine
			Green(2), //Ural
			Black(2), //Venezuela
			Red(3), //Western Australia
			Blue(3), //Western Europe
			Blue(4), //Western United States
			White(2) //Yakutsk
		],
		/** ## Spread out version 2 ################################################################
		*/
		spreadOutV2: [
			Black(3), //Afghanistan
			Yellow(3), //Alaska
			Blue(3), //Alberta
			Green(2), //Argentina
			Red(3), //Brazil
			Black(3), //Central America
			Yellow(3), //China
			White(3), //Congo
			Green(3), //East Africa
			Black(4), //Eastern Australia
			Yellow(3), //Eastern United States
			Yellow(3), //Egypt
			White(3), //Great Britain
			Blue(3), //Greenland
			Red(3), //Iceland
			Blue(3), //India
			Green(5), //Indonesia
			Red(3), //Irkutsk
			Black(1), //Japan
			Green(3), //Kamchatka
			Red(2), //Madagascar
			White(3), //Middle East
			White(1), //Mongolia
			White(5), //New Guinea
			Black(3), //North Africa
			Green(3), //Northern Europe
			Black(3), //Northwest Territory
			Green(3), //Ontario
			White(2), //Peru
			White(3), //Quebec
			Black(3), //Scandinavia
			Red(3), //Siam
			Green(1), //Siberia
			Blue(2), //South Africa
			Blue(3), //Southern Europe
			Red(3), //Ukraine
			Blue(3), //Ural
			Blue(3), //Venezuela
			Yellow(4), //Western Australia
			Yellow(3), //Western Europe
			Red(3), //Western United States
			Yellow(1) //Yakutsk
		],
		/** ## Spread out E1 #######################################################################
		*/
		spreadOute1: [
			White(3), //Afghanistan
			Red(2), //Alaska
			Yellow(4), //Alberta
			Blue(3), //Argentina
			Green(2), //Brazil
			Red(2), //Central America
			Red(4), //China
			Black(2), //Congo
			Red(5), //East Africa
			Yellow(3), //Eastern Australia
			White(4), //Eastern United States
			Black(2), //Egypt
			Yellow(2), //Great Britain
			Red(1), //Greenland
			Green(3), //Iceland
			Red(4), //India
			Black(3), //Indonesia
			Yellow(3), //Irkutsk
			White(2), //Japan
			White(4), //Kamchatka
			Yellow(1), //Madagascar
			Green(1), //Middle East
			Blue(1), //Mongolia
			Blue(4), //New Guinea
			Yellow(3), //North Africa
			Black(2), //Northern Europe
			Green(4), //Northwest Territory
			Red(2), //Ontario
			Black(3), //Peru
			Green(4), //Quebec
			Blue(4), //Scandinavia
			Black(4), //Siam
			Green(3), //Siberia
			Green(3), //South Africa
			White(2), //Southern Europe
			Blue(3), //Ukraine
			Black(4), //Ural
			White(1), //Venezuela
			Blue(2), //Western Australia
			Blue(3), //Western Europe
			Yellow(4), //Western United States
			White(4) //Yakutsk
		],
		/** ## White spread out ####################################################################
		*/
		whiteSpreadOut: [
			Blue(1), //Afghanistan
			Black(1), //Alaska
			Black(2), //Alberta
			Yellow(1), //Argentina
			Yellow(1), //Brazil
			Yellow(12), //Central America
			Green(1), //China
			Yellow(2), //Congo
			Blue(1), //East Africa
			White(1), //Eastern Australia
			White(6), //Eastern United States
			Blue(12), //Egypt
			Red(1), //Great Britain
			White(1), //Greenland
			Red(1), //Iceland
			Blue(1), //India
			Green(2), //Indonesia
			Black(2), //Irkutsk
			White(1), //Japan
			Black(12), //Kamchatka
			Blue(1), //Madagascar
			Blue(3), //Middle East
			Green(1), //Mongolia
			Green(2), //New Guinea
			Yellow(2), //North Africa
			White(4), //Northern Europe
			Black(1), //Northwest Territory
			Black(1), //Ontario
			White(1), //Peru
			Black(1), //Quebec
			Red(4), //Scandinavia
			Green(1), //Siam
			Green(12), //Siberia
			Blue(1), //South Africa
			Red(2), //Southern Europe
			Red(9), //Ukraine
			Red(1), //Ural
			Yellow(1), //Venezuela
			Green(1), //Western Australia
			Red(2), //Western Europe
			Yellow(1), //Western United States
			White(6) //Yakutsk
		],
		/** ## Black spread out ####################################################################
		*/
		blackSpreadOut: [
			Blue(1), //Afghanistan
			White(1), //Alaska
			White(2), //Alberta
			Yellow(1), //Argentina
			Yellow(1), //Brazil
			Yellow(12), //Central America
			Green(1), //China
			Yellow(2), //Congo
			Blue(1), //East Africa
			Black(1), //Eastern Australia
			Black(6), //Eastern United States
			Blue(12), //Egypt
			Red(1), //Great Britain
			Black(1), //Greenland
			Red(1), //Iceland
			Blue(1), //India
			Green(2), //Indonesia
			White(2), //Irkutsk
			Black(1), //Japan
			White(12), //Kamchatka
			Blue(1), //Madagascar
			Blue(3), //Middle East
			Green(1), //Mongolia
			Green(2), //New Guinea
			Yellow(2), //North Africa
			Black(4), //Northern Europe
			White(1), //Northwest Territory
			White(1), //Ontario
			Black(1), //Peru
			White(1), //Quebec
			Red(4), //Scandinavia
			Green(1), //Siam
			Green(12), //Siberia
			Blue(1), //South Africa
			Red(2), //Southern Europe
			Red(9), //Ukraine
			Red(1), //Ural
			Yellow(1), //Venezuela
			Green(1), //Western Australia
			Red(2), //Western Europe
			Yellow(1), //Western United States
			Black(6) //Yakutsk
		],
		/** ## All totalities but White ############################################################
		*/
		allTotalitiesButWhite: [
			White(6), //Afghanistan
			Black(5), //Alaska
			Black(2), //Alberta
			Yellow(1), //Argentina
			Yellow(7), //Brazil
			Yellow(2), //Central America
			Green(1), //China
			Blue(1), //Congo
			Blue(1), //East Africa
			Green(1), //Eastern Australia
			Black(5), //Eastern United States
			Blue(6), //Egypt
			Red(1), //Great Britain
			White(1), //Greenland
			Red(4), //Iceland
			Green(1), //India
			Green(3), //Indonesia
			White(1), //Irkutsk
			White(1), //Japan
			Yellow(1), //Kamchatka
			Blue(1), //Madagascar
			Blue(3), //Middle East
			Yellow(2), //Mongolia
			Green(3), //New Guinea
			Blue(7), //North Africa
			Red(1), //Northern Europe
			Black(1), //Northwest Territory
			Black(1), //Ontario
			Yellow(1), //Peru
			Black(1), //Quebec
			Red(4), //Scandinavia
			Green(10), //Siam
			White(1), //Siberia
			Blue(1), //South Africa
			Red(2), //Southern Europe
			Red(6), //Ukraine
			White(4), //Ural
			Yellow(6), //Venezuela
			Green(1), //Western Australia
			Red(2), //Western Europe
			Black(5), //Western United States
			White(6) //Yakutsk
		],
		/** ## All totalities but Black ############################################################
		*/
		allTotalitiesButBlack: [
			Black(6), //Afghanistan
			White(5), //Alaska
			White(2), //Alberta
			Yellow(1), //Argentina
			Yellow(7), //Brazil
			Yellow(2), //Central America
			Green(1), //China
			Blue(1), //Congo
			Blue(1), //East Africa
			Green(1), //Eastern Australia
			White(5), //Eastern United States
			Blue(6), //Egypt
			Red(1), //Great Britain
			Black(1), //Greenland
			Red(4), //Iceland
			Green(1), //India
			Green(3), //Indonesia
			Black(1), //Irkutsk
			Black(1), //Japan
			Yellow(1), //Kamchatka
			Blue(1), //Madagascar
			Blue(3), //Middle East
			Yellow(2), //Mongolia
			Green(3), //New Guinea
			Blue(7), //North Africa
			Red(1), //Northern Europe
			White(1), //Northwest Territory
			White(1), //Ontario
			Yellow(1), //Peru
			White(1), //Quebec
			Red(4), //Scandinavia
			Green(10), //Siam
			Black(1), //Siberia
			Blue(1), //South Africa
			Red(2), //Southern Europe
			Red(6), //Ukraine
			Black(4), //Ural
			Yellow(6), //Venezuela
			Green(1), //Western Australia
			Red(2), //Western Europe
			White(5), //Western United States
			Black(6) //Yakutsk
		]
	}).mapApply(function (n, ts) { // Now turn the arrays into objects.
		return [n, Iterable.zip(maps.classic.territories, ts).toObject()];
	}).toObject();
})();


/** See __prologue__.js
*/
	[
		BoardMap, Risk, players.RiskContinentPlayer, AttackAleatory
	].forEach(function (type) {
		type.__SERMAT__.identifier = exports.__package__ +'.'+ type.__SERMAT__.identifier;
		exports.__SERMAT__.include.push(type);
	});
	Sermat.include(exports);
	return exports;
});
//# sourceMappingURL=ludorum-risky.js.map