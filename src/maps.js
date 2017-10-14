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
