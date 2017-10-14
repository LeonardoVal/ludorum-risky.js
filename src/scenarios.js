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
