var gulp = require( 'gulp' ),
	uglify = require('gulp-uglify' ),
	concat = require( 'gulp-concat' );

gulp.task('build', function(){
	gulp.src([
		'src/intro.js',
		'src/classes/Math/**.js',
		'src/libglobals.js',
		'src/classes/EventEmitter.js',
		'src/classes/RigidBody.js',
		'src/classes/**/*.js',
		'src/outro.js'
	])
	.pipe( concat( 'goblin.js' ) )
	.pipe( gulp.dest( 'build' ) );
});

gulp.task('build-minified', function(){
	gulp.src([
		'src/intro.js',
		'src/classes/Math/**.js',
		'src/libglobals.js',
		'src/classes/EventEmitter.js',
		'src/classes/RigidBody.js',
		'src/classes/**/*.js',
		'src/outro.js'
	])
	.pipe( concat( 'goblin.min.js' ) )
	.pipe( uglify() )
	.pipe( gulp.dest( 'build' ) );
});

gulp.task('default', ['build', 'build-minified'], function(){});