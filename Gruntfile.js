/** Gruntfile for [ludorum-risky.js](??).
*/
var path = require('path');

var sourceFiles = ['__prologue__',
	'probabilities', 'maps', 'Risk', 'RiskPlayer', 'players', 'scenarios',
	'__epilogue__'].map(function (module) {
		return 'src/'+ module +'.js';
	});

var UMDWrapper = function (global, init) { "use strict";
	if (typeof define === 'function' && define.amd) {
		define(['creatartis-base', 'sermat', 'ludorum'], init); // AMD module.
	} else if (typeof exports === 'object' && module.exports) {
		module.exports = init(require('creatartis-base'), require('sermat'), require('ludorum')); // CommonJS module.
	} else {
		global.ludorum_risky = init(global, global.base, global.Sermat, global.ludorum); // Browser.
	}
};

module.exports = function(grunt) {
	grunt.file.defaultEncoding = 'utf8';
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: { //////////////////////////////////////////////////////////////////////////////////
			options: {
				separator: '\n\n',
				sourceMap: true
			},
			build_umd: {
				options: {
					banner: '('+ UMDWrapper +')(this,',
					footer: ');'
				},
				src: sourceFiles,
				dest: 'build/<%= pkg.name %>.js',
			}
		},
		jshint: { //////////////////////////////////////////////////////////////////////////////////
			options: { // Check <http://jshint.com/docs/options/>.
				loopfunc: true,
				boss: true,
				evil: true,
				proto: true
			},
			build_umd: {
				src: ['build/<%= pkg.name %>.js', 'tests/specs/*.js', 'tests/playtester/risk-ui.js'],
			},
		},
		uglify: { //////////////////////////////////////////////////////////////////////////////////
			options: {
				report: 'min',
				sourceMap: true
			},
			build_umd: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>-min.js',
				options: {
					sourceMapIn: 'build/<%= pkg.name %>.js.map',
					sourceMapName: 'build/<%= pkg.name %>-min.js.map'
				}
			}
		},
		copy: { ////////////////////////////////////////////////////////////////////////////////////
			test: {
				files: [
					'node_modules/requirejs/require.js',
						{ src: 'node_modules/requirejs-text/text.js', dest: 'require-text.js' },
						{ src: 'node_modules/requirejs-plugins/src/image.js', dest: 'require-image.js' },
					'node_modules/creatartis-base/build/creatartis-base.js',
						'node_modules/creatartis-base/build/creatartis-base.js.map',
					{ src: 'node_modules/sermat/build/sermat-umd.js', dest: 'sermat.js'}, 
						{ src: 'node_modules/sermat/build/sermat-umd.js.map', dest: 'sermat.js.map' },
					'node_modules/ludorum/build/ludorum.js',
						'node_modules/ludorum/build/ludorum.js.map',
					'build/<%= pkg.name %>.js',
						'build/<%= pkg.name %>.js.map'
					].map(function (f) { 
						return { nonull: true, src: f.src || f, dest: 'tests/lib/'+ path.basename(f.dest || f) };
					})
			}
		},
		karma: { ///////////////////////////////////////////////////////////////////////////////////
			options: {
				configFile: 'tests/karma.conf.js'
			},
			build: { browsers: ['PhantomJS'] },
			chrome: { browsers: ['Chrome'] },
			firefox: { browsers: ['Firefox'] },
			iexplore: { browsers: ['IE'] }
		},
		docker: { //////////////////////////////////////////////////////////////////////////////////
			document: {
				src: sourceFiles.concat(['README.md', 'docs/*.md']),
				dest: 'docs/docker',
				options: {
					colourScheme: 'borland',
					ignoreHidden: true,
					exclude: 'src/__prologue__.js,src/__epilogue__.js'
				}
			}
		}
	});
// Load tasks. /////////////////////////////////////////////////////////////////////////////////////
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-docker');
	
// Register tasks. /////////////////////////////////////////////////////////////////////////////////
	grunt.registerTask('compile', ['concat:build_umd', 'jshint:build_umd', 'uglify:build_umd', 'copy:test']); 
	grunt.registerTask('test', ['compile', 'karma:build']); 
	grunt.registerTask('test-all', ['test', 'karma:chrome', 'karma:firefox', 'karma:iexplore']);
	grunt.registerTask('build', ['test', 'docker:document']);
	grunt.registerTask('default', ['build']);
};