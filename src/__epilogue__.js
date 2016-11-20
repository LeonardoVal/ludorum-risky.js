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
}