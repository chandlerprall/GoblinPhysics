/**
 * Provides the classes and algorithms for running GJK+EPA based collision detection
 *
 * @submodule GjkEpa
 * @static
 */
Goblin.GjkEpa = {
	/**
	 * Holds a point on the edge of a Minkowski difference along with that point's witnesses and the direction used to find the point
	 *
	 * @class SupportPoint
	 * @param direction {vec3} Direction searched to find the point
	 * @param witness_a {vec3} Point in first object used to find the supporting point
	 * @param witness_b {vec3} Point in the second object ued to find th supporting point
	 * @param point {vec3} The support point on the edge of the Minkowski difference
	 * @constructor
	 */
	SupportPoint: function( direction, witness_a, witness_b, point ) {
		this.direction = direction;
		this.witness_a = witness_a;
		this.witness_b = witness_b;
		this.point = point;
	},

	/**
	 * Finds the extant point on the edge of the Minkowski difference for `object_a` - `object_b` in `direction`
	 *
	 * @method findSupportPoint
	 * @param object_a {Goblin.RigidBody} First object in the search
	 * @param object_b {Goblin.RigidBody} Second object in the search
	 * @param direction {vec3} Direction to find the extant point in
	 * @param gjk_point {Goblin.GjkEpa.SupportPoint} `SupportPoint` class to store the resulting point & witnesses in
	 */
	findSupportPoint: function( object_a, object_b, direction, gjk_point ) {
		// @TODO possible optimization would be using gjk_point`s direction instead of passing in a `direction` vector
		vec3.set( direction, gjk_point.direction );

		object_a.findSupportPoint( direction, gjk_point.witness_a );
		vec3.negate( direction, _tmp_vec3_1 );
		object_b.findSupportPoint( _tmp_vec3_1, gjk_point.witness_b );

		vec3.subtract( gjk_point.witness_a, gjk_point.witness_b, gjk_point.point );
	},

	/**
	 * Performs the GJK algorithm to detect a collision between the two objects
	 *
	 * @method GJK
	 * @param object_a {Goblin.RigidBody} First object to check for a collision state
	 * @param object_b {Goblin.RigidBody} Second object to check for a collision state
	 * @return {Goblin.ContactDetails|Boolean} Returns `false` if no collision, else a `ContactDetails` object
	 */
	GJK: (function() {
		var simplex = [],
			direction = vec3.create(),
			support_point,

			total_checks = 0,
			max_checks = 20, // @TODO make this a configurable member on `GJK`

			ao = vec3.create(),
			ab = vec3.create(),
			ac = vec3.create(),
			ad = vec3.create(),
			abc = vec3.create(),
			ab_abc = vec3.create(),
			abc_ac = vec3.create(),

			origin = vec3.create(), // always equal to [0, 0, 0]
			contains_origin = true, // invalidated if the simplex does not contain origin

			_vec3_1 = _tmp_vec3_1,
			_vec3_2 = _tmp_vec3_2,
			_vec3_3 = _tmp_vec3_3,

			expandSimplex = function( simplex, direction ) {

				var a, b, c, d; // `a` - `d` are references to the [up to] four points in the GJK simplex

				if ( simplex.length === 2 ) {
					// Line
					a = simplex[ 1 ];
					b = simplex[ 0 ];
					vec3.negate( a.point, ao );
					vec3.subtract( b.point, a.point, ab );

					// If ao happens to be at origin then there is a collision
					if ( ao[0] === 0 && ao[1] === 0 && ao[2] === 0 ) {
						return true;
					}

					if ( vec3.dot( ab, ao ) >= 0 ) {
						// Origin lies between A and B, move on to a 2-simplex
						vec3.cross( ab, ao, direction );
						vec3.cross( direction, ab );

						// In the very rare case that `ab` and `ao` are parallel vectors, direction becomes a 0-vector
						if (
							direction[0] === 0 &&
							direction[1] === 0 &&
							direction[2] === 0
						) {
							vec3.normalize( ab );
							direction[0] = 1 - Math.abs( ab[0] );
							direction[1] = 1 - Math.abs( ab[1] );
							direction[2] = 1 - Math.abs( ab[2] );
						}
					} else {
						// Origin is on the opposite side of A from B
						vec3.set( ao, direction );
						simplex.length = 1;
					}

				} else if ( simplex.length === 3 ) {

					// Triangle
					a = simplex[ 2 ];
					b = simplex[ 1 ];
					c = simplex[ 0 ];

					vec3.negate( a.point, ao );
					vec3.subtract( b.point, a.point, ab );
					vec3.subtract( c.point, a.point, ac );

					// Determine the triangle's normal
					vec3.cross( ab, ac, abc );

					// Edge cross products
					vec3.cross( ab, abc, ab_abc );
					vec3.cross( abc, ac, abc_ac );

					if ( vec3.dot( abc_ac, ao ) >= 0 ) {
						// Origin lies on side of ac opposite the triangle
						if ( vec3.dot( ac, ao ) >= 0 ) {
							// Origin outside of the ac line, so we form a new
							// 1-simplex (line) with points A and C, leaving B behind
							simplex.length = 0;
							simplex.push( c, a );

							// New search direction is from ac towards the origin
							vec3.cross( ac, ao, direction );
							vec3.cross( direction, ac );
						} else {
							// *
							if ( vec3.dot( ab, ao ) >= 0 ) {
								// Origin outside of the ab line, so we form a new
								// 1-simplex (line) with points A and B, leaving C behind
								simplex.length = 0;
								simplex.push( b, a );

								// New search direction is from ac towards the origin
								vec3.cross( ab, ao, direction );
								vec3.cross( direction, ab );
							} else {
								// only A gives us a good reference point, start over with a 0-simplex
								simplex.length = 0;
								simplex.push( a );
							}
							// *
						}

					} else {

						// Origin lies on the triangle side of ac
						if ( vec3.dot( ab_abc, ao ) >= 0 ) {
							// Origin lies on side of ab opposite the triangle

							// *
							if ( vec3.dot( ab, ao ) >= 0 ) {
								// Origin outside of the ab line, so we form a new
								// 1-simplex (line) with points A and B, leaving C behind
								simplex.length = 0;
								simplex.push( b, a );

								// New search direction is from ac towards the origin
								vec3.cross( ab, ao, direction );
								vec3.cross( direction, ab );
							} else {
								// only A gives us a good reference point, start over with a 0-simplex
								simplex.length = 0;
								simplex.push( a );
							}
							// *

						} else {

							// Origin lies somewhere in the triangle or above/below it
							if ( vec3.dot( abc, ao ) >= 0 ) {
								// Origin is on the front side of the triangle
								vec3.set( abc, direction );
							} else {
								// Origin is on the back side of the triangle
								vec3.set( abc, direction );
								vec3.negate( direction );
								simplex.length = 0;
								simplex.push( a, b, c );
							}

						}

					}

				} else if ( simplex.length === 4 ) {

					// Tetrahedron
					a = simplex[ 3 ];
					b = simplex[ 2 ];
					c = simplex[ 1 ];
					d = simplex[ 0 ];

					vec3.negate( a.point, ao );

					// First check if the origin is contained in this tetrahedron
					// If any of the sides face the origin then it is not inside
					contains_origin = true;

					// Check DCA
					vec3.subtract( d.point, a.point, ab );
					vec3.subtract( c.point, a.point, ad );
					vec3.cross( ab, ad, abc_ac );
					if ( vec3.dot( abc_ac, a.point ) > 0 ) {
						contains_origin = false;
					}

					// Check CBA
					vec3.subtract( c.point, a.point, ab );
					vec3.subtract( b.point, a.point, ad );
					vec3.cross( ab, ad, abc_ac );
					if ( vec3.dot( abc_ac, a.point ) > 0 ) {
						contains_origin = false;
					}

					// Check ADB
					vec3.subtract( b.point, a.point, ab );
					vec3.subtract( d.point, a.point, ad );
					vec3.cross( ab, ad, abc_ac );
					if ( vec3.dot( abc_ac, a.point ) > 0 ) {
						contains_origin = false;
					}

					// Check DCB
					vec3.subtract( b.point, d.point, ab );
					vec3.subtract( c.point, d.point, ad );
					vec3.cross( ab, ad, abc_ac );
					if ( vec3.dot( abc_ac, d.point ) > 0 ) {
						contains_origin = false;
					}

					if ( contains_origin ) {
						return contains_origin;
					}


					/*var center_dca = vec3.create(),
						center_cba = vec3.create(),
						center_adb = vec3.create(),
						center_dcb = vec3.create();

					Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, c.point, a.point, center_dca );
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, c.point, b.point, a.point, center_cba );
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, b.point, d.point, a.point, center_adb );
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, b.point, c.point, center_dcb );

					// @TODO these 4 checks may not be required for "apparent" accuracy,
					// or using a larger value than EPSILON to eliminate some extra iterations
					if ( vec3.squaredLength( center_dca ) < Goblin.EPSILON ) return true;
					if ( vec3.squaredLength( center_cba ) < Goblin.EPSILON ) return true;
					if ( vec3.squaredLength( center_adb ) < Goblin.EPSILON ) return true;
					if ( vec3.squaredLength( center_dcb ) < Goblin.EPSILON ) return true;*/



					// Tetrahedron doesn't contain the origin, bail
					// Find which face normal of the tetrahedron aligns best to AO
					var best = 0, dot = 0, shortest = Infinity, distance = 0;

					// @TODO this line, repeated four times below, may not be needed:
					// if ( vec3.squaredLength( _vec3_2 ) < Goblin.EPSILON ) return true;

					// Face 1, DCA
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, c.point, a.point, _vec3_2 );
					if ( vec3.squaredLength( _vec3_2 ) < Goblin.EPSILON ) {
						return true;
					}
					vec3.subtract( d.point, a.point, ab );
					vec3.subtract( c.point, a.point, ad );
					vec3.cross( ab, ad, _vec3_1 );
					//vec3.normalize( _vec3_1 );
					distance = vec3.length( _vec3_2 );
					if ( distance < shortest ) {
						shortest = distance;
						vec3.set( _vec3_1, direction );
						simplex.length = 0;
						simplex.push( a, c, d );
					}

					// Face 2, CBA
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, c.point, b.point, a.point, _vec3_2 );
					if ( vec3.squaredLength( _vec3_2 ) < Goblin.EPSILON ) {
						return true;
					}
					vec3.subtract( c.point, a.point, ab );
					vec3.subtract( b.point, a.point, ad );
					vec3.cross( ab, ad, _vec3_1 );
					//vec3.normalize( _vec3_1 );
					distance = vec3.length( _vec3_2 );
					if ( distance < shortest ) {
						shortest = distance;
						vec3.set( _vec3_1, direction );
						simplex.length = 0;
						simplex.push( a, b, c );
					}

					// Face 3, ADB
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, b.point, d.point, a.point, _vec3_2 );
					if ( vec3.squaredLength( _vec3_2 ) < Goblin.EPSILON ) {
						return true;
					}
					vec3.subtract( b.point, a.point, ab );
					vec3.subtract( d.point, a.point, ad );
					vec3.cross( ab, ad, _vec3_1 );
					//vec3.normalize( _vec3_1 );
					distance = vec3.length( _vec3_2 );
					if ( distance < shortest ) {
						shortest = distance;
						vec3.set( _vec3_1, direction );
						simplex.length = 0;
						simplex.push( b, d, a );
					}

					// Face 4, DCB
					Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, b.point, c.point, _vec3_2 );
					if ( vec3.squaredLength( _vec3_2 ) < Goblin.EPSILON ) {
						return true;
					}
					vec3.subtract( d.point, c.point, ab );
					vec3.subtract( b.point, c.point, ad );
					vec3.cross( ab, ad, _vec3_1 );
					//vec3.normalize( _vec3_1 );
					distance = vec3.length( _vec3_2 );
					if ( distance < shortest ) {
						shortest = distance;
						vec3.set( _vec3_1, direction );
						simplex.length = 0;
						simplex.push( c, b, d );
					}

				}

				// Didn't contain the origin, keep looking
				return false;

			};

		return function( object_a, object_b ) {
			// Start fresh
			simplex.length = 0;
			total_checks = 0;

			// @TODO there is a big debate about what the best initial search direction is - do any answers have much weight?
			vec3.subtract( object_b['position'], object_a['position'], direction );
			support_point = Goblin.ObjectPool.getObject( 'GJKSupportPoint' );
			Goblin.GjkEpa.findSupportPoint( object_a, object_b, direction, support_point );
			simplex.push( support_point );

			if ( vec3.dot( simplex[0].point, direction ) < 0 ) {
				// if the last added point was not past the origin in the direction
				// then the Minkowski difference cannot possibly contain the origin because
				// the last point added is on the edge of the Minkowski difference
				return false;
			}

			vec3.negate( direction );

			while ( true ) {
				total_checks++;
				if ( total_checks === max_checks ) {
					// In case of degenerate cases
					return false;
				}

				// Add the next support point
				support_point = Goblin.ObjectPool.getObject( 'GJKSupportPoint' );
				Goblin.GjkEpa.findSupportPoint( object_a, object_b, direction, support_point );
				simplex.push( support_point );

				if ( vec3.dot( simplex[simplex.length-1].point, direction ) < 0 ) {
					// if the last added point was not past the origin in the direction
					// then the Minkowski difference cannot possibly contain the origin because
					// the last point added is on the edge of the Minkowski difference
					return false;
				}

				if ( expandSimplex( simplex, direction ) ) {
					// if it does then we know there is a collision
					return Goblin.GjkEpa.EPA( object_a, object_b, simplex );
				}
			}

		};
	})(),

	/**
	 * Performs the Expanding Polytope Algorithm on the Minkowski difference of `object_a` and `object_b`
	 *
	 * @method EPA
	 * @param object_a {Goblin.RigidBody} First object in the algorithm
	 * @param object_b {Goblin.RigidBody} Second object in the algorithm
	 * @param simplex {Array} Array containing the points in a starting simplex - the simplex returned by GJK is a great start
	 * @return {Goblin.ContactDetails} Object containing the details of the found contact point
	 */
	EPA: function( object_a, object_b, simplex ) {

		// @TODO this should be moved to the GJK face class
		function checkForSharedVertices( face1, face2 ) {
			var shared_vertices = [];

			if (
				vec3.equal( face1.a.point, face2.a.point ) ||
					vec3.equal( face1.a.point, face2.b.point ) ||
					vec3.equal( face1.a.point, face2.c.point )
				) {
				shared_vertices.push( face1.a );
			}

			if (
				vec3.equal( face1.b.point, face2.a.point ) ||
					vec3.equal( face1.b.point, face2.b.point ) ||
					vec3.equal( face1.b.point, face2.c.point )
				) {
				shared_vertices.push( face1.b );
			}

			if (
				vec3.equal( face1.c.point, face2.a.point ) ||
					vec3.equal( face1.c.point, face2.b.point ) ||
					vec3.equal( face1.c.point, face2.c.point )
				) {
				shared_vertices.push( face1.c );
			}

			return shared_vertices;
		}

		// Our GJK algorithm does not guarantee a 3-simplex result,
		// so we need to account for 1- and 2-simplexes as well

		var _vec3_1 = _tmp_vec3_1,
			_vec3_2 = _tmp_vec3_2,
			_vec3_3 = _tmp_vec3_3,
			direction = _vec3_1,
			epa_support_point;

		if ( simplex.length === 2 ) {

			// GJK ended with a line segment, set search direction to be perpendicular to the line
			vec3.cross( simplex[0].point, simplex[1].point, direction );
			epa_support_point = Goblin.ObjectPool.getObject( 'GJKSupportPoint' );
			Goblin.GjkEpa.findSupportPoint( object_a, object_b, direction, epa_support_point );
			simplex.push( epa_support_point );
		}

		if ( simplex.length === 3 ) {

			// We have a triangle, pick a side and expand on it
			var a = simplex[ 2 ],
				b = simplex[ 1 ],
				c = simplex[ 0 ],
				ao = _vec3_1, // local-variable `direction` is also mapped to _vec3_1, but is not used again until after we ae finished with `ao`
				ab = _vec3_2,
				ac = _vec3_3;

			vec3.negate( a.point, ao );
			vec3.subtract( b.point, a.point, ab );
			vec3.subtract( c.point, a.point, ac );

			// Determine the triangle's normal
			vec3.cross( ab, ac, direction );
			epa_support_point = Goblin.ObjectPool.getObject( 'GJKSupportPoint' );
			Goblin.GjkEpa.findSupportPoint( object_a, object_b, direction, epa_support_point );

			simplex.push( epa_support_point );
		}

		// We have an EPA-compatible 3-simplex,
		// first convert it into face data and then perform EPA
		// @TODO GjkFace should be included in ObjectPool for recycling
		var faces = [];
		faces.push(
			new Goblin.GjkEpa.GjkFace( simplex[0], simplex[2], simplex[3], vec3.create(), 0 ),
			new Goblin.GjkEpa.GjkFace( simplex[0], simplex[1], simplex[2], vec3.create(), 1 ),
			new Goblin.GjkEpa.GjkFace( simplex[0], simplex[3], simplex[1], vec3.create(), 2 ),
			new Goblin.GjkEpa.GjkFace( simplex[3], simplex[2], simplex[1], vec3.create(), 3 )
		);

		vec3.subtract( faces[0].b.point, faces[0].a.point, _vec3_1 );
		vec3.subtract( faces[0].c.point, faces[0].a.point, _vec3_2 );
		vec3.cross( _vec3_1, _vec3_2, faces[0].normal );
		vec3.normalize( faces[0].normal );

		vec3.subtract( faces[1].b.point, faces[1].a.point, _vec3_1 );
		vec3.subtract( faces[1].c.point, faces[1].a.point, _vec3_2 );
		vec3.cross( _vec3_1, _vec3_2, faces[1].normal );
		vec3.normalize( faces[1].normal );

		vec3.subtract( faces[2].b.point, faces[2].a.point, _vec3_1 );
		vec3.subtract( faces[2].c.point, faces[2].a.point, _vec3_2 );
		vec3.cross( _vec3_1, _vec3_2, faces[2].normal );
		vec3.normalize( faces[2].normal );

		vec3.subtract( faces[3].b.point, faces[3].a.point, _vec3_1 );
		vec3.subtract( faces[3].c.point, faces[3].a.point, _vec3_2 );
		vec3.cross( _vec3_1, _vec3_2, faces[3].normal );
		vec3.normalize( faces[3].normal );

		/*// Simplex mesh
		var vertices = [
			new THREE.Vector3( simplex[0].point[0], simplex[0].point[1], simplex[0].point[2] ),
			new THREE.Vector3( simplex[1].point[0], simplex[1].point[1], simplex[1].point[2] ),
			new THREE.Vector3( simplex[2].point[0], simplex[2].point[1], simplex[2].point[2] ),
			new THREE.Vector3( simplex[3].point[0], simplex[3].point[1], simplex[3].point[2] )
		];
		var mesh = new THREE.Mesh(
			new THREE.ConvexGeometry( vertices ),
			new THREE.MeshNormalMaterial({ opacity: 0.5 })
		);
		scene.add( mesh );*/

		/*// Simplex normals
		var test = faces[0];
		var line_geometry = new THREE.Geometry();
		line_geometry.vertices = [
			new THREE.Vector3( test.a.point[0], test.a.point[1], test.a.point[2] ),
			new THREE.Vector3( test.b.point[0], test.b.point[1], test.b.point[2] ),
			new THREE.Vector3( test.c.point[0], test.c.point[1], test.c.point[2] ),
			new THREE.Vector3( test.a.point[0], test.a.point[1], test.a.point[2] )
		];
		var line = new THREE.Line(
			line_geometry,
			new THREE.LineBasicMaterial({ color: 0x000000 })
		);
		scene.add( line );

		var line_geometry = new THREE.Geometry();
		line_geometry.vertices = [
			new THREE.Vector3(),
			new THREE.Vector3( test.normal[0], test.normal[1], test.normal[2] )
		];
		var line = new THREE.Line(
			line_geometry,
			new THREE.LineBasicMaterial({ color: 0x000000 })
		);
		scene.add( line );*/

		var last_distance = Infinity, last_face = null,
			i, j, face, distance, closest_face, closest_distance,
			origin = vec3.create(),
			closest_point = vec3.create(),
			best_closest_point = vec3.create(),
			epa_iterations = 0;

		while ( true ) {
			epa_iterations++;

			// Find the point on the closest face
			closest_distance = Infinity;
			i = faces.length - 1;
			while( i >= 0 ) {
				face = faces[i];
				if ( face === null ) {
					i--;
					continue;
				}
				Goblin.GeometryMethods.findClosestPointInTriangle( origin, face.a.point, face.b.point, face.c.point, closest_point );
				distance = vec3.squaredLength( closest_point );
				if ( distance < closest_distance ) {
					vec3.set( closest_point, best_closest_point );
					closest_distance = distance;
					closest_face = i;
				}
				i--;
			}

			if (
				(
					last_distance - closest_distance < 0.0001 && // @TODO move `.0001` to EPA.EPSILON
						last_face === faces[closest_face]
					) ||
					epa_iterations === 20
				) {
				/*// Simplex mesh
				var geometry = new THREE.Geometry, z;
				for ( z = 0; z < faces.length; z++ ) {
					if ( faces[z] !== null ) {
						geometry.vertices.push( new THREE.Vector3( faces[z].a.point[0], faces[z].a.point[1], faces[z].a.point[2] ) );
						geometry.vertices.push( new THREE.Vector3( faces[z].b.point[0], faces[z].b.point[1], faces[z].b.point[2] ) );
						geometry.vertices.push( new THREE.Vector3( faces[z].c.point[0], faces[z].c.point[1], faces[z].c.point[2] ) );
						geometry.faces.push( new THREE.Face3( geometry.vertices.length - 3, geometry.vertices.length - 2, geometry.vertices.length - 1 ) );
					}
				}
				geometry.computeFaceNormals();
				var mesh = new THREE.Mesh(
					geometry,
					new THREE.MeshNormalMaterial({ opacity: 0.5 })
				);
				scene.add( mesh );

				var line_geometry = new THREE.Geometry();
				line_geometry.vertices = [
					new THREE.Vector3( faces[closest_face].a.point[0], faces[closest_face].a.point[1], faces[closest_face].a.point[2] ),
					new THREE.Vector3( faces[closest_face].b.point[0], faces[closest_face].b.point[1], faces[closest_face].b.point[2] ),
					new THREE.Vector3( faces[closest_face].c.point[0], faces[closest_face].c.point[1], faces[closest_face].c.point[2] ),
					new THREE.Vector3( faces[closest_face].a.point[0], faces[closest_face].a.point[1], faces[closest_face].a.point[2] )
				];
				var line = new THREE.Line(
					line_geometry,
					new THREE.LineBasicMaterial({ color: 0x000000 })
				);
				scene.add( line );

				Goblin.GeometryMethods.findClosestPointInTriangle( origin, faces[closest_face].a.point, faces[closest_face].b.point, faces[closest_face].c.point, closest_point );
				var mesh = new THREE.Mesh(
					new THREE.SphereGeometry( 0.05 ),
					new THREE.MeshNormalMaterial()
				);
				mesh.position.set(
					closest_point[0], closest_point[1], closest_point[2]
				);
				scene.add( mesh );*/

				// Get a ContactDetails object and fill out its details
				var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
				contact['object_a'] = object_a;
				contact['object_b'] = object_b;

				// Contact normal is that of the closest face, pointing away from origin
				vec3.set( faces[closest_face].normal, contact['contact_normal'] );

				// Calculate contact position
				// @TODO this... just... ugh. Refactor.
				var barycentric = vec3.create();
				Goblin.GeometryMethods.findBarycentricCoordinates( best_closest_point, faces[closest_face].a.point, faces[closest_face].b.point, faces[closest_face].c.point, barycentric );

				if ( isNaN( barycentric[0] ) ) {
					return false;
				}

				var confirm = {
					a: vec3.create(),
					b: vec3.create(),
					c: vec3.create()
				};

				// Contact coordinates of object a
				vec3.scale( faces[closest_face].a.witness_a, barycentric[0], confirm.a );
				vec3.scale( faces[closest_face].b.witness_a, barycentric[1], confirm.b );
				vec3.scale( faces[closest_face].c.witness_a, barycentric[2], confirm.c );
				vec3.add( confirm.a, confirm.b, contact['contact_point_in_a'] );
				vec3.add( contact['contact_point_in_a'], confirm.c );

				// Contact coordinates of object b
				vec3.scale( faces[closest_face].a.witness_b, barycentric[0], confirm.a );
				vec3.scale( faces[closest_face].b.witness_b, barycentric[1], confirm.b );
				vec3.scale( faces[closest_face].c.witness_b, barycentric[2], confirm.c );
				vec3.add( confirm.a, confirm.b, contact['contact_point_in_b'] );
				vec3.add( contact['contact_point_in_b'], confirm.c );

				// Find actual contact point
				vec3.add( contact['contact_point_in_a'], contact['contact_point_in_b'], contact['contact_point'] );
				vec3.scale( contact['contact_point'], 0.5 );

				// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
				mat4.multiplyVec3( contact['object_a']['transform_inverse'], contact['contact_point_in_a'] );
				mat4.multiplyVec3( contact['object_b']['transform_inverse'], contact['contact_point_in_b'] );

				// Calculate penetration depth
				contact['penetration_depth'] = Math.sqrt( closest_distance );

				contact['restitution'] = ( object_a['restitution'] + object_b['restitution'] ) / 2;
				contact['friction'] = ( contact['object_a']['friction'] + contact['object_b']['friction'] ) / 2;

				return contact;
			}

			// Find the new support point
			epa_support_point = Goblin.ObjectPool.getObject( 'GJKSupportPoint' );
			Goblin.GjkEpa.findSupportPoint( object_a, object_b, faces[closest_face].normal, epa_support_point );

			// Compute the silhouette cast by the new vertex
			// Note that the new vertex is on the positive side
			// of the current triangle, so the current triangle will
			// not be in the convex hull. Start local search
			// from this triangle.
			var new_permament_point = epa_support_point;

			// Find all faces visible to the new vertex
			var visible_faces = [];
			for ( i = 0; i < faces.length; i++ ) {
				if ( faces[i] === null ) {
					continue;
				}

				if ( faces[i].classifyVertex( new_permament_point.point ) >= Goblin.EPSILON ) {
					visible_faces.push( faces[i] );
				}
			}
			// @TODO if there are no visible faces, is this an easy out?

			// Find all vertices shared by the visible faces
			var shared_vertices = [];
			for ( i = 0; i < visible_faces.length; i++ ) {
				for ( j = 0; j < visible_faces.length; j++ ) {
					if ( i <= j ) {
						// if i < j then we have already performed this check
						// if i === j then the two objects are the same and can't be in contact
						continue;
					}
					Array.prototype.push.apply( shared_vertices, checkForSharedVertices( visible_faces[i], visible_faces[j] ) );
				}
			}

			// Remove the visible faces and replace them
			for ( i = 0; i < visible_faces.length; i++ ) {
				face = visible_faces[i];

				var potential_faces = [];

				if ( shared_vertices.indexOf( face.a ) === -1 || shared_vertices.indexOf( face.b ) === -1 ) {
					potential_faces.push( new Goblin.GjkEpa.GjkFace( face.a, face.b, new_permament_point, vec3.create(), -1 ) );
				}

				if ( shared_vertices.indexOf( face.b ) === -1 || shared_vertices.indexOf( face.c ) === -1 ) {
					potential_faces.push( new Goblin.GjkEpa.GjkFace( face.c, new_permament_point, face.b, vec3.create(), -1 ) );
				}

				if ( shared_vertices.indexOf( face.a ) === -1 || shared_vertices.indexOf( face.c ) === -1 ) {
					potential_faces.push( new Goblin.GjkEpa.GjkFace( face.c, face.a, new_permament_point, vec3.create(), -1 ) );
				}

				if ( potential_faces.length !== 0 ) {
					faces[face.index] = null;

					Array.prototype.push.apply( faces, potential_faces );

					// Compute the new faces' normals
					for ( j = faces.length - potential_faces.length; j < faces.length; j++ ) {
						vec3.subtract( faces[j].b.point, faces[j].a.point, _vec3_1 );
						vec3.subtract( faces[j].c.point, faces[j].a.point, _vec3_2 );
						vec3.cross( _vec3_1, _vec3_2, faces[j].normal );
						vec3.normalize( faces[j].normal );
						faces[j].index = j;
					}
				}
			}

			last_distance = closest_distance;
			last_face = faces[closest_face];
		}

	}
};

