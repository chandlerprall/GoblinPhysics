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
	findClosestPointInTriangle: (function() {
		var ab = new Goblin.Vector3(),
			ac = new Goblin.Vector3(),
			_vec = new Goblin.Vector3();

		return function( p, a, b, c, out ) {
			var v;

			// Check if P in vertex region outside A
			ab.subtractVectors( b, a );
			ac.subtractVectors( c, a );
			_vec.subtractVectors( p, a );
			var d1 = ab.dot( _vec ),
				d2 = ac.dot( _vec );
			if ( d1 <= 0 && d2 <= 0 ) {
				out.copy( a );
				return;
			}

			// Check if P in vertex region outside B
			_vec.subtractVectors( p, b );
			var d3 = ab.dot( _vec ),
				d4 = ac.dot( _vec );
			if ( d3 >= 0 && d4 <= d3 ) {
				out.copy( b );
				return;
			}

			// Check if P in edge region of AB
			var vc = d1*d4 - d3*d2;
			if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {
				v = d1 / ( d1 - d3 );
				out.scaleVector( ab, v );
				out.add( a );
				return;
			}

			// Check if P in vertex region outside C
			_vec.subtractVectors( p, c );
			var d5 = ab.dot( _vec ),
				d6 = ac.dot( _vec );
			if ( d6 >= 0 && d5 <= d6 ) {
				out.copy( c );
				return;
			}

			// Check if P in edge region of AC
			var vb = d5*d2 - d1*d6,
				w;
			if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {
				w = d2 / ( d2 - d6 );
				out.scaleVector( ac, w );
				out.add( a );
				return;
			}

			// Check if P in edge region of BC
			var va = d3*d6 - d5*d4;
			if ( va <= 0 && d4-d3 >= 0 && d5-d6 >= 0 ) {
				w = (d4 - d3) / ( (d4-d3) + (d5-d6) );
				out.subtractVectors( c, b );
				out.scale( w );
				out.add( b );
				return;
			}

			// P inside face region
			var denom = 1 / ( va + vb + vc );
			v = vb * denom;
			w = vc * denom;


			// At this point `ab` and `ac` can be recycled and lose meaning to their nomenclature

			ab.scale( v );
			ab.add( a );

			ac.scale( w );

			out.addVectors( ab, ac );
		};
	})(),

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

		var v0 = new Goblin.Vector3(),
			v1 = new Goblin.Vector3(),
			v2 = new Goblin.Vector3();

		v0.subtractVectors( b, a );
		v1.subtractVectors( c, a );
		v2.subtractVectors( p, a );

		var d00 = v0.dot( v0 ),
			d01 = v0.dot( v1 ),
			d11 = v1.dot( v1 ),
			d20 = v2.dot( v0 ),
			d21 = v2.dot( v1 ),
			denom = d00 * d11 - d01 * d01;

		out.y = ( d11 * d20 - d01 * d21 ) / denom;
		out.z = ( d00 * d21 - d01 * d20 ) / denom;
		out.x = 1 - out.y - out.z;
	},

	/**
	 * Calculates the distance from point `p` to line `ab`
	 * @param p {vec3} point to calculate distance to
	 * @param a {vec3} first point in line
	 * @param b [vec3] second point in line
	 * @returns {number}
	 */
	findSquaredDistanceFromSegment: (function(){
		var ab = new Goblin.Vector3(),
			ap = new Goblin.Vector3(),
			bp = new Goblin.Vector3();

		return function( p, a, b ) {
			ab.subtractVectors( a, b );
			ap.subtractVectors( a, p );
			bp.subtractVectors( b, p );

			var e = ap.dot( ab );
			if ( e <= 0 ) {
				return ap.dot( ap );
			}

			var f = ab.dot( ab );
			if ( e >= f ) {
				return bp.dot( bp );
			}

			return ap.dot( ap ) - e * e / f;
		};
	})()
};