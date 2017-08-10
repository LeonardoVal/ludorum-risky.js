/** Gruntfile for [ludorum-risky.js](??).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
				'probabilities',
				'maps',
				'Risk',
				'players',
				'scenarios',
			'__epilogue__'],
		deps: [
			{ name: 'creatartis-base', id: 'base',
				path: 'node_modules/creatartis-base/build/creatartis-base.min.js' },
			{ name: 'sermat', id: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ name: 'ludorum', id: 'ludorum',
				path: 'node_modules/ludorum/build/ludorum.min.js' }
		],
		jshint: { loopfunc: true, boss: true, evil: true, proto: true },
		karma: ['Firefox', 'Chrome', 'IE']
	});

	grunt.registerTask('test-all', ['test', 'karma:chrome', 'karma:ie']);
	grunt.registerTask('default', ['build']);
};