/**
 * Used as a face on a GJK simplex or EPA polytope
 *
 * @class GjkFace
 * @param a {vec3} First face vertex
 * @param b {vec3} Second face vertex
 * @param c {vec3} Third face vertex
 * @param normal {vec3} Face normal
 * @param index {vec3} This face's index in the simplex
 * @constructor
 */
Goblin.GjkEpa.GjkFace = function( a, b, c, normal, index ) {
	// @TODO `normal` should be autocalculated from `a`, `b`, and `c`
	this.a = a;
	this.b = b;
	this.c = c;
	this.normal = normal;
	this.index = index;
};
/**
 * Determines if a vertex is in front of or behind the face
 *
 * @method classifyVertex
 * @param vertex {vec3} Vertex to classify
 * @return {Number} If greater than 0 (or epsilon) then `vertex' is in front of the face
 */
Goblin.GjkEpa.GjkFace.prototype.classifyVertex = function( vertex ) {
	var w = vec3.dot( this.normal, this.a.point ),
		x = vec3.dot( this.normal, vertex ) - w;
	return x;
};

// mappings for closure compiler
Goblin['GjkEpa'] = Goblin.GjkEpa;
Goblin.GjkEpa['SupportPoint'] = Goblin.GjkEpa.SupportPoint;
Goblin.GjkEpa['GjkFace'] = Goblin.GjkEpa.GjkFace;
Goblin.GjkEpa['findSupportPoint'] = Goblin.GjkEpa.findSupportPoint;
Goblin.GjkEpa['GJK'] = Goblin.GjkEpa.GJK;
Goblin.GjkEpa['EPA'] = Goblin.GjkEpa.EPA;