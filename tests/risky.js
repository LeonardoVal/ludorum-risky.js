"use strict";
require.config({
	paths: {
		"creatartis-base": "creatartis-base.min",
		"sermat": "sermat-umd",
		"ludorum": "ludorum.min",
		"playtester": "playtester-common"
	}
});
require(['ludorum-risky', 'ludorum', 'creatartis-base', 'sermat', 'playtester'],
function (ludorum_risky, ludorum, base, Sermat, PlayTesterApp) {
	console.log("Loaded ludorum_risky, ludorum, base, sermat and PlayTesterApp.");
	Window.base = base;
	Window.Sermat = Sermat;
	Window.ludorum = ludorum;
	Window.PlayTesterApp = PlayTesterApp;
	Window.ludorum_risky = ludorum_risky;

	base.HttpRequest.get('maps/map-test01.svg').then(function (xhr) {
		document.getElementById('board').innerHTML = xhr.response;
		var svg = document.querySelector('#board svg');

		/** PlayTesterApp initialization.
		*/
		base.global.APP = new PlayTesterApp(
			new ludorum_risky.Risk({
				boardMap: ludorum_risky.maps.test01,
				armies: {
					WhiteCountry:  ['White', 6],
					YellowCountry: ['Yellow', 6],
					RedCountry:    ['Red', 6],
					GreenCountry:  ['Green', 6],
					BlueCountry:   ['Blue', 6],
					BlackCountry:  ['Black', 6],
				}
		 	}),
			new ludorum_risky.RiskSVGInterface(),
			//new ludorum.players.UserInterface.BasicHTMLInterface({ container: document.getElementById('board') }),
			{ bar: document.getElementsByTagName('footer')[0] });
		APP.playerUI("You")
			.playerRandom()
			/*
			.playerMonteCarlo("MCTS (10 sims)", true, 10)
			.playerMonteCarlo("MCTS (100 sims)", true, 100)
			.playerUCT("UCT (10 sims)", true, 10)
			.playerUCT("UCT (100 sims)", true, 100)
			.playerAlfaBeta("MiniMax-\u03b1\u03b2 (4 plies)", true, 3)
			.playerAlfaBeta("MiniMax-\u03b1\u03b2 (6 plies)", true, 5)
			.playerMaxN("MaxN (6 plies)", true, 5)
			*/
			.selects(['playerWhite', 'playerYellow', 'playerRed', 'playerGreen', 'playerBlue',
				'playerBlack'])
			.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
			.reset();
	}); // HttpRequest.get
}); // require().
