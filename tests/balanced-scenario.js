/** # Balanced scenario

Since defining a balanced scenario manually proved to be quite difficult, this is an attempt at
finding it automatically.
*/
"use strict";
require('source-map-support').install();

/** Setting up the Capataz server.
*/
var path = require('path'),
	base = require('creatartis-base'),
	Sermat = require('sermat'),
	ludorum = require('ludorum'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum_risky = require('../build/ludorum-risky'),

	Future = base.Future,
	Iterable = base.Iterable,
	iterable = base.iterable,

	server = capataz.Capataz.run({
		port: 8088,
		workerCount: 3,
		desiredEvaluationTime: 10000, // 10 seconds.
		//customFiles: path.dirname(module.filename) + '/lib',
		logFile: base.Text.formatDate(null, '"./tests/logs/balanced-scenario-"yyyymmdd-hhnnss".txt"'),
		maxScheduled: 1e6
	});
	server.expressApp.get(server.config.staticRoute +'/sermat.js', function (request, response) {
		response.sendFile(path.join(__dirname, '../node_modules/creatartis-base/build/sermat-umd.js'));
	});
	server.expressApp.get(server.config.staticRoute +'/creatartis-base.js', function (request, response) {
		response.sendFile(path.join(__dirname, '../node_modules/creatartis-base/build/creatartis-base.min.js'));
	});
	server.expressApp.get(server.config.staticRoute +'/ludorum.js', function (request, response) {
		response.sendFile(path.join(__dirname, '../node_modules/ludorum/build/ludorum.min.js'));
	});
	server.expressApp.get(server.config.staticRoute +'/ludorum-risky.js', function (request, response) {
		response.sendFile(path.join(__dirname, '../build/ludorum-risky.js'));
	});

// ## Scenario test. ###############################################################################

var BalancedScenarioProblem = base.declare(inveniemus.Problem, {
	constructor: function BalancedScenarioProblem(params) {
		params = params || {};
		params.objectives = -Infinity; // Minimization
		inveniemus.Problem.call(this, params);
		/** Problem parameters.
		*/
		this.boardMap = params.boardMap || ludorum_risky.maps.classic;
		this.initialArmyCount = params.initialArmyCount || 20;
		this.maxRounds = params.maxRounds || 10;
		this.matchCount = params.matchCount || 102;
		this.referencePlayers = params.referencePlayers || ludorum_risky.Risk.prototype.players.map(function () {
				return new ludorum_risky.players.RiskContinentPlayer();
			});
		/** Element model.
		*/
		var elementLength = this.boardMap.territories.length * 2;
		this.__elementModel__ = Iterable.repeat({ min: 0, max: 1-1e-8, discrete: false }, elementLength).toArray();
	},

	/** Every territory in the map uses two values of the element. The first one is the index of the
	territory. The second one defines the army count. All values are in the [0,1) range.
	*/
	mapping: function mapping(element) {
		var problem = this,
			territories = this.boardMap.territories.slice(), // Shallow copy.
			result = iterable(territories).map(function (t) {
				return [t, ["", 0]];
			}).toObject(),
			players = ludorum_risky.Risk.prototype.players,
			counts = Iterable.repeat(0, players.length).toArray(),
			sums = Iterable.repeat(0, players.length).toArray(),
			i, len, t, p;
		for (i = 0, len = territories.length; i < len; i++) {
			t = Math.min(territories.length - 1, element.values[i * 2] * territories.length |0);
			p = i % players.length;
			result[territories.splice(t, 1)[0]] = [p, element.values[i * 2 + 1]];
			counts[p]++;
			sums[p] += element.values[i * 2 + 1];
		}
		players.forEach(function (player, p) {
			var amount = problem.initialArmyCount - counts[p],
				sum = sums[p];

			iterable(result).forEachApply(function (t, pair) {
				if (pair[0] === p) {
					var c = 1 + (pair[1] ? Math.round(pair[1] / sum * amount) : 0);
					amount -= c - 1;
					sum -= pair[1];
					result[t] = [player, c];
				}
			});
		});
		return result;
	},

	evaluate: function evaluate(elements, reevaluate) {
		return inveniemus.Problem.prototype.evaluate(elements, true);
	},

	/** The evaluation of the scenario is the difference between the maximum and the minimum amounts
	of victories for every player, having run `matchCount` matches. It must be minimized to get a
	balanced scenario.
	*/
	evaluation: function evaluation(element) {
		var jobFunction = (function (ludorum_risky, ludorum, Sermat, match) {
				var m = Sermat.mat(match);
				return m.run().then(function () {
					var result = m.result();
					return m.state().players.filter(function (p) { // Return the winner.
						return result[p] > 0;
					})[0];
				});
			});

		var armies = this.mapping(element),
			game = new ludorum_risky.Risk({ boardMap: this.boardMap, rounds: this.maxRounds, armies: armies }),
			match = new ludorum.Match(game, this.referencePlayers),
			emblem = this.boardMap.territories.map(function (t) {
					var pair = armies[t];
					return pair[0].charAt(0) + pair[1];
				}).join('|');
		return Future.all(Iterable.range(this.matchCount).map(function (i) {
			var m = Sermat.ser(match, { mode: Sermat.BINDING_MODE });
			return server.schedule({
				info: emblem +' #'+ i,
				fun: jobFunction,
				imports: ['ludorum-risky', 'ludorum', 'sermat'],
				args: [m]
			});
		})).then(function (winners) {
			var victories = {};
			winners.forEach(function (w) {
				victories[w] = (victories[w] |0) + 1;
			});
			victories = iterable(game.players.map(function (p) {
					return victories[p];
				}));
			return victories.max() - victories.min();
		});
	}
}); // declare BalancedScenarioProblem

// ## Main #########################################################################################

(function main() {
	var problem = new BalancedScenarioProblem({
			matchCount: 204, maxRounds: 10
		}),
		mh = new inveniemus.metaheuristics.GeneticAlgorithm({
			problem: problem, expansionRate: 0.9, size: 50, steps: 50, mutationRate: 0.5
		});
	mh.events.on('advanced', function () {
		var evalStat = mh.statistics.stat({ key:'evaluation', step: mh.step }),
			best = mh.state[0].mapping();
		server.logger.info("Advanced to step #"+ mh.step +". Evaluations "+
			evalStat.minimum() +" < "+ evalStat.average() +" < "+ evalStat.maximum() +". Best so far:\n"+
			JSON.stringify(best).replace(/([,\{])"/g, '$1\n\t"').replace(/\}/g, '\n}') +"\n"
		);
	});
	mh.run().then(function () {
		server.logger.info("Finished. Stopping server.");
		setTimeout(process.exit, 10);
	}, function (error) {
		server.logger.error(error +'');
		setTimeout(process.exit, 10);
	});
})(); // main
