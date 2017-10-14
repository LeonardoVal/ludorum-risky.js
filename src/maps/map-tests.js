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
