/** # Risk.

Implementation of the Risk game
*/
var Risk = exports.Risk = declare(Game, {
	name: 'Risk',

	/** There are six players, each named after a colour.
	*/
	players: ["White", "Yellow", "Red", "Green", "Blue", "Black"],

	/** The active player can be in one of the following stages in his turn:

	+ `PLACE`: Territories are being allocated among the players.

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
		PLACE: -1, REINFORCE: 0, ATTACK: 1, OCCUPY: 2, FORTIFY: 3
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
		if (!this.stage) { //FIXME Check placement.
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
					r = this.tied();
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
					case this.STAGES.PLACE:     r[activePlayer] = this.placeMoves(); break;
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

	/** The amount fo armies each player puts on the board at the start of the game depends on the
	number of players.
	*/
	initialArmyCount: function initialArmyCount(playerCount) {
		return [-1,-1,40,35,30,25,20][playerCount || this.players.length]; // See rules.
	},

	/** The moves for placement are array sof the form `["PLACE", territory]`.
	*/
	placeMoves: function placeMoves() {
		var game = this,
			activePlayer = this.activePlayer(),
			playerCount = game.players.length,
			armyCount = game.initialArmyCount(playerCount),
			armies = game.armies,
			result = [];
		if (game.stage[0] === this.STAGES.PLACE) {
			result = iterable(armies).filter(function (chr, i) {
				var isFree = chr === '\0'; // Unoccupied territory in the compressed game state.
				if (!isFree && game.players[chr % this.players.length] === activePlayer) {
					armyCount -= Math.floor(chr / this.players.length);
				}
				return isFree;
			}, function (chr, i) {
				return ['PLACE', i];
			}).toArray();
			if (result.length < 1 && armyCount > 0) {
				result = iterable(armies).filter(function (chr, i) {
					return game.players[chr % this.players.length] === activePlayer;
				}, function (chr, i) {
					return ['PLACE', i];
				}).toArray();
			}
		}
		return result.length > 0 ? result : [this.PASS_MOVE];
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

	isValidPlace: function isValidPlace(move, onError) {
		var stage = this.stage;
		if (stage[0] !== this.STAGES.PLACE) {
			if (onError) onError("Cannot place in this stage (" + stage + ")!");
			return false;
		}
		var territory = move[1];
		if (this.playerOf(territory) !== "" && this.playerOf(territory) !== this.activePlayer()) {
			if (onError) onError("Cannot place in territory "+ move[1] +" because it is not free nor owned by "+ activePlayer +"!");
			return false;
		}
		return true;
	},

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
			case "PLACE":     return this.nextPlacement(move);
			case "REINFORCE": return this.nextReinforce(move);
			case "ATTACK":    return this.nextAttack(move, haps);
			case "OCCUPY":    return this.nextOccupy(move);
			case "FORTIFY":   return this.nextFortify(move);
			case "PASS":      return this.nextPass(move);
			default:          raise("Invalid move < ", JSON.stringify(move), " >!");
		}
	},

	/** The placement of one army in a territory, as it should be done at the beginning of the
	game. The `move` should be in the form `["PLACE", territory]`, and the game's stage should be
	in the form `[STAGES.PLACE]`.
	*/
	nextPlacement: function nextPlacement(move) {
		if (this.isValidReinforce(move, raise)) {
			var stage = this.stage,
				armies = this.uncompressGameState(this.armies),
				activePlayer = this.activePlayer();
			armies[move[1]][1] += 1;
			return new this.constructor({
				boardMap: this.boardMap,
				stage: [this.STAGES.PLACE],
				round: -1,
				rounds: this.rounds,
				armies: armies,
				activePlayer: this.players[(this.players.indexOf(activePlayer) + 1) % this.players.length]
			});
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
