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
		raiseIf(!territories || Object.keys(territories).length < 2, "Illegal territory definition ", JSON.stringify(territories), "!");
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
				raiseIf(!territories.hasOwnProperty(f), "Territory ", t, " has a frontier with an unknown territory ", f, "!");
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
				raiseIf(!territories.hasOwnProperty(t), "Continent ", c, " has an unknown territory ", t, "!");
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
	
	/** TODO
	`territoryContinent` return the continent of the territory.
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

	/** `adjacent` is a predicate that tells if two territories are adjacent.
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
	
	/** `bonus` returns the bonus for a continent or continents, or zero if it is not defined.
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

/** The `MAPS` object holds map definitions, like: */
var MAPS = exports.MAPS = {
	/** + `test01` is a very small and simple map meant for testing only.
	*/
	test01: new BoardMap({
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
	}),
	
	/** + `classic` is the map of the original Risk.
	*/
	classic: new BoardMap({ // territories.
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
	}, { // continents.
		"South America": ["Argentina", "Brazil", "Peru", "Venezuela"],
		"Australia" : ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"],
		"Africa" : ["Congo", "East Africa", "Egypt", "Madagascar", "North Africa", "South Africa"],
		"Europe" : ["Great Britain", "Iceland", "Northern Europe", "Scandinavia", "Southern Europe", "Ukraine", "Western Europe"],
		"North America" : ["Alaska", "Alberta", "Central America", "Eastern United States", "Greenland", "Northwest Territory", "Ontario", "Quebec", "Western United States"],
		"Asia" : ["Afghanistan", "China", "India", "Irkutsk", "Japan", "Kamchatka", "Middle East", "Mongolia", "Siam", "Siberia", "Ural", "Yakutsk"]
	}, { // bonuses.
		"Asia" : 7,
		"North America" : 5,
		"Europe" : 5,
		"Africa" : 3,
		"Australia" : 2,
		"South America" : 2
	})
}; // MAPS