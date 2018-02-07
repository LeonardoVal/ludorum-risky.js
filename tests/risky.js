require(['require-config'], function (init) { "use strict";
init(['ludorum-risky', 'ludorum', 'creatartis-base', 'sermat', 'playtester'],
function (ludorum_risky, ludorum, base, Sermat, PlayTesterApp) {

	base.HttpRequest.get('../build/maps/map-test01.svg').then(function (xhr) {
		document.getElementById('board').innerHTML = xhr.response;
		var svg = document.querySelector('#board svg');

		/** PlayTesterApp initialization.
		*/
		base.global.APP = new PlayTesterApp(
			new ludorum_risky.Risk({
				boardMap: ludorum_risky.maps.test01,
				//stage: [-1],
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
			{ bar: document.getElementsByTagName('footer')[0] },
			[ludorum_risky]);
		APP.playerUI("You")
			.playerRandom()
			.playerMonteCarlo("MCTS (10 sims)", true, 10)
			.playerMonteCarlo("MCTS (100 sims)", true, 100)
			.playerUCT("UCT (10 sims)", true, 10)
			.playerUCT("UCT (100 sims)", true, 100)
			.selects(['playerWhite', 'playerYellow', 'playerRed', 'playerGreen', 'playerBlue',
				'playerBlack'])
			.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP));
		
		APP.setAllPlayers = function setAllPlayers(p) {
			this.elements.selects.forEach(function (select) {
				select.value = p;
				select.onchange();
			});
			this.reset();
		};
		document.getElementById('all-random').onclick = APP.setAllPlayers.bind(APP, 1);
		document.getElementById('all-MCTS10').onclick = APP.setAllPlayers.bind(APP, 2);

		APP.reset();
	}); // HttpRequest.get
}); // init()
}); // require().
