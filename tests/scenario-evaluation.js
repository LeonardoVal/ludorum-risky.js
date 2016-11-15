/**
*/
"use strict";
require('source-map-support').install();

/** Setting up the Capataz server.
*/
var path = require('path'),
	base = require('creatartis-base'),
	Sermat = require('sermat'),
	ludorum = require('ludorum'),
	capataz = require('capataz'),
	ludorum_risky = require('./lib/ludorum-risky'),
	
	Future = base.Future,
	Iterable = base.Iterable,
	
	server = capataz.Capataz.run({
		port: 80,
		workerCount: 3,
		desiredEvaluationTime: 10000, // 10 seconds.
		customFiles: path.dirname(module.filename) + '/lib',
		logFile: base.Text.formatDate(null, '"./tests/logs/simulation-"yyyymmdd-hhnnss".txt"')
	});

// ## Scenario test. ###############################################################################

function scenarioTest(name, players, matchCount, maxRounds, stats) {
	var jobFunction = (function (ludorum_risky, ludorum, Sermat, match) {
			var m = Sermat.mat(match);
			return m.run().then(function () {
				var finalState = m.state();
				return {
					result: m.result(), 
					scores: finalState.scores(), 
					round: finalState.round 
				};
			});
		});
		
	var armies = ludorum_risky.scenarios[name],
		game = new ludorum_risky.Risk({ rounds: maxRounds, armies: armies }),
		match = new ludorum.Match(game, players);
	
	return Future.all(Iterable.range(matchCount).map(function (i) {
		var m = Sermat.ser(match, { mode: 2 });
		return server.schedule({
			info: name +' #'+ i,
			fun: jobFunction,
			imports: ['ludorum-risky', 'ludorum', 'sermat'],
			args: [m]
		}).then(function (data) {
			var somebodyWon = false;
			game.players.forEach(function (p) {
				if (data.result[p] > 0) {
					stats.add({key: 'victories', player: p, maxRounds: maxRounds, scenario: name});
					somebodyWon = true;
				}
				stats.add({key: 'score', player: p, maxRounds: maxRounds, scenario: name}, data.scores[p]);
			});
			if (!somebodyWon) {
				stats.add({key: 'draws', maxRounds: maxRounds, scenario: name});
			}
			stats.add({key: 'rounds', maxRounds: maxRounds, scenario: name}, data.round);
		});
	}))
} // function scenarioTest
	
// ## Main #########################################################################################
	
var PARAMS_MAX_ROUNDS = [50],//5, 10, 20/*, 30*/],
	PARAMS_SCENARIOS = ['whiteOceania', 'whiteAfrica', 'spreadOut', 'whiteSpreadOut', 'allTotalitiesButWhite'],
	MATCH_COUNT = 100,
	STATISTICS = new base.Statistics();
	
Future.sequence(Iterable.product(PARAMS_MAX_ROUNDS, PARAMS_SCENARIOS), function (args) {
	var continentPlayers = [1, 2, 3, 4, 5, 6].map(function () {
			return new ludorum_risky.players.RiskContinentPlayer();
			//return new ludorum.players.RandomPlayer();
		});
	
	//var randomPlayers = Iterable.repeat(new ludorum.players.RandomPlayer(), 6).toArray();
	return scenarioTest(args[1], continentPlayers, MATCH_COUNT, args[0], STATISTICS);
}).then(function () {
	server.logger.info("Statistics:\n"+ STATISTICS);
	server.logger.info(JSON.stringify(ludorum_risky.scenarios.spreadOut));
	server.logger.info("Finished. Stopping server.");
	setTimeout(process.exit, 10);
}, function (error) {
	server.logger.error(error +'');
	//process.exit();
});
// Fin