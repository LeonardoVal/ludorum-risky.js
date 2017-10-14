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
