/*global module:false require:false*/
var fs = require( 'fs' );

module.exports = function ( grunt ) {

	grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );

	// Project configuration.
	grunt.initConfig( {
		pkg: 'GoblinPhysics',
		meta: {
			license: fs.readFileSync( 'LICENSE' ).toString(),
			banner: '/*\n' +
				'<%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>\n\n' +
				'<%= meta.license %>\n' +
				'*/'
		},
		lint: {
			files: ['grunt.js', 'src/classes/**/*.js', 'test/**/*.js']
		},
		test: {
			files: ['test/**/*.js']
		},
		concat: {
			dist: {
				src: [
					'!src/classes/Math/**.js',
					'!src/classes/EventEmitter.js',

					'<banner:meta.banner>',
					'src/intro.js',
					'src/classes/Math/**.js',
					'src/libglobals.js',
					'src/classes/EventEmitter.js',
					'src/classes/RigidBody.js',
					'src/classes/**/*.js',
					'src/outro.js'
				],
				dest: 'build/goblin.js'
			}
		},
		uglify: {
			goblin: {
				files: {
					'build/goblin.min.js': [ 'build/goblin.js' ]
				}
			}
		},
		min: {
			build: {
				src: ['<banner:meta.banner>', '<config:concat.build.dest>'],
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},
		watch: {
			files: '<config:lint.files>',
			tasks: 'lint test'
		},
		jshint: {
			options: {
				browser: true,
				curly: true,
				eqeqeq: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				smarttabs: true,
				globals: {
					'vec3': false,
					'quat4': true,
					'mat4': false,
					'mat3': false,
					'Goblin': true,
					'_tmp_vec3_1': true,
					'_tmp_vec3_2': true,
					'_tmp_vec3_3': true,
					'_tmp_quat4_1': true,
					'_tmp_quat4_2': true,
					'_tmp_mat3_1': true,
					'_tmp_mat3_2': true,
					'_tmp_mat4_1': true
				}
			},
			beforeconcat: ['grunt.js', 'src/classes/**/*.js', 'test/**/*.js']
		},
		yuidoc: {
			compile: {
				name: '<%= pkg.title %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '',
				options: {
					paths: 'src',
					outdir: 'docs'
				}
			}
		}
	} );

	// Default task.
	grunt.registerTask( 'default', ['jshint', 'concat', 'uglify'] );

	// Build documentation
	grunt.registerTask( 'docs', 'yuidoc' );

};
