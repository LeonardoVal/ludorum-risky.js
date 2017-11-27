/** Gruntfile for [ludorum-risky.js](??).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		connect: {
			options: {
				port: 8088,
				keepalive: true,
				base: '.'
			},
			playtester: {
				options: {
					open: 'http://localhost:8088/tests/risky.html'
				}
			},
			console: {
				options: {
					open: 'http://localhost:8088/tests/console.html'
				}
			}
		}
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
				'probabilities',
				'maps', 'maps/map-tests', 'maps/map-classic',
				'Risk',
				'players', 'players/player-simple', 'players/player-continent',
				'scenarios',
				'ui',
			'__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ id: 'ludorum', name: 'ludorum' },
			{ id: 'playtester', dev: true, module: false,
				path: 'node_modules/ludorum/build/playtester-common.js' }
		],
		jshint: { loopfunc: true, boss: true, evil: true, proto: true },
		bundled: [
			{ src: 'src/maps/map-test01.svg', dest: 'build/maps/map-test01.svg', nonull: true }
		],
		karma: ['Firefox', 'Chrome', 'IE']
	});

	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.registerTask('test-all', ['test', 'karma:chrome', 'karma:ie']);
	grunt.registerTask('playtest', ['compile', 'connect:playtester']);
	grunt.registerTask('console', ['compile', 'connect:console']);
	grunt.registerTask('default', ['build']);
};
