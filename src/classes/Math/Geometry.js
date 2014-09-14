/**
 * Provides methods useful for working with various types of geometries
 *
 * @class GeometryMethods
 * @static
 */
Goblin.GeometryMethods = {
	/**
	 * determines the location in a triangle closest to a given point
	 *
	 * @method findClosestPointInTriangle
	 * @param {vec3} p point
	 * @param {vec3} a first triangle vertex
	 * @param {vec3} b second triangle vertex
	 * @param {vec3} c third triangle vertex
	 * @param {vec3} out vector where the result will be stored
	 */
	findClosestPointInTriangle: function() {
		var ab = vec3.create(),
			ac = vec3.create(),
			_vec = vec3.create();

		return function( p, a, b, c, out ) {
			var v;

			// Check if P in vertex region outside A
			vec3.subtract( b, a, ab );
			vec3.subtract( c, a, ac );
			vec3.subtract( p, a, _vec );
			var d1 = vec3.dot( ab, _vec ),
				d2 = vec3.dot( ac, _vec );
			if ( d1 <= 0 && d2 <= 0 ) {
				vec3.set( a, out );
				return;
			}

			// Check if P in vertex region outside B
			vec3.subtract( p, b, _vec );
			var d3 = vec3.dot( ab, _vec ),
				d4 = vec3.dot( ac, _vec );
			if ( d3 >= 0 && d4 <= d3 ) {
				vec3.set( b, out );
				return;
			}

			// Check if P in edge region of AB
			var vc = d1*d4 - d3*d2;
			if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {
				v = d1 / ( d1 - d3 );
				vec3.scale( ab, v, out );
				vec3.add( out, a );
				return;
			}

			// Check if P in vertex region outside C
			vec3.subtract( p, c, _vec );
			var d5 = vec3.dot( ab, _vec ),
				d6 = vec3.dot( ac, _vec );
			if ( d6 >= 0 && d5 <= d6 ) {
				vec3.set( c, out );
				return;
			}

			// Check if P in edge region of AC
			var vb = d5*d2 - d1*d6,
				w;
			if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {
				w = d2 / ( d2 - d6 );
				vec3.scale( ac, w, out );
				vec3.add( out, a );
				return;
			}

			// Check if P in edge region of BC
			var va = d3*d6 - d5*d4;
			if ( va <= 0 && d4-d3 >= 0 && d5-d6 >= 0 ) {
				w = (d4 - d3) / ( (d4-d3) + (d5-d6) );
				vec3.subtract( c, b, out );
				vec3.scale( out, w );
				vec3.add( out, b );
				return;
			}

			// P inside face region
			var denom = 1 / ( va + vb + vc );
			v = vb * denom;
			w = vc * denom;


			// At this point `ab` and `ac` can be recycled and lose meaning to their nomenclature

			vec3.scale( ab, v );
			vec3.add( ab, a );

			vec3.scale( ac, w );

			vec3.add( ab, ac, out );
		};
	}(),

	/**
	 * Finds the Barycentric coordinates of point `p` in the triangle `a`, `b`, `c`
	 *
	 * @method findBarycentricCoordinates
	 * @param p {vec3} point to calculate coordinates of
	 * @param a {vec3} first point in the triangle
	 * @param b {vec3} second point in the triangle
	 * @param c {vec3} third point in the triangle
	 * @param out {vec3} resulting Barycentric coordinates of point `p`
	 */
	findBarycentricCoordinates: function( p, a, b, c, out ) {

		var v0 = vec3.create(),
			v1 = vec3.create(),
			v2 = vec3.create();

		vec3.subtract( b, a, v0 );
		vec3.subtract( c, a, v1 );
		vec3.subtract( p, a, v2 );

		var d00 = vec3.dot( v0, v0 ),
			d01 = vec3.dot( v0, v1 ),
			d11 = vec3.dot( v1, v1 ),
			d20 = vec3.dot( v2, v0 ),
			d21 = vec3.dot( v2, v1 ),
			denom = d00 * d11 - d01 * d01;

		out[1] = ( d11 * d20 - d01 * d21 ) / denom;
		out[2] = ( d00 * d21 - d01 * d20 ) / denom;
		out[0] = 1 - out[1] - out[2];
	},

	/**
	 * Calculates the distance from point `p` to line `ab`
	 * @param p {vec3} point to calculate distance to
	 * @param a {vec3} first point in line
	 * @param b [vec3] second point in line
	 * @returns {number}
	 */
	findSquaredDistanceFromSegment: (function(){
		var ab = vec3.create(),
			ap = vec3.create(),
			bp = vec3.create();

		return function( p, a, b ) {
			vec3.subtract( a, b, ab );
			vec3.subtract( a, p, ap );
			vec3.subtract( b, p, bp );

			var e = vec3.dot( ap, ab );
			if ( e <= 0 ) {
				return vec3.dot( ap, ap );
			}

			var f = vec3.dot( ab, ab );
			if ( e >= f ) {
				return vec3.dot( bp, bp );
			}

			return vec3.dot( ap, ap ) - e * e / f;
		};
	})()
};