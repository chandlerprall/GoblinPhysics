/**
 * Extensions to gl-matrix quat4
 */
(function() {
	var _quat = quat4.create(),
		_vec = vec3.create();

	/**
	 * @method rotateByVector
	 * @param quat {quat4} quat4 to rotate
	 * @param vec {vec3} vec3 to rotate quat4 by
	 * @param [dest] {quat4} quat4 receiving the rotated values. If not specified result is written to quat.
	 */
	quat4.rotateByVector = function( quat, vec, dest ) {
		if (!dest) { dest = quat; }

		_quat[0] = vec[0];
		_quat[1] = vec[1];
		_quat[2] = vec[2];
		_quat[3] = 0;

		quat4.multiply( _quat, quat );

		return dest;
	};

	/**
	 * @method addScaledVector
	 * @param quat {quat4} quat4 to add rotation to
	 * @param vec {vec3} vec3 to rotate quat4 by
	 * @param scale {Number} amount to scale `vec` by
	 * @param [dest] {quat4} quat4 receiving the rotated values. If not specified result is written to quat.
	 */
	quat4.addScaledVector = function( quat, vec, scale, dest ) {
		if (!dest) { dest = quat; }

		var c1 = Math.cos( vec[0] * scale / 2 ),
			c2 = Math.cos( vec[1] * scale / 2 ),
			c3 = Math.cos( vec[2] * scale / 2 ),
			s1 = Math.sin( vec[0] * scale / 2 ),
			s2 = Math.sin( vec[1] * scale / 2 ),
			s3 = Math.sin( vec[2] * scale / 2 );

		_quat[0] = s1 * c2 * c3 + c1 * s2 * s3;
		_quat[1] = c1 * s2 * c3 - s1 * c2 * s3;
		_quat[2] = c1 * c2 * s3 + s1 * s2 * c3;
		_quat[3] = c1 * c2 * c3 - s1 * s2 * s3;

		quat4.multiply( quat, _quat );

		/*vec3.scale( vec, scale, _vec );
		vec3.scale( _vec, 0.5 );

		var thetaMagSq = vec3.squaredLength( _vec ),
			thetaMag,
			s;

		if ( thetaMagSq * thetaMagSq / 24 < Goblin.EPSILON ) {
			_quat[3] = 1 - thetaMagSq / 2;
			s = 1 - thetaMagSq / 6;
		} else {
			thetaMag = Math.sqrt( thetaMagSq );
			_quat[3] = Math.cos( thetaMag );
			s = Math.sin( thetaMag ) / thetaMag;
		}

		_quat[0] = _vec[0] * s;
		_quat[1] = _vec[1] * s;
		_quat[2] = _vec[2] * s;

		quat4.multiply( _quat, quat, dest );*/

		return dest;
	}
})();

/**
* Goblin physics module
*
* @module Goblin
*/
window.Goblin = (function() {
	'use strict';

	var Goblin = {},
		_tmp_vec3_1 = vec3.create(),
		_tmp_vec3_2 = vec3.create(),
		_tmp_vec3_3 = vec3.create(),

		_tmp_quat4_1 = quat4.create(),

		_tmp_mat3_1 = mat3.create(),
		_tmp_mat3_2 = mat3.create(),

		_tmp_mat4_1 = mat4.create();

    Goblin.EPSILON = 0.000001;
/**
 * @class AABB
 * @param [min] {vec3}
 * @param [max] {vec3}
 * @constructor
 */
Goblin.AABB = function( min, max ) {
	/**
	 * @property min
	 * @type {vec3}
	 */
	this.min = min || vec3.create();

	/**
	 * @property max
	 * @type {vec3}
	 */
	this.max = max || vec3.create();
};

Goblin.AABB.prototype.transform = (function(){
	var local_half_extents = vec3.create(),
		local_center = vec3.create(),
		center = vec3.create(),
		extents = vec3.create(),
		abs = mat3.create();

	return function( local_aabb, matrix ) {
		vec3.subtract( local_aabb.max, local_aabb.min, local_half_extents );
		vec3.scale( local_half_extents, 0.5 );

		vec3.add( local_aabb.max, local_aabb.min, local_center );
		vec3.scale( local_center, 0.5 );

		mat4.multiplyVec3( matrix, local_center, center );

		// Extract the absolute rotation matrix
		abs[0] = Math.abs( matrix[0] );
		abs[1] = Math.abs( matrix[1] );
		abs[2] = Math.abs( matrix[2] );
		abs[3] = Math.abs( matrix[4] );
		abs[4] = Math.abs( matrix[5] );
		abs[5] = Math.abs( matrix[6] );
		abs[6] = Math.abs( matrix[8] );
		abs[7] = Math.abs( matrix[9] );
		abs[8] = Math.abs( matrix[10] );

		_tmp_vec3_1[0] = abs[0];
		_tmp_vec3_1[1] = abs[1];
		_tmp_vec3_1[2] = abs[2];
		extents[0] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		_tmp_vec3_1[0] = abs[3];
		_tmp_vec3_1[1] = abs[4];
		_tmp_vec3_1[2] = abs[5];
		extents[1] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		_tmp_vec3_1[0] = abs[6];
		_tmp_vec3_1[1] = abs[7];
		_tmp_vec3_1[2] = abs[8];
		extents[2] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		vec3.subtract( center, extents, this.min );
		vec3.add( center, extents, this.max );
	};
})();

Goblin.AABB.prototype.intersects = function( aabb ) {
    if (
        this.max[0] < aabb.min[0] ||
        this.max[1] < aabb.min[1] ||
        this.max[2] < aabb.min[2] ||
        this.min[0] > aabb.max[0] ||
        this.min[1] > aabb.max[1] ||
        this.min[2] > aabb.max[2]
    )
    {
        return false;
    }

    return true;
};

/**
 * Checks if a ray segment intersects with this AABB
 *
 * @method testRayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {boolean}
 */
Goblin.AABB.prototype.testRayIntersect = (function(){
	var direction = vec3.create(),
		tmin, tmax,
		ood, t1, t2;

	return function( start, end ) {
		tmin = 0;

		vec3.subtract( end, start, direction );
		tmax = vec3.length( direction );
		vec3.scale( direction, 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			var extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );

			if ( Math.abs( direction[i] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[i] < -extent || start[i] > extent ) {
					return false;
				}
			} else {
				ood = 1 / direction[i];
				t1 = ( -extent - start[i] ) * ood;
				t2 = ( extent - start[i] ) * ood;
				if ( t1 > t2 ) {
					ood = t1; // ood is a convenient temp variable as it's not used again
					t1 = t2;
					t2 = ood;
				}

				// Find intersection intervals
				tmin = Math.max( tmin, t1 );
				tmax = Math.min( tmax, t2 );

				if ( tmin > tmax ) {
					return false;
				}
			}
		}

		return true;
	};
})();
/**
 * Performs a n^2 check of all collision objects to see if any could be in contact
 *
 * @class BasicBroadphase
 * @constructor
 */
Goblin.BasicBroadphase = function() {
	/**
	 * Holds all of the collision objects that the broadphase is responsible for
	 *
	 * @property bodies
	 * @type {Array}
	 */
	this.bodies = [];

	/**
	 * Array of all (current) collision pairs between the broadphase's bodies
	 *
	 * @property collision_pairs
	 * @type {Array}
	 */
	this.collision_pairs = [];
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {MassPoint|RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.addBody = function( body ) {
	this.bodies.push( body );
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {MassPoint|RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.removeBody = function( body ) {
	var i,
		body_count = this.bodies.length;

	for ( i = 0; i < body_count; i++ ) {
		if ( this.bodies[i] === body ) {
			this.bodies.splice( i, 1 );
			break;
		}
	}
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method predictContactPairs
 */
Goblin.BasicBroadphase.prototype.predictContactPairs = function() {
	var i, j,
		object_a, object_b,
		bodies_count = this.bodies.length;

	// Clear any old contact pairs
	this.collision_pairs.length = 0;

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_a = this.bodies[i];

		for ( j = 0; j < bodies_count; j++ ) {
			if ( i <= j ) {
				// if i < j then we have already performed this check
				// if i === j then the two objects are the same and can't be in contact
				continue;
			}

			object_b = this.bodies[j];

			if ( object_a.mass === Infinity && object_b.mass === Infinity ) {
				// Two static objects aren't considered to be in contact
				continue;
			}

            if ( object_a.aabb.intersects( object_b.aabb ) )
            {
				this.collision_pairs.push([ object_a, object_b ]);
			}
		}
	}
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {Array<RayIntersection>} an unsorted array of intersections
 */
Goblin.BasicBroadphase.prototype.rayIntersect = function( start, end ) {
	var bodies_count = this.bodies.length,
		i, body,
		intersections = [];

	for ( i = 0; i < bodies_count; i++ ) {
		body = this.bodies[i];
		if ( body.aabb.testRayIntersect( start, end ) ) {
			body.rayIntersect( start, end, intersections );
		}
	}

	return intersections;
};
Goblin.BoxSphere = function( object_a, object_b ) {
	var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
		box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a,
		contact, distance;

	// Transform the center of the sphere into box coordinates
	mat4.multiplyVec3( box.transform_inverse, sphere.position, _tmp_vec3_1 );

	// Early out check to see if we can exclude the contact
	if ( Math.abs( _tmp_vec3_1[0] ) - sphere.shape.radius > box.shape.half_width ||
		Math.abs( _tmp_vec3_1[1] ) - sphere.shape.radius > box.shape.half_height ||
		Math.abs( _tmp_vec3_1[2] ) - sphere.shape.radius > box.shape.half_depth )
	{
		return;
	}

	// `_tmp_vec3_1` is the center of the sphere in relation to the box
	// `_tmp_vec3_2` will hold the point on the box closest to the sphere
	_tmp_vec3_2[0] = _tmp_vec3_2[1] = _tmp_vec3_2[2] = 0;

	// Clamp each coordinate to the box.
	distance = _tmp_vec3_1[0];
	if ( distance > box.shape.half_width ) {
		distance = box.shape.half_width;
	} else if (distance < -box.shape.half_width ) {
		distance = -box.shape.half_width;
	}
	_tmp_vec3_2[0] = distance;

	distance = _tmp_vec3_1[1];
	if ( distance > box.shape.half_height ) {
		distance = box.shape.half_height;
	} else if (distance < -box.shape.half_height ) {
		distance = -box.shape.half_height;
	}
	_tmp_vec3_2[1] = distance;

	distance = _tmp_vec3_1[2];
	if ( distance > box.shape.half_depth ) {
		distance = box.shape.half_depth;
	} else if (distance < -box.shape.half_depth ) {
		distance = -box.shape.half_depth;
	}
	_tmp_vec3_2[2] = distance;

	// Check we're in contact
	vec3.subtract( _tmp_vec3_2, _tmp_vec3_1, _tmp_vec3_3 );
	distance = vec3.squaredLength( _tmp_vec3_3 );
	if ( distance > sphere.shape.radius * sphere.shape.radius ) {
		return;
	}

	// Get a ContactDetails object populate it
	contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = sphere;
	contact.object_b = box;

	if ( distance === 0 ) {

		// The center of the sphere is contained within the box
		Goblin.BoxSphere.spherePenetration( box.shape, _tmp_vec3_1, _tmp_vec3_2, contact );

	} else {

		// Center of the sphere is outside of the box

		// Find contact normal and penetration depth
		vec3.subtract( _tmp_vec3_2, _tmp_vec3_1, contact.contact_normal );
		contact.penetration_depth = -vec3.length( contact.contact_normal );
		vec3.scale( contact.contact_normal, -1 / contact.penetration_depth );

		// Set contact point of `object_b` (the box)
		vec3.set( _tmp_vec3_2, contact.contact_point_in_b );

	}

	// Update penetration depth to include sphere's radius
	contact.penetration_depth += sphere.shape.radius;

	// Convert contact normal to world coordinates
	mat4.toRotationMat( box.transform, _tmp_mat4_1 );
	mat4.multiplyVec3( _tmp_mat4_1, contact.contact_normal );

	// Contact point in `object_a` (the sphere) is the normal * radius converted to the sphere's frame
	mat4.toRotationMat( sphere.transform_inverse, _tmp_mat4_1 );
	mat4.multiplyVec3( _tmp_mat4_1, contact.contact_normal, contact.contact_point_in_a );
	vec3.scale( contact.contact_point_in_a, sphere.shape.radius );

	// Find contact position
	vec3.scale( contact.contact_normal, sphere.shape.radius - contact.penetration_depth / 2, contact.contact_point );
	vec3.add( contact.contact_point, sphere.position );

	contact.restitution = ( sphere.restitution + box.restitution ) / 2;
	contact.friction = ( sphere.friction + box.friction ) / 2;

	return contact;
};

Goblin.BoxSphere.spherePenetration = function( box, sphere_center, box_point, contact ) {
	var min_distance, face_distance;

	if ( sphere_center[0] < 0 ) {
		min_distance = box.half_width + sphere_center[0];
		box_point[0] = -box.half_width;
		box_point[1] = box_point[2] = 0;
		contact.penetration_depth = min_distance;
	} else {
		min_distance = box.half_width - sphere_center[0];
		box_point[0] = box.half_width;
		box_point[1] = box_point[2] = 0;
		contact.penetration_depth = min_distance;
	}

	if ( sphere_center[1] < 0 ) {
		face_distance = box.half_height + sphere_center[1];
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point[1] = -box.half_height;
			box_point[0] = box_point[2] = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_height - sphere_center[1];
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point[1] = box.half_height;
			box_point[0] = box_point[2] = 0;
			contact.penetration_depth = min_distance;
		}
	}

	if ( sphere_center[2] < 0 ) {
		face_distance = box.half_depth + sphere_center[2];
		if ( face_distance < min_distance ) {
			box_point[2] = -box.half_depth;
			box_point[0] = box_point[1] = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_depth - sphere_center[2];
		if ( face_distance < min_distance ) {
			box_point[2] = box.half_depth;
			box_point[0] = box_point[1] = 0;
			contact.penetration_depth = min_distance;
		}
	}

	// Set contact point of `object_b` (the box)
	vec3.set( _tmp_vec3_2, contact.contact_point_in_b );
	vec3.scale( contact.contact_point_in_b, -1, contact.contact_normal );
	vec3.normalize( contact.contact_normal );
};
/**
 * Provides the classes and algorithms for running GJK+EPA based collision detection
 *
 * @class GjkEpa
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
			vec3.subtract( object_b.position, object_a.position, direction );
			vec3.normalize( direction );

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
				contact.object_a = object_a;
				contact.object_b = object_b;

				// Contact normal is that of the closest face, pointing away from origin
				vec3.set( faces[closest_face].normal, contact.contact_normal );

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
				vec3.add( confirm.a, confirm.b, contact.contact_point_in_a );
				vec3.add( contact.contact_point_in_a, confirm.c );

				// Contact coordinates of object b
				vec3.scale( faces[closest_face].a.witness_b, barycentric[0], confirm.a );
				vec3.scale( faces[closest_face].b.witness_b, barycentric[1], confirm.b );
				vec3.scale( faces[closest_face].c.witness_b, barycentric[2], confirm.c );
				vec3.add( confirm.a, confirm.b, contact.contact_point_in_b );
				vec3.add( contact.contact_point_in_b, confirm.c );

				// Find actual contact point
				vec3.add( contact.contact_point_in_a, contact.contact_point_in_b, contact.contact_point );
				vec3.scale( contact.contact_point, 0.5 );

				// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
				mat4.multiplyVec3( contact.object_a.transform_inverse, contact.contact_point_in_a );
				mat4.multiplyVec3( contact.object_b.transform_inverse, contact.contact_point_in_b );

				// Calculate penetration depth
				contact.penetration_depth = Math.sqrt( closest_distance );

				contact.restitution = ( object_a.restitution + object_b.restitution ) / 2;
				contact.friction = ( contact.object_a.friction + contact.object_b.friction ) / 2;

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
/**
 * Provides the classes and algorithms for running GJK+EPA based collision detection
 *
 * @class GjkEpa2
 * @static
 */
Goblin.GjkEpa2 = {
    max_iterations: 20,
    epa_condition: 0.001,

    /**
     * Holds a point on the edge of a Minkowski difference along with that point's witnesses and the direction used to find the point
     *
     * @class SupportPoint
     * @param witness_a {vec3} Point in first object used to find the supporting point
     * @param witness_b {vec3} Point in the second object ued to find th supporting point
     * @param point {vec3} The support point on the edge of the Minkowski difference
     * @constructor
     */
    SupportPoint: function( witness_a, witness_b, point ) {
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
    findSupportPoint: (function(){
        var temp = vec3.create();
        return function( object_a, object_b, direction, support_point ) {
            // Find witnesses from the objects
            object_a.findSupportPoint( direction, support_point.witness_a );
            vec3.negate( direction, temp );
            object_b.findSupportPoint( temp, support_point.witness_b );

            // Find the CSO support point
            vec3.subtract( support_point.witness_a, support_point.witness_b, support_point.point );
        };
    })(),

    /**
     * Perform GJK algorithm against two objects. Returns a ContactDetails object if there is a collision, else null
     *
     * @method GJK
     * @param object_a {Goblin.RigidBody}
     * @param object_b {Goblin.RigidBody}
     * @return {Goblin.ContactDetails|Boolean} Returns `null` if no collision, else a `ContactDetails` object
     */
	GJK: (function(){
        return function( object_a, object_b ) {
            var simplex = new Goblin.GjkEpa2.Simplex( object_a, object_b ),
                last_point;

            while ( ( last_point = simplex.addPoint() ) ){}

            // If last_point is false then there is no collision
            if ( last_point === false ) {
                return null;
            }

            return simplex;
        };
    })(),

    /**
     * Performs the Expanding Polytope Algorithm a GJK simplex
     *
     * @method EPA
     * @param simplex {Goblin.GjkEpa2.Simplex} Simplex generated by the GJK algorithm
     * @return {Goblin.ContactDetails}
     */
    EPA: (function(){
		return function( simplex ) {
            // Time to convert the simplex to real faces
            // @TODO this should be a priority queue where the position in the queue is ordered by distance from face to origin
			var polyhedron = new Goblin.GjkEpa2.Polyhedron( simplex );

			var i = 0,
                edges;

            // Expand the polyhedron until it doesn't expand any more
			while ( ++i ) {
				polyhedron.findFaceClosestToOrigin();

				// Find a new support point in the direction of the closest point
				if ( polyhedron.closest_face_distance < Goblin.EPSILON ) {
					vec3.set( polyhedron.faces[polyhedron.closest_face].normal, _tmp_vec3_1 );
				} else {
					vec3.set( polyhedron.closest_point, _tmp_vec3_1 );
				}

				var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
				Goblin.GjkEpa2.findSupportPoint( simplex.object_a, simplex.object_b, _tmp_vec3_1, support_point );

				// Check for terminating condition
                vec3.subtract( support_point.point, polyhedron.closest_point, _tmp_vec3_1 );
                var gap = vec3.squaredLength( _tmp_vec3_1 );

				if ( i === Goblin.GjkEpa2.max_iterations || ( gap < Goblin.GjkEpa2.epa_condition && polyhedron.closest_face_distance > Goblin.EPSILON ) ) {
					//renderPolyhedron( polyhedron, edges );

					// Get a ContactDetails object and fill out its details
					var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
					contact.object_a = simplex.object_a;
					contact.object_b = simplex.object_b;

					vec3.normalize( polyhedron.closest_point, contact.contact_normal );
					if ( vec3.squaredLength( contact.contact_normal ) === 0 ) {
						vec3.subtract( contact.object_b.position, contact.object_a.position, contact.contact_normal );
					}
					vec3.normalize( contact.contact_normal );

					var barycentric = vec3.create();
					Goblin.GeometryMethods.findBarycentricCoordinates( polyhedron.closest_point, polyhedron.faces[polyhedron.closest_face].a.point, polyhedron.faces[polyhedron.closest_face].b.point, polyhedron.faces[polyhedron.closest_face].c.point, barycentric );

					if ( isNaN( barycentric[0] ) ) {
                        // @TODO: Avoid this degenerate case
						//console.log( 'Point not in triangle' );
						return null;
					}

					var confirm = {
						a: vec3.create(),
						b: vec3.create(),
						c: vec3.create()
					};

					// Contact coordinates of object a
					vec3.scale( polyhedron.faces[polyhedron.closest_face].a.witness_a, barycentric[0], confirm.a );
					vec3.scale( polyhedron.faces[polyhedron.closest_face].b.witness_a, barycentric[1], confirm.b );
					vec3.scale( polyhedron.faces[polyhedron.closest_face].c.witness_a, barycentric[2], confirm.c );
					vec3.add( confirm.a, confirm.b, contact.contact_point_in_a );
					vec3.add( contact.contact_point_in_a, confirm.c );

					// Contact coordinates of object b
					vec3.scale( polyhedron.faces[polyhedron.closest_face].a.witness_b, barycentric[0], confirm.a );
					vec3.scale( polyhedron.faces[polyhedron.closest_face].b.witness_b, barycentric[1], confirm.b );
					vec3.scale( polyhedron.faces[polyhedron.closest_face].c.witness_b, barycentric[2], confirm.c );
					vec3.add( confirm.a, confirm.b, contact.contact_point_in_b );
					vec3.add( contact.contact_point_in_b, confirm.c );

					// Find actual contact point
					vec3.add( contact.contact_point_in_a, contact.contact_point_in_b, contact.contact_point );
					vec3.scale( contact.contact_point, 0.5 );

					// Set objects' local points
					mat4.multiplyVec3( contact.object_a.transform_inverse, contact.contact_point_in_a );
					mat4.multiplyVec3( contact.object_b.transform_inverse, contact.contact_point_in_b );

					// Set objects' local points
					//mat4.multiplyVec3( contact.object_a.transform_inverse, support_point.witness_a, contact.contact_point_in_a );
					//mat4.multiplyVec3( contact.object_b.transform_inverse, support_point.witness_b, contact.contact_point_in_b );

					// Calculate penetration depth
					contact.penetration_depth = vec3.length( polyhedron.closest_point );

					contact.restitution = ( simplex.object_a.restitution + simplex.object_b.restitution ) / 2;
					contact.friction = ( simplex.object_a.friction + simplex.object_b.friction ) / 2;

					return contact;
				}

                edges = polyhedron.addVertex( support_point );

				/*if ( i === 19 ) {
					renderPolyhedron( polyhedron, edges );
					var sp = new THREE.Mesh(
						new THREE.SphereGeometry( 0.1 ),
						new THREE.MeshBasicMaterial({ color: 0x0000FF })
					);
					sp.position.set( support_point.point[0], support_point.point[1], support_point.point[2] );
					testUtils.scene.add( sp );
					return null;
				}*/
			}

            return null;
        };
    })(),

    Face: function( polyhedron, a, b, c ) {
		this.active = true;
		this.polyhedron = polyhedron;
        this.a = a;
        this.b = b;
        this.c = c;
        this.normal = vec3.create();
		this.neighbors = [];

        vec3.subtract( b.point, a.point, _tmp_vec3_1 );
        vec3.subtract( c.point, a.point, _tmp_vec3_2 );
        vec3.cross( _tmp_vec3_1, _tmp_vec3_2, this.normal );
        vec3.normalize( this.normal );
    }
};

Goblin.GjkEpa2.Polyhedron = function( simplex ) {
	this.closest_face = null;
	this.closest_face_distance = null;
	this.closest_point = vec3.create();

	this.faces = [
		new Goblin.GjkEpa2.Face( this, simplex.points[0], simplex.points[2], simplex.points[3] ), // ACD
		new Goblin.GjkEpa2.Face( this, simplex.points[0], simplex.points[1], simplex.points[2] ), // ABC
		new Goblin.GjkEpa2.Face( this, simplex.points[0], simplex.points[3], simplex.points[1] ), // ADB
		new Goblin.GjkEpa2.Face( this, simplex.points[3], simplex.points[2], simplex.points[1] ) // DCB
	];

	this.faces[0].neighbors.push( this.faces[1], this.faces[3], this.faces[2] );
	this.faces[1].neighbors.push( this.faces[2], this.faces[3], this.faces[0] );
	this.faces[2].neighbors.push( this.faces[0], this.faces[3], this.faces[1] );
	this.faces[3].neighbors.push( this.faces[0], this.faces[1], this.faces[2] );
};
Goblin.GjkEpa2.Polyhedron.prototype = {
    addVertex: function( vertex )
    {
        var edges = [], faces = [], i, j, a, b, last_b;
        this.faces[this.closest_face].silhouette( vertex, edges );

        // Re-order the edges if needed
        for ( i = 0; i < edges.length - 5; i += 5 ) {
            a = edges[i+3];
            b = edges[i+4];

            // Ensure this edge really should be the next one
            if ( i !== 0 && last_b !== a ) {
                // It shouldn't
                for ( j = i + 5; j < edges.length; j += 5 ) {
                    if ( edges[j+3] === last_b ) {
                        // Found it
                        var tmp = edges.slice( i, i + 5 );
                        edges[i] = edges[j];
                        edges[i+1] = edges[j+1];
                        edges[i+2] = edges[j+2];
                        edges[i+3] = edges[j+3];
                        edges[i+4] = edges[j+4];
                        edges[j] = tmp[0];
                        edges[j+1] = tmp[1];
                        edges[j+2] = tmp[2];
                        edges[j+3] = tmp[3];
                        edges[j+4] = tmp[4];

                        a = edges[i+3];
                        b = edges[i+4];
                        break;
                    }
                }
            }
            last_b = b;
        }

        for ( i = 0; i < edges.length; i += 5 ) {
            var neighbor = edges[i];
            a = edges[i+3];
            b = edges[i+4];

            var face = new Goblin.GjkEpa2.Face( this, b, vertex, a );
            face.neighbors[2] = edges[i];
            faces.push( face );

            neighbor.neighbors[neighbor.neighbors.indexOf( edges[i+2] )] = face;
        }

        for ( i = 0; i < faces.length; i++ ) {
            faces[i].neighbors[0] = faces[ i + 1 === faces.length ? 0 : i + 1 ];
            faces[i].neighbors[1] = faces[ i - 1 < 0 ? faces.length - 1 : i - 1 ];
        }

		Array.prototype.push.apply( this.faces, faces );

        return edges;
    },

	findFaceClosestToOrigin: (function(){
		var origin = vec3.create(),
			point = vec3.create();

		return function() {
			this.closest_face_distance = Infinity;

			var distance, i;

			for ( i = 0; i < this.faces.length; i++ ) {
				if ( this.faces[i].active === false ) {
					continue;
				}

				Goblin.GeometryMethods.findClosestPointInTriangle( origin, this.faces[i].a.point, this.faces[i].b.point, this.faces[i].c.point, point );
				distance = vec3.squaredLength( point );
				if ( distance < this.closest_face_distance ) {
					this.closest_face_distance = distance;
					this.closest_face = i;
					vec3.set( point, this.closest_point );
				}
			}
		};
	})()
};

Goblin.GjkEpa2.Face.prototype = {
	/**
	 * Determines if a vertex is in front of or behind the face
	 *
	 * @method classifyVertex
	 * @param vertex {vec3} Vertex to classify
	 * @return {Number} If greater than 0 then `vertex' is in front of the face
	 */
	classifyVertex: function( vertex ) {
		var w = vec3.dot( this.normal, this.a.point ),
			x = vec3.dot( this.normal, vertex.point ) - w;
		return x;
	},

	silhouette: function( point, edges, source ) {
        if ( this.active === false ) {
            return;
        }

        if ( this.classifyVertex( point ) > 0 ) {
			// This face is visible from `point`. Deactivate this face and alert the neighbors
			this.active = false;

			this.neighbors[0].silhouette( point, edges, this );
			this.neighbors[1].silhouette( point, edges, this );
            this.neighbors[2].silhouette( point, edges, this );
		} else if ( source ) {
			// This face is a neighbor to a now-silhouetted face, determine which neighbor and replace it
			var neighbor_idx = this.neighbors.indexOf( source ),
                a, b;
            if ( neighbor_idx === 0 ) {
                a = this.a;
                b = this.b;
            } else if ( neighbor_idx === 1 ) {
                a = this.b;
                b = this.c;
            } else {
                a = this.c;
                b = this.a;
            }
			edges.push( this, neighbor_idx, source, b, a );
		}
	}
};

(function(){
    var ao = vec3.create(),
        ab = vec3.create(),
        ac = vec3.create(),
        ad = vec3.create();

    Goblin.GjkEpa2.Simplex = function( object_a, object_b ) {
        this.object_a = object_a;
        this.object_b = object_b;
        this.points = [];
        this.iterations = 0;
        this.next_direction = vec3.create();
        this.updateDirection();
    };
    Goblin.GjkEpa2.Simplex.prototype = {
        addPoint: function() {
            if ( ++this.iterations === Goblin.GjkEpa2.max_iterations ) {
                return false;
            }

            var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
            Goblin.GjkEpa2.findSupportPoint( this.object_a, this.object_b, this.next_direction, support_point );
            this.points.push( support_point );

            if ( vec3.dot( this.points[this.points.length-1].point, this.next_direction ) < 0 ) {
                // if the last added point was not past the origin in the direction
                // then the Minkowski difference cannot contain the origin because
                // point added is past the edge of the Minkowski difference
                return false;
            }

            if ( this.updateDirection() === true ) {
                // Found a collision
                return null;
            }

            return support_point;
        },

        findDirectionFromLine: function() {
            vec3.negate( this.points[1].point, ao );
            vec3.subtract( this.points[0].point, this.points[1].point, ab );

            if ( vec3.dot( ab, ao ) < 0 ) {
                // Origin is on the opposite side of A from B
                vec3.set( ao, this.next_direction );
                this.points.length = 1; // Remove second point
            } else {
                // Origin lies between A and B, move on to a 2-simplex
                vec3.cross( ab, ao, this.next_direction );
                vec3.cross( this.next_direction, ab );

                // In the case that `ab` and `ao` are parallel vectors, direction becomes a 0-vector
                if (
                    this.next_direction[0] === 0 &&
                    this.next_direction[1] === 0 &&
                    this.next_direction[2] === 0
                ) {
                    vec3.normalize( ab );
                    this.next_direction[0] = 1 - Math.abs( ab[0] );
                    this.next_direction[1] = 1 - Math.abs( ab[1] );
                    this.next_direction[2] = 1 - Math.abs( ab[2] );
                }
            }
        },

        findDirectionFromTriangle: function() {
            // Triangle
            var a = this.points[2],
                b = this.points[1],
                c = this.points[0];

            vec3.negate( a.point, ao ); // ao
            vec3.subtract( b.point, a.point, ab ); // ab
            vec3.subtract( c.point, a.point, ac ); // ac

            // Determine the triangle's normal
            vec3.cross( ab, ac, _tmp_vec3_1 );

            // Edge cross products
            vec3.cross( ab, _tmp_vec3_1, _tmp_vec3_2 );
            vec3.cross( _tmp_vec3_1, ac, _tmp_vec3_3 );

            if ( vec3.dot( _tmp_vec3_3, ao ) >= 0 ) {
                // Origin lies on side of ac opposite the triangle
                if ( vec3.dot( ac, ao ) >= 0 ) {
                    // Origin outside of the ac line, so we form a new
                    // 1-simplex (line) with points A and C, leaving B behind
                    this.points.length = 0;
                    this.points.push( c, a );

                    // New search direction is from ac towards the origin
                    vec3.cross( ac, ao, this.next_direction );
                    vec3.cross( this.next_direction, ac );
                } else {
                    // *
                    if ( vec3.dot( ab, ao ) >= 0 ) {
                        // Origin outside of the ab line, so we form a new
                        // 1-simplex (line) with points A and B, leaving C behind
                        this.points.length = 0;
                        this.points.push( b, a );

                        // New search direction is from ac towards the origin
                        vec3.cross( ab, ao, this.next_direction );
                        vec3.cross( this.next_direction, ab );
                    } else {
                        // only A gives us a good reference point, start over with a 0-simplex
                        this.points.length = 0;
                        this.points.push( a );
                    }
                    // *
                }

            } else {

                // Origin lies on the triangle side of ac
                if ( vec3.dot( _tmp_vec3_2, ao ) >= 0 ) {
                    // Origin lies on side of ab opposite the triangle

                    // *
                    if ( vec3.dot( ab, ao ) >= 0 ) {
                        // Origin outside of the ab line, so we form a new
                        // 1-simplex (line) with points A and B, leaving C behind
                        this.points.length = 0;
                        this.points.push( b, a );

                        // New search direction is from ac towards the origin
                        vec3.cross( ab, ao, this.next_direction );
                        vec3.cross( this.next_direction, ab );
                    } else {
                        // only A gives us a good reference point, start over with a 0-simplex
                        this.points.length = 0;
                        this.points.push( a );
                    }
                    // *

                } else {

                    // Origin lies somewhere in the triangle or above/below it
                    if ( vec3.dot( _tmp_vec3_1, ao ) >= 0 ) {
                        // Origin is on the front side of the triangle
                        vec3.set( _tmp_vec3_1, this.next_direction );
                    } else {
                        // Origin is on the back side of the triangle
                        vec3.set( _tmp_vec3_1, this.next_direction );
                        vec3.negate( this.next_direction );
                        this.points.length = 0;
                        this.points.push( a, b, c );
                    }

                }

            }
        },

        getFaceNormal: function( a, b, c, destination ) {
            vec3.subtract( c.point, a.point, ac );
            vec3.subtract( b.point, a.point, ab );
            vec3.cross( ac, ab, destination );
            vec3.normalize( destination );
        },

        faceNormalDotOrigin: function( a, b, c ) {
            // Find face normal
            this.getFaceNormal( a, b, c, _tmp_vec3_1 );

            // Find direction of origin from center of face
            vec3.add( a.point, b.point, _tmp_vec3_2 );
            vec3.add( _tmp_vec3_2, c.point );
            vec3.negate( _tmp_vec3_2 );
            vec3.normalize( _tmp_vec3_2 );

            return vec3.dot( _tmp_vec3_1, _tmp_vec3_2 );
        },

        findDirectionFromTetrahedron: function() {
            var a = this.points[3],
                b = this.points[2],
                c = this.points[1],
                d = this.points[0];

            if ( this.containsOrigin() ) {
                // We have a collision, ready for EPA
                return true;
            }


            var origin = vec3.create();

            // Tetrahedron doesn't contain the origin, bail
            // Find which face normal of the tetrahedron aligns best to AO
            var best = 0, dot = 0, shortest = Infinity, distance = 0;

            // @TODO this line, repeated four times below, may not be needed:
            // if ( vec3.squaredLength( _tmp_vec3_2 ) < Goblin.EPSILON ) return true;

            // Face 1, DCA
            Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, c.point, a.point, _tmp_vec3_2 );
            vec3.subtract( d.point, a.point, ab );
            vec3.subtract( c.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            //vec3.normalize( _tmp_vec3_1 );
            distance = vec3.length( _tmp_vec3_2 );
            if ( distance < shortest ) {
                shortest = distance;
                vec3.set( _tmp_vec3_1, this.next_direction );
                this.points.length = 0;
                this.points.push( a, c, d );
            }

            // Face 2, CBA
            Goblin.GeometryMethods.findClosestPointInTriangle( origin, c.point, b.point, a.point, _tmp_vec3_2 );
            vec3.subtract( c.point, a.point, ab );
            vec3.subtract( b.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            //vec3.normalize( _tmp_vec3_1 );
            distance = vec3.length( _tmp_vec3_2 );
            if ( distance < shortest ) {
                shortest = distance;
                vec3.set( _tmp_vec3_1, this.next_direction );
                this.points.length = 0;
                this.points.push( a, b, c );
            }

            // Face 3, ADB
            Goblin.GeometryMethods.findClosestPointInTriangle( origin, b.point, d.point, a.point, _tmp_vec3_2 );
            vec3.subtract( b.point, a.point, ab );
            vec3.subtract( d.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            //vec3.normalize( _tmp_vec3_1 );
            distance = vec3.length( _tmp_vec3_2 );
            if ( distance < shortest ) {
                shortest = distance;
                vec3.set( _tmp_vec3_1, this.next_direction );
                this.points.length = 0;
                this.points.push( b, d, a );
            }

            // Face 4, DCB
            Goblin.GeometryMethods.findClosestPointInTriangle( origin, d.point, b.point, c.point, _tmp_vec3_2 );
            vec3.subtract( d.point, c.point, ab );
            vec3.subtract( b.point, c.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            //vec3.normalize( _tmp_vec3_1 );
            distance = vec3.length( _tmp_vec3_2 );
            if ( distance < shortest ) {
                shortest = distance;
                vec3.set( _tmp_vec3_1, this.next_direction );
                this.points.length = 0;
                this.points.push( c, b, d );
            }

            /*// Check each of the four sides to see which one is facing the origin.
            // Then keep the three points for that triangle and use its normal as the search direction
            var best_a, best_b, best_c,
                reason = -Infinity,
                current = 0;

            // Face 1, DCA
            current = this.faceNormalDotOrigin( d, c, a );
            if ( current > reason ) {
                console.log( 'DCA' );
                best_a = d;
                best_b = c;
                best_c = a;
                reason = current;
            }

            // Face 2, CBA
            current = this.faceNormalDotOrigin( c, b, a );
            if ( current > reason ) {
                console.log( 'CBA' );
                best_a = c;
                best_b = b;
                best_c = a;
                reason = current;
            }

            // Face 3, ADB
            current = this.faceNormalDotOrigin( a, d, b );
            if ( current > reason ) {
                console.log( 'ADB' );
                best_a = a;
                best_b = d;
                best_c = b;
                reason = current;
            }

            // Face 4, DCB
            current = this.faceNormalDotOrigin( d, c, b );
            if ( current > reason ) {
                console.log( 'DCB' );
                best_a = d;
                best_b = c;
                best_c = b;
            }

            // Update simplex & direction
            this.getFaceNormal( best_a, best_b, best_c, _tmp_vec3_1 );
            vec3.set( _tmp_vec3_1, this.next_direction );
            this.points.length = 0;
            this.points.push( best_c, best_b, best_a );*/
        },

        containsOrigin: function() {
            var a = this.points[3],
                b = this.points[2],
                c = this.points[1],
                d = this.points[0];

            // Check DCA
            vec3.subtract( d.point, a.point, ab );
            vec3.subtract( c.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            if ( vec3.dot( _tmp_vec3_1, a.point ) > 0 ) {
                return false;
            }

            // Check CBA
            vec3.subtract( c.point, a.point, ab );
            vec3.subtract( b.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            if ( vec3.dot( _tmp_vec3_1, a.point ) > 0 ) {
                return false;
            }

            // Check ADB
            vec3.subtract( b.point, a.point, ab );
            vec3.subtract( d.point, a.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            if ( vec3.dot( _tmp_vec3_1, a.point ) > 0 ) {
                return false;
            }

            // Check DCB
            vec3.subtract( b.point, d.point, ab );
            vec3.subtract( c.point, d.point, ad );
            vec3.cross( ab, ad, _tmp_vec3_1 );
            if ( vec3.dot( _tmp_vec3_1, d.point ) > 0 ) {
                return false;
            }

            return true;
        },

        updateDirection: function() {
            if ( this.points.length === 0 ) {

                vec3.subtract( this.object_b.position, this.object_a.position, this.next_direction );

            } else if ( this.points.length === 1 ) {

                vec3.negate( this.next_direction );

            } else if ( this.points.length === 2 ) {

                this.findDirectionFromLine();

            } else if ( this.points.length === 3 ) {

                this.findDirectionFromTriangle();

            } else {

                return this.findDirectionFromTetrahedron();

            }
        }
    };
})();

Goblin.SphereSphere = function( object_a, object_b ) {
	// Cache positions of the spheres
	var position_a = object_a.position,
		position_b = object_b.position;

	// Get the vector between the two objects
	vec3.subtract( position_b, position_a, _tmp_vec3_1 );
	var distance = vec3.length( _tmp_vec3_1 );

	// If the distance between the objects is greater than their combined radii
	// then they are not touching, continue processing the other possible contacts
	if ( distance > object_a.shape.radius + object_b.shape.radius ) {
		return;
	}

	// Get a ContactDetails object and fill out it's information
	var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = object_a;
	contact.object_b = object_b;

	// Because we already have the distance (vector magnitude), don't call vec3.normalize
	// instead we will calculate this value manually
	vec3.scale( _tmp_vec3_1, 1 / distance, contact.contact_normal );

	// Calculate contact position
	vec3.scale( _tmp_vec3_1, -0.5 );
	vec3.add( _tmp_vec3_1, position_a, contact.contact_point );

	// Calculate penetration depth
	contact.penetration_depth = object_a.shape.radius + object_b.shape.radius - distance;

	// Contact points in both objects - in world coordinates at first
	vec3.scale( contact.contact_normal, contact.object_a.shape.radius, contact.contact_point_in_a );
	vec3.add( contact.contact_point_in_a, contact.object_a.position );
	vec3.scale( contact.contact_normal, -contact.object_b.shape.radius, contact.contact_point_in_b );
	vec3.add( contact.contact_point_in_b, contact.object_b.position );

	// Find actual contact point
	vec3.add( contact.contact_point_in_a, contact.contact_point_in_b, contact.contact_point );
	vec3.scale( contact.contact_point, 0.5 );

	// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
	mat4.multiplyVec3( contact.object_a.transform_inverse, contact.contact_point_in_a );
	mat4.multiplyVec3( contact.object_b.transform_inverse, contact.contact_point_in_b );

	contact.restitution = ( object_a.restitution + object_b.restitution ) / 2;
	contact.friction = ( object_a.friction + object_b.friction ) / 2;

	return contact;
};
Goblin.Constraint = function() {
	this.object_a = null;

	this.object_b = null;

	this.rows = [];
};
Goblin.ConstraintRow = function() {
	this.jacobian = new Float64Array( 12 );
	this.B = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this.D = 0; // Length of the jacobian

	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;

	this.bias = 0;
	this.multiplier = 0;
	this.multiplier_cache = 0;
	this.eta = 0; // The amount of work required of the constraint
	this.eta_row = new Float64Array( 12 );

	this.applied_push_impulse = 0;
};

Goblin.ConstraintRow.prototype.computeB = function( constraint ) {
	var invmass = 0;

	if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
		invmass = 1 / constraint.object_a.mass;

		this.B[0] = invmass * this.jacobian[0];
		this.B[1] = invmass * this.jacobian[1];
		this.B[2] = invmass * this.jacobian[2];

		_tmp_vec3_1[0] = this.jacobian[3];
		_tmp_vec3_1[1] = this.jacobian[4];
		_tmp_vec3_1[2] = this.jacobian[5];
		mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.B[3] = _tmp_vec3_1[0];
		this.B[4] = _tmp_vec3_1[1];
		this.B[5] = _tmp_vec3_1[2];
	} else {
		this.B[0] = this.B[1] = this.B[2] = 0;
		this.B[3] = this.B[4] = this.B[5] = 0;
	}

	if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
		invmass = 1 / constraint.object_b.mass;
		this.B[6] = invmass * this.jacobian[6];
		this.B[7] = invmass * this.jacobian[7];
		this.B[8] = invmass * this.jacobian[8];

		_tmp_vec3_1[0] = this.jacobian[9];
		_tmp_vec3_1[1] = this.jacobian[10];
		_tmp_vec3_1[2] = this.jacobian[11];
		mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.B[9] = _tmp_vec3_1[0];
		this.B[10] = _tmp_vec3_1[1];
		this.B[11] = _tmp_vec3_1[2];
	} else {
		this.B[6] = this.B[7] = this.B[8] = 0;
		this.B[9] = this.B[10] = this.B[11] = 0;
	}
};

Goblin.ConstraintRow.prototype.computeD = function( constraint ) {
	this.D = 0;

	if ( constraint.object_a != null ) {
		this.D += this.jacobian[0] * this.jacobian[0] +
			this.jacobian[1] * this.B[1] +
			this.jacobian[2] * this.B[2] +
			this.jacobian[3] * this.B[3] +
			this.jacobian[4] * this.B[4] +
			this.jacobian[5] * this.B[5];
	}

	if ( constraint.object_b != null ) {
		this.D += this.jacobian[6] * this.jacobian[6] +
			this.jacobian[7] * this.B[7] +
			this.jacobian[8] * this.B[8] +
			this.jacobian[9] * this.B[9] +
			this.jacobian[10] * this.B[10] +
			this.jacobian[11] * this.B[11];
	}
};

Goblin.ConstraintRow.prototype.computeEta = function( constraint ) {
	var invmass;

	if ( constraint.object_a != null ) {
		// Compute linear distance traveling this tick
		invmass = 1 / constraint.object_a.mass;
		this.eta_row[0] = ( constraint.object_a.linear_velocity[0] + ( invmass * constraint.object_a.accumulated_force[0] ) );
		this.eta_row[1] = ( constraint.object_a.linear_velocity[1] + ( invmass * constraint.object_a.accumulated_force[1] ) );
		this.eta_row[2] = ( constraint.object_a.linear_velocity[2] + ( invmass * constraint.object_a.accumulated_force[2] ) );

		// Compute angular distance traveling this tick
		vec3.set( constraint.object_a.accumulated_torque, _tmp_vec3_1 );
		mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.eta_row[3] = ( constraint.object_a.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
		this.eta_row[4] = ( constraint.object_a.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
		this.eta_row[5] = ( constraint.object_a.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
	} else {
		this.eta_row[0] = this.eta_row[1] = this.eta_row[2] = this.eta_row[3] = this.eta_row[4] = this.eta_row[5] = 0;
	}
	if ( constraint.object_b != null ) {
		invmass = 1 / constraint.object_b.mass;
		this.eta_row[6] = ( constraint.object_b.linear_velocity[0] + ( invmass * constraint.object_b.accumulated_force[0] ) );
		this.eta_row[7] = ( constraint.object_b.linear_velocity[1] + ( invmass * constraint.object_b.accumulated_force[1] ) );
		this.eta_row[8] = ( constraint.object_b.linear_velocity[2] + ( invmass * constraint.object_b.accumulated_force[2] ) );

		// Compute angular distance traveling this tick
		vec3.set( constraint.object_b.accumulated_torque, _tmp_vec3_1 );
		mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.eta_row[9] = ( constraint.object_b.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
		this.eta_row[10] = ( constraint.object_b.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
		this.eta_row[11] = ( constraint.object_b.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
	} else {
		this.eta_row[6] = this.eta_row[7] = this.eta_row[8] = this.eta_row[9] = this.eta_row[10] = this.eta_row[11] = 0;
	}

	var jdotv = this.jacobian[0] * this.eta_row[0] +
		this.jacobian[1] * this.eta_row[1] +
		this.jacobian[2] * this.eta_row[2] +
		this.jacobian[3] * this.eta_row[3] +
		this.jacobian[4] * this.eta_row[4] +
		this.jacobian[5] * this.eta_row[5] +
		this.jacobian[6] * this.eta_row[6] +
		this.jacobian[7] * this.eta_row[7] +
		this.jacobian[8] * this.eta_row[8] +
		this.jacobian[9] * this.eta_row[9] +
		this.jacobian[10] * this.eta_row[10] +
		this.jacobian[11] * this.eta_row[11];

	this.eta = this.bias - jdotv;
};
Goblin.ContactConstraint = function() {
	Goblin.Constraint.call( this );
};

Goblin.ContactConstraint.prototype.buildFromContact = function( contact ) {
	var row = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;
	this.contact = contact;

	row.lower_limit = 0;
	row.upper_limit = Infinity;

	if ( this.object_a == null || this.object_a.mass === Infinity ) {
		row.jacobian[0] = row.jacobian[1] = row.jacobian[2] = 0;
		row.jacobian[3] = row.jacobian[4] = row.jacobian[5] = 0;
	} else {
		row.jacobian[0] = -contact.contact_normal[0];
		row.jacobian[1] = -contact.contact_normal[1];
		row.jacobian[2] = -contact.contact_normal[2];

		vec3.subtract( contact.contact_point, contact.object_a.position, _tmp_vec3_1 );
		//vec3.set( contact.contact_point_in_a, _tmp_vec3_1 );
		vec3.cross( _tmp_vec3_1, contact.contact_normal, _tmp_vec3_1 );
		row.jacobian[3] = -_tmp_vec3_1[0];
		row.jacobian[4] = -_tmp_vec3_1[1];
		row.jacobian[5] = -_tmp_vec3_1[2];
	}

	if ( this.object_b == null || this.object_b.mass === Infinity ) {
		row.jacobian[6] = row.jacobian[7] = row.jacobian[8] = 0;
		row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;
	} else {
		row.jacobian[6] = contact.contact_normal[0];
		row.jacobian[7] = contact.contact_normal[1];
		row.jacobian[8] = contact.contact_normal[2];

		vec3.subtract( contact.contact_point, contact.object_b.position, _tmp_vec3_1 );
		//vec3.set( contact.contact_point_in_b, _tmp_vec3_1 );
		vec3.cross( _tmp_vec3_1, contact.contact_normal, _tmp_vec3_1 );
		row.jacobian[9] = _tmp_vec3_1[0];
		row.jacobian[10] = _tmp_vec3_1[1];
		row.jacobian[11] = _tmp_vec3_1[2];
	}

	// Pre-calc error
	row.bias = contact.penetration_depth; //0;

	// Apply restitution
    var velocity = vec3.dot( this.object_a.linear_velocity, contact.contact_normal );
    velocity -= vec3.dot( this.object_b.linear_velocity, contact.contact_normal );

	// Add restitution to bias
	row.bias += velocity * contact.restitution;

	this.rows[0] = row;
};
Goblin.FrictionConstraint = function() {
	Goblin.Constraint.call( this );
};

Goblin.FrictionConstraint.prototype.buildFromContact = function( contact ) {
	var row = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;

	// Find the contact point relative to object_a and object_b
	var rel_a = vec3.create(),
		rel_b = vec3.create();
	vec3.subtract( contact.contact_point, contact.object_a.position, rel_a );
	vec3.subtract( contact.contact_point, contact.object_b.position, rel_b );

	// Find the relative velocity at the contact point
	var velocity_a = vec3.create(),
		velocity_b = vec3.create();

	vec3.cross( contact.object_a.angular_velocity, rel_a, velocity_a );
	vec3.add( velocity_a, contact.object_a.linear_velocity );

	vec3.cross( contact.object_b.angular_velocity, rel_b, velocity_b );
	vec3.add( velocity_b, contact.object_b.linear_velocity );

	var relative_velocity = vec3.create();
	vec3.subtract( velocity_a, velocity_b, relative_velocity );

	// Remove velocity along contact normal
	var normal_velocity = vec3.dot( contact.contact_normal, relative_velocity );
	relative_velocity[0] -= normal_velocity * contact.contact_normal[0];
	relative_velocity[1] -= normal_velocity * contact.contact_normal[1];
	relative_velocity[2] -= normal_velocity * contact.contact_normal[2];

	var length = vec3.squaredLength( relative_velocity );
	if ( length >= Goblin.EPSILON ) {
		length = Math.sqrt( length );
		row.jacobian[0] = relative_velocity[0] / length;
		row.jacobian[1] = relative_velocity[1] / length;
		row.jacobian[2] = relative_velocity[2] / length;
		row.jacobian[6] = relative_velocity[0] / -length;
		row.jacobian[7] = relative_velocity[1] / -length;
		row.jacobian[8] = relative_velocity[2] / -length;
	} else {
		this.rows.length = 0;
		return;
	}

	// rel_a X N
	row.jacobian[3] = rel_a[1] * row.jacobian[2] - rel_a[2] * row.jacobian[1];
	row.jacobian[4] = rel_a[2] * row.jacobian[0] - rel_a[0] * row.jacobian[2];
	row.jacobian[5] = rel_a[0] * row.jacobian[1] - rel_a[1] * row.jacobian[0];

	// N X rel_b
	row.jacobian[9] = row.jacobian[1] * rel_b[2] - row.jacobian[2] * rel_b[1];
	row.jacobian[10] = row.jacobian[2] * rel_b[0] - row.jacobian[0] * rel_b[2];
	row.jacobian[11] = row.jacobian[0] * rel_b[1] - row.jacobian[1] * rel_b[0];

	var limit = contact.friction * 0.1;
	row.lower_limit = -limit;
	row.upper_limit = limit;
	row.bias = 0;

	this.rows.push( row );
};
/**
 * Structure which holds information about a contact between two objects
 *
 * @Class ContactDetails
 * @constructor
 */
Goblin.ContactDetails = function() {
	/**
	 * first body in the  contact
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this.object_a = null;

	/**
	 * second body in the  contact
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this.object_b = null;

	/**
	 * point of contact in world coordinates
	 *
	 * @property contact_point
	 * @type {vec3}
	 */
	this.contact_point = vec3.create();

	/**
	 * contact point in local frame of `object_a`
	 *
	 * @property contact_point_in_a
	 * @type {vec3}
	 */
	this.contact_point_in_a = vec3.create();

	/**
	 * contact point in local frame of `object_b`
	 *
	 * @property contact_point_in_b
	 * @type {vec3}
	 */
	this.contact_point_in_b = vec3.create();

	/**
	 * normal vector, in world coordinates, of the contact
	 *
	 * @property contact_normal
	 * @type {vec3}
	 */
	this.contact_normal = vec3.create();

	/**
	 * how far the objects are penetrated at the point of contact
	 *
	 * @property penetration_depth
	 * @type {Number}
	 */
	this.penetration_depth = 0;

	/**
	 * amount of restitution between the objects in contact
	 *
	 * @property restitution
	 * @type {Number}
	 */
	this.restitution = 0;

	/**
	 * amount of friction between the objects in contact
	 *
	 * @property friction
	 * @type {*}
	 */
	this.friction = 0;
};
/**
 * Structure which holds information about the contact points between two objects
 *
 * @Class ContactManifold
 * @constructor
 */
Goblin.ContactManifold = function() {
	/**
	 * first body in the contact
	 *
	 * @property object_a
	 * @type {RigidBody}
	 */
	this.object_a = null;

	/**
	 * second body in the contact
	 *
	 * @property object_b
	 * @type {RigidBody}
	 */
	this.object_b = null;

	/**
	 * array of the active contact points for this manifold
	 *
	 * @property points
	 * @type {Array}
	 */
	this.points = [];

	/**
	 * reference to the next `ContactManifold` in the list
	 *
	 * @property next_manifold
	 * @type {ContactManifold}
	 */
	this.next_manifold = null;
};

/**
 * Determines which cached contact should be replaced with the new contact
 *
 * @method findWeakestContact
 * @param {ContactDetails} new_contact
 */
Goblin.ContactManifold.prototype.findWeakestContact = function( new_contact ) {
	// Find which of the current contacts has the deepest penetration
	var max_penetration_index = -1,
		max_penetration = new_contact.penetration_depth,
		i,
		contact;
	for ( i = 0; i < 4; i++ ) {
		contact = this.points[i];
		if ( contact.penetration_depth > max_penetration ) {
			max_penetration = contact.penetration_depth;
			max_penetration_index = i;
		}
	}

	// Estimate contact areas
	var res0 = 0,
		res1 = 0,
		res2 = 0,
		res3 = 0;
	if ( max_penetration_index !== 0 ) {
		vec3.subtract( new_contact.contact_point_in_a, this.points[1].contact_point_in_a, _tmp_vec3_1 );
		vec3.subtract( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a, _tmp_vec3_2 );
		vec3.cross( _tmp_vec3_1, _tmp_vec3_2 );
		res0 = vec3.squaredLength( _tmp_vec3_1 );
	}
	if ( max_penetration_index !== 1 ) {
		vec3.subtract( new_contact.contact_point_in_a, this.points[0].contact_point_in_a, _tmp_vec3_1 );
		vec3.subtract( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a, _tmp_vec3_2 );
		vec3.cross( _tmp_vec3_1, _tmp_vec3_2 );
		res1 = vec3.squaredLength( _tmp_vec3_1 );
	}
	if ( max_penetration_index !== 2 ) {
		vec3.subtract( new_contact.contact_point_in_a, this.points[0].contact_point_in_a, _tmp_vec3_1 );
		vec3.subtract( this.points[3].contact_point_in_a, this.points[1].contact_point_in_a, _tmp_vec3_2 );
		vec3.cross( _tmp_vec3_1, _tmp_vec3_2 );
		res2 = vec3.squaredLength( _tmp_vec3_1 );
	}
	if ( max_penetration_index !== 3 ) {
		vec3.subtract( new_contact.contact_point_in_a, this.points[0].contact_point_in_a, _tmp_vec3_1 );
		vec3.subtract( this.points[2].contact_point_in_a, this.points[1].contact_point_in_a, _tmp_vec3_2 );
		vec3.cross( _tmp_vec3_1, _tmp_vec3_2 );
		res3 = vec3.squaredLength( _tmp_vec3_1 );
	}

	var max_index = 0,
		max_val = res0;
	if ( res1 > max_val ) {
		max_index = 1;
		max_val = res1;
	}
	if ( res2 > max_val ) {
		max_index = 2;
		max_val = res2;
	}
	if ( res3 > max_val ) {
		max_index = 3;
	}

	return max_index;
};

/**
 * Adds a contact point to the manifold
 *
 * @param {Goblin.ContactDetails} contact
 */
Goblin.ContactManifold.prototype.addContact = function( contact ) {
	//@TODO add feature-ids to detect duplicate contacts
	var i;
	for ( i = 0; i < this.points.length; i++ ) {
		if ( vec3.dist( this.points[i].contact_point, contact.contact_point ) <= 0.02 ) {
			Goblin.ObjectPool.freeObject( 'ContactDetails', contact );
			return;
		}
	}

	this.points.push( contact );
	return;
	/*@TODO: The findWeakestContact logic is broken
	// Add contact if we don't have enough points yet
	if ( this.points.length < 4 ) {
		this.points.push( contact );
	} else {
		var replace_index = this.findWeakestContact( contact );
		//@TODO give the contact back to the object pool
		this.points[replace_index] = contact;
	}*/
};

/**
 * Updates all of this manifold's ContactDetails with the correct contact location & penetration depth
 *
 * @method update
 */
Goblin.ContactManifold.prototype.update = function() {
	// Update positions / depths of contacts
	var i,
		j,
		point,
		object_a_world_coords = vec3.create(),
		object_b_world_coords = vec3.create(),
		vector_difference = vec3.create();

	for ( i = 0; i < this.points.length; i++ ) {
		point = this.points[i];

		// Convert the local contact points into world coordinates
		mat4.multiplyVec3( point.object_a.transform, point.contact_point_in_a, object_a_world_coords );
		mat4.multiplyVec3( point.object_b.transform, point.contact_point_in_b, object_b_world_coords );

		// Find new world contact point
		vec3.add( object_a_world_coords, object_b_world_coords, point.contact_point );
		vec3.scale( point.contact_point, 0.5 );

		// Find the new penetration depth
		vec3.subtract( object_a_world_coords, object_b_world_coords, vector_difference );
		point.penetration_depth = vec3.dot( vector_difference, point.contact_normal );

		// If distance from contact is too great remove this contact point
		if ( point.penetration_depth < -0.02 ) {
			// Points are too far away along the contact normal
			Goblin.ObjectPool.freeObject( 'ContactDetails', point );
			for ( j = i; j < this.points.length; j++ ) {
				this.points[j] = this.points[j + 1];
			}
			this.points.length = this.points.length - 1;
		} else {
			// Check if points are too far away orthogonally
			vec3.scale( point.contact_normal, point.penetration_depth, _tmp_vec3_1 );
			vec3.subtract( object_a_world_coords, _tmp_vec3_1, _tmp_vec3_1 );

			vec3.subtract( object_b_world_coords, _tmp_vec3_1, _tmp_vec3_1 );
			var distance = vec3.squaredLength( _tmp_vec3_1 );
			if ( distance > 0.2 * 0.2 ) {
				// Points are indeed too far away
				Goblin.ObjectPool.freeObject( 'ContactDetails', point );
				for ( j = i; j < this.points.length; j++ ) {
					this.points[j] = this.points[j + 1];
				}
				this.points.length = this.points.length - 1;
			}
		}
	}
};
/**
 * List/Manager of ContactManifolds
 *
 * @Class ContactManifoldList
 * @constructor
 */
Goblin.ContactManifoldList = function() {
	/**
	 * The first ContactManifold in the list
	 *
	 * @property first
	 * @type {ContactManifold}
	 */
	this.first = null;
};

/**
 * Inserts a ContactManifold into the list
 *
 * @method insert
 * @param {ContactManifold} contact_manifold contact manifold to insert into the list
 */
Goblin.ContactManifoldList.prototype.insert = function( contact_manifold ) {
	// The list is completely unordered, throw the manifold at the beginning
	contact_manifold.next_manifold = this.first;
	this.first = contact_manifold;
};

/**
 * Returns (and possibly creates) a ContactManifold for the two rigid bodies
 *
 * @param {RigidBody} object_a
 * @param {RigidBoxy} object_b
 * @returns {ContactManifold}
 */
Goblin.ContactManifoldList.prototype.getManifoldForObjects = function( object_a, object_b ) {
	var manifold = null;
	if ( this.first !== null ) {
		var current = this.first;
		while ( current !== null ) {
			if (
				current.object_a === object_a && current.object_b === object_b ||
				current.object_a === object_b && current.object_b === object_a
			) {
				manifold = current;
				break;
			}
			current = current.next_manifold;
		}
	}

	if ( manifold === null ) {
		// A manifold for these two objects does not exist, create one
		manifold = Goblin.ObjectPool.getObject( 'ContactManifold' );
		manifold.object_a = object_a;
		manifold.object_b = object_b;
		this.insert( manifold );
	}

	return manifold;
};
/**
 * adds a constant force to associated objects
 *
 * @class ForceGenerator
 * @constructor
 * @param force {vec3} [optional] force the generator applies
*/
Goblin.ForceGenerator = function( force ) {
	/**
	* force which will be applied to affected objects
	*
	* @property force
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this.force = force || vec3.create();

	/**
	* whether or not the force generator is enabled
	*
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this.enabled = true;

	/**
	* array of objects affected by the generator
	*
	* @property affected
	* @type {Array}
	* @default []
	* @private
	*/
	this.affected = [];
};
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin.ForceGenerator.prototype.applyForce = function() {
	if ( !this.enabled ) {
		return;
	}

	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		this.affected[i].applyForce( this.force );
	}
};
/**
* enables the force generator
*
* @method enable
*/
Goblin.ForceGenerator.prototype.enable = function() {
	this.enabled = true;
};
/**
* disables the force generator
*
* @method disable
*/
Goblin.ForceGenerator.prototype.disable = function() {
	this.enabled = false;
};
/**
* adds an object to be affected by the generator
*
* @method affect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin.ForceGenerator.prototype.affect = function( object ) {
	var i, affected_count;
	// Make sure this object isn't already affected
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			return;
		}
	}

	this.affected.push( object );
};
/**
* removes an object from being affected by the generator
*
* @method unaffect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin.ForceGenerator.prototype.unaffect = function( object ) {
	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			this.affected.splice( i, 1 );
			return;
		}
	}
};
/**
* adds a drag force to associated objects
*
* @class DragForce
* @extends ForceGenerator
* @constructor
*/
Goblin.DragForce = function( drag_coefficient, squared_drag_coefficient ) {
	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this.drag_coefficient = drag_coefficient || 0;

	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this.squared_drag_coefficient = squared_drag_coefficient || 0;

	/**
	* whether or not the force generator is enabled
	*
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this.enabled = true;

	/**
	* array of objects affected by the generator
	*
	* @property affected
	* @type {Array}
	* @default []
	* @private
	*/
	this.affected = [];
};
Goblin.DragForce.prototype.enable = Goblin.ForceGenerator.prototype.enable;
Goblin.DragForce.prototype.disable = Goblin.ForceGenerator.prototype.disable;
Goblin.DragForce.prototype.affect = Goblin.ForceGenerator.prototype.affect;
Goblin.DragForce.prototype.unaffect = Goblin.ForceGenerator.prototype.unaffect;
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin.DragForce.prototype.applyForce = function() {
	if ( !this.enabled ) {
		return;
	}

	var i, affected_count, object, drag,
		force = _tmp_vec3_1;

	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		object = this.affected[i];

		vec3.set( object.linear_velocity, force );

		// Calculate the total drag coefficient.
		drag = vec3.length( force );
		drag = ( this.drag_coefficient * drag ) + ( this.squared_drag_coefficient * drag * drag );

		// Calculate the final force and apply it.
		vec3.normalize( force );
		vec3.scale( force, -drag );
		object.applyForce( force );
	}
};
Goblin.LinkedList = function() {
	this.first = null;
};

Goblin.LinkedList.prototype.add = function( entry ) {
	// Unordered list, just add the entry to the front
	if ( this.first == null ) {
		this.first = entry;
	} else {
		this.first.prev = entry;
		entry.next = this.first;
		this.first = entry;
	}
};

Goblin.LinkedList.prototype.remove = function( value ) {
	var entry;

	while ( entry = this.first ) {
		if ( entry.value === value ) {
			if ( entry.prev ) {
				entry.prev = entry.next;
			}
			if ( entry.next ) {
				entry.next = entry.prev;
			}

			return;
		}
		entry = entry.next;
	}
};

Goblin.LinkedListEntry = function( value ) {
	this.value = value;

	this.prev = null;
	this.next = null;
};
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
	}
};
/**
 * Takes possible contacts found by a broad phase and determines if they are legitimate contacts
 *
 * @class NearPhase
 * @constructor
 */
Goblin.NearPhase = function() {
	/**
	 * holds all contacts which currently exist in the scene
	 *
	 * @property contact_manifolds
	 * @type Goblin.ContactManifoldList
	 */
	this.contact_manifolds = new Goblin.ContactManifoldList();
};

/**
 * Iterates over all contact manifolds, updating penetration depth & contact locations
 *
 * @method updateContactManifolds
 */
Goblin.NearPhase.prototype.updateContactManifolds = function() {
	var current = this.contact_manifolds.first,
		prev = null;

	while ( current !== null ) {
		current.update();

		if ( current.points.length === 0 ) {
			Goblin.ObjectPool.freeObject( 'ContactManifold', current );
			if ( prev == null ) {
				this.contact_manifolds.first = current.next_manifold;
			} else {
				prev.next_manifold = current.next_manifold;
			}
			current = current.next_manifold;
		} else {
			prev = current;
			current = current.next_manifold;
		}
	}
};

Goblin.NearPhase.prototype.midPhase = function( object_a, object_b ) {
	var compound,
		other;

	if ( object_a.shape instanceof Goblin.CompoundShape ) {
		compound = object_a;
		other = object_b;
	} else {
		compound = object_b;
		other = object_a;
	}

	var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' ),
		child_shape, contact;
	for ( var i = 0; i < compound.shape.child_shapes.length; i++ ) {
		child_shape = compound.shape.child_shapes[i];
		proxy.setFrom( compound, child_shape );

		if ( proxy.shape instanceof Goblin.CompoundShape || other.shape instanceof Goblin.CompoundShape ) {
			this.midPhase( proxy, other );
		} else {
			contact = this.getContact( proxy, other );
			if ( contact != null ) {

				var parent_a, parent_b;
				if ( contact.object_a === proxy ) {
					contact.object_a = compound;
					parent_a = proxy;
					parent_b = other;
				} else {
					contact.object_b = compound;
					parent_a = other;
					parent_b = proxy;
				}

				if ( parent_a instanceof Goblin.RigidBodyProxy ) {
					while ( parent_a.parent ) {
						if ( parent_a instanceof Goblin.RigidBodyProxy ) {
							mat4.multiplyVec3( parent_a.shape_data.transform, contact.contact_point_in_a );
						}
						parent_a = parent_a.parent;
					}
				}

				if ( parent_b instanceof Goblin.RigidBodyProxy ) {
					while ( parent_b.parent ) {
						if ( parent_b instanceof Goblin.RigidBodyProxy ) {
							mat4.multiplyVec3( parent_b.shape_data.transform, contact.contact_point_in_b );
						}
						parent_b = parent_b.parent;
					}
				}

				contact.object_a = parent_a;
				contact.object_b = parent_b;
				this.addContact( parent_a, parent_b, contact );
			}
		}
	}
	Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );
};

/**
 * Tests two objects for contact
 *
 * @method getContact
 * @param {RigidBody} object_a
 * @param {RigidBody} object_b
 */
Goblin.NearPhase.prototype.getContact = function( object_a, object_b ) {
	if ( object_a.shape instanceof Goblin.CompoundShape || object_b.shape instanceof Goblin.CompoundShape ) {
		this.midPhase( object_a, object_b );
		return;
	}

	var contact;

	if ( object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.SphereShape ) {
		// Sphere - Sphere contact check
		contact = Goblin.SphereSphere( object_a, object_b );
	} else if (
		object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.BoxShape ||
		object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.SphereShape
		) {
		// Sphere - Box contact check
		contact = Goblin.BoxSphere( object_a, object_b );
	} else {
		// contact check based on GJK
		if ( (contact = Goblin.GjkEpa2.GJK( object_a, object_b )) != null ) {
			contact = Goblin.GjkEpa2.EPA( contact );
		}
	}

	return contact;
};

Goblin.NearPhase.prototype.addContact = function( object_a, object_b, contact ) {
	this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
};

/**
 * Loops over the passed array of object pairs which may be in contact
 * valid contacts are put in this object's `contacts` property
 *
 * @param possible_contacts {Array}
 */
Goblin.NearPhase.prototype.generateContacts = function( possible_contacts ) {
	var i,
		contact,
		possible_contacts_length = possible_contacts.length;

	// Make sure all of the manifolds are up to date
	this.updateContactManifolds();

	for ( i = 0; i < possible_contacts_length; i++ ) {
		contact = this.getContact( possible_contacts[i][0], possible_contacts[i][1] );
		if ( contact != null ) {
			this.addContact( possible_contacts[i][0], possible_contacts[i][1], contact );
		}
	}
};
/**
 * Manages pools for various types of objects, provides methods for creating and freeing pooled objects
 *
 * @class ObjectPool
 * @static
 */
Goblin.ObjectPool = {
	/**
	 * key/value map of registered types
	 *
	 * @property types
	 * @private
	 */
	types: {},

	/**
	 * key/pool map of object type - to - object pool
	 *
	 * @property pools
	 * @private
	 */
	pools: {},

	/**
	 * registers a type of object to be available in pools
	 *
	 * @param key {String} key associated with the object to register
	 * @param constructing_function {Function} function which will return a new object
	 */
	registerType: function( key, constructing_function ) {
		this.types[ key ] = constructing_function;
		this.pools[ key ] = [];
	},

	/**
	 * retrieve a free object from the specified pool, or creates a new object if one is not available
	 *
	 * @param key {String} key of the object type to retrieve
	 * @return {Mixed} object of the type asked for, when done release it with `ObjectPool.freeObject`
	 */
	getObject: function( key ) {
		var pool = this.pools[ key ];

		if ( pool.length !== 0 ) {
			return pool.pop();
		} else {
			return this.types[ key ]();
		}
	},

	/**
	 * adds on object to the object pool so it can be reused
	 *
	 * @param key {String} type of the object being freed, matching the key given to `registerType`
	 * @param object {Mixed} object to release into the pool
	 */
	freeObject: function( key, object ) {
		this.pools[ key ].push( object );
	}
};

// register the objects used in Goblin
Goblin.ObjectPool.registerType( 'ContactDetails', function() { return new Goblin.ContactDetails(); } );
Goblin.ObjectPool.registerType( 'ContactManifold', function() { return new Goblin.ContactManifold(); } );
Goblin.ObjectPool.registerType( 'GJKSupportPoint', function() { return new Goblin.GjkEpa.SupportPoint( vec3.create(), vec3.create(), vec3.create(), vec3.create() ); } );
Goblin.ObjectPool.registerType( 'GJK2SupportPoint', function() { return new Goblin.GjkEpa2.SupportPoint( vec3.create(), vec3.create(), vec3.create(), vec3.create() ); } );
Goblin.ObjectPool.registerType( 'ConstraintRow', function() { return new Goblin.ConstraintRow(); } );
Goblin.ObjectPool.registerType( 'ContactConstraint', function() { return new Goblin.ContactConstraint(); } );
Goblin.ObjectPool.registerType( 'FrictionConstraint', function() { return new Goblin.FrictionConstraint(); } );
Goblin.ObjectPool.registerType( 'RayIntersection', function() { return new Goblin.RayIntersection(); } );
Goblin.ObjectPool.registerType( 'RigidBodyProxy', function() { return new Goblin.RigidBodyProxy(); } );
Goblin.RayIntersection = function() {
	this.object = null;
	this.point = vec3.create();
	this.t = null;
};
/**
 * Represents a rigid body
 *
 * @class RigidBody
 * @constructor
 * @param shape
 * @param mass {Number}
 */
Goblin.RigidBody = (function() {
	var body_count = 0;

	return function( shape, mass ) {
		/**
		 * goblin ID of the body
		 *
		 * @property id
		 * @type {Number}
		 */
		this.id = body_count++;

		/**
		 * shape definition for this rigid body
		 *
		 * @property shape
		 */
		this.shape = shape;

        /**
         * axis-aligned bounding box enclosing this body
         *
         * @property aabb
         * @type {AABB}
         */
        this.aabb = new Goblin.AABB();

		/**
		 * the rigid body's mass
		 *
		 * @property mass
		 * @type {Number}
		 * @default Infinity
		 */
		this.mass = mass || Infinity;

		/**
		 * the rigid body's current position
		 *
		 * @property position
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.position = vec3.create();

		/**
		 * rotation of the rigid body
		 *
		 * @type {quat4}
		 */
		this.rotation = quat4.createFrom( 0, 0, 0, 1 );

		/**
		 * the rigid body's current linear velocity
		 *
		 * @property linear_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_velocity = vec3.create();

		/**
		 * the rigid body's current angular velocity
		 *
		 * @property angular_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_velocity = vec3.create();

		/**
		 * transformation matrix transforming points from object space to world space
		 *
		 * @property transform
		 * @type {mat4}
		 */
		this.transform = mat4.identity();

		/**
		 * transformation matrix transforming points from world space to object space
		 *
		 * @property transform_inverse
		 * @type {mat4}
		 */
		this.transform_inverse = mat4.identity();

		this.inertiaTensor = shape.getInertiaTensor( mass );

		this.inverseInertiaTensor = mat3.inverse( this.inertiaTensor );

		this.inertiaTensorWorldFrame = mat3.create();

		this.inverseInertiaTensorWorldFrame = mat3.create();

		/**
		 * the rigid body's current acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.acceleration = vec3.create();

		/**
		 * amount of linear damping to apply to the rigid body's velocity
		 *
		 * @property linear_damping
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_damping = vec3.createFrom( 0, 0, 0 );

		/**
		 * amount of angular damping to apply to the rigid body's rotation
		 *
		 * @property angular_damping
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_damping = vec3.createFrom( 0, 0, 0 );

		/**
		 * amount of restitution this object has
		 *
		 * @property restitution
		 * @type {Number}
		 * @default 0.05
		 */
		this.restitution = 0.05;

		/**
		 * amount of friction this object has
		 *
		 * @property friction
		 * @type {Number}
		 * @default 0.5
		 */
		this.friction = 0.5;

		/**
		 * the rigid body's custom gravity
		 *
		 * @property gravity
		 * @type {vec3}
		 * @default null
		 * @private
		 */
		this.gravity = null;

		/**
		 * the world to which the rigid body has been added,
		 * this is set when the rigid body is added to a world
		 *
		 * @property world
		 * @type {Goblin.World}
		 * @default null
		 */
		this.world = null;

		/**
		 * all resultant force accumulated by the rigid body
		 * this force is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_force = vec3.create();

		/**
		 * All resultant torque accumulated by the rigid body
		 * this torque is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_torque = vec3.create();

		// Used by the constraint solver to determine what impulse needs to be added to the body
		this.push_velocity = vec3.create();
		this.turn_velocity = vec3.create();
		this.solver_impulse = new Float64Array( 6 );

		// Set default derived values
		this.updateDerived();
	};
})();

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.RigidBody.prototype.findSupportPoint = (function(){
	var local_direction = vec3.create();

	return function( direction, support_point ) {
		// Convert direction into local frame for the shape
		// cells 12-14 are the position offset which we don't want to use for changing the direction vector
		var x = this.transform_inverse[12],
			y = this.transform_inverse[13],
			z = this.transform_inverse[14];
		this.transform_inverse[12] = this.transform_inverse[13] = this.transform_inverse[14] = 0;

		// Apply rotation
		mat4.multiplyVec3( this.transform_inverse, direction, local_direction );

		// Reset transform
		this.transform_inverse[12] = x;
		this.transform_inverse[13] = y;
		this.transform_inverse[14] = z;

		this.shape.findSupportPoint( local_direction, support_point );

		// Convert from the shape's local coordinates to world coordinates
		mat4.multiplyVec3( this.transform, support_point );
	};
})();

/**
 * Checks if a ray segment intersects with the object
 *
 * @method rayIntersect
 * @property ray_start {vec3} start point of the segment
 * @property ray_end {vec3{ end point of the segment
 * @property intersection_list {Array} array to append intersection to
 */
Goblin.RigidBody.prototype.rayIntersect = (function(){
	var local_start = vec3.create(),
		local_end = vec3.create();

	return function( ray_start, ray_end, intersection_list ) {
		// transform start & end into local coordinates
		mat4.multiplyVec3( this.transform_inverse, ray_start, local_start );
		mat4.multiplyVec3( this.transform_inverse, ray_end, local_end );

		// Intersect with shape
		var intersection = this.shape.rayIntersect( local_start, local_end );

		if ( intersection != null ) {
			intersection.object = this; // change from the shape to the body
			mat4.multiplyVec3( this.transform, intersection.point ); // transform shape's local coordinates to the body's world coordinates
			intersection_list.push( intersection );
		}
	};
})();

/**
 * Updates the rigid body's position, velocity, and acceleration
 *
 * @method integrate
 * @param timestep {Number} time, in seconds, to use in integration
 */
Goblin.RigidBody.prototype.integrate = function( timestep ) {
	if ( this.mass === Infinity ) {
		return;
	}

	var invmass = 1 / this.mass;

	// Add accumulated linear force
	vec3.scale( this.accumulated_force, invmass, _tmp_vec3_1 );
	vec3.add( this.linear_velocity, _tmp_vec3_1 );

	// Add accumulated angular force
	mat3.multiplyVec3 ( this.inverseInertiaTensorWorldFrame, this.accumulated_torque, _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, timestep );
	vec3.add( this.angular_velocity, _tmp_vec3_1 );

	// Apply damping
	this.linear_velocity[0] *= 1 / ( 1 + timestep * this.linear_damping[0] );
	this.linear_velocity[1] *= 1 / ( 1 + timestep * this.linear_damping[1] );
	this.linear_velocity[2] *= 1 / ( 1 + timestep * this.linear_damping[2] );
	this.angular_velocity[0] *= 1 / ( 1 + timestep * this.angular_damping[0] );
	this.angular_velocity[1] *= 1 / ( 1 + timestep * this.angular_damping[1] );
	this.angular_velocity[2] *= 1 / ( 1 + timestep * this.angular_damping[2] );

	// Update position
	vec3.scale( this.linear_velocity, timestep, _tmp_vec3_1 );
	vec3.add( this.position, _tmp_vec3_1 );

	// Update rotation
	_tmp_quat4_1[0] = this.angular_velocity[0];
	_tmp_quat4_1[1] = this.angular_velocity[1];
	_tmp_quat4_1[2] = this.angular_velocity[2];
	_tmp_quat4_1[3] = 0;

	quat4.multiply( _tmp_quat4_1, this.rotation );

	var half_dt = timestep * 0.5;
	this.rotation[0] += half_dt * _tmp_quat4_1[0];
	this.rotation[1] += half_dt * _tmp_quat4_1[1];
	this.rotation[2] += half_dt * _tmp_quat4_1[2];
	this.rotation[3] += half_dt * _tmp_quat4_1[3];
	quat4.normalize( this.rotation );

	// Clear accumulated forces
	this.accumulated_force[0] = this.accumulated_force[1] = this.accumulated_force[2] = 0;
	this.accumulated_torque[0] = this.accumulated_torque[1] = this.accumulated_torque[2] = 0;
	this.solver_impulse[0] = this.solver_impulse[1] = this.solver_impulse[2] = this.solver_impulse[3] = this.solver_impulse[4] = this.solver_impulse[5] = 0;
	this.push_velocity[0] = this.push_velocity[1] = this.push_velocity[2] = 0;
	this.turn_velocity[0] = this.turn_velocity[1] = this.turn_velocity[2] = 0;
};

/**
 * Sets a custom gravity value for this rigid_body
 *
 * @method setGravity
 * @param x {Number} gravity to apply on x axis
 * @param y {Number} gravity to apply on y axis
 * @param z {Number} gravity to apply on z axis
 */
Goblin.RigidBody.prototype.setGravity = function( x, y, z ) {
	if ( this.gravity ) {
		this.gravity[0] = x;
		this.gravity[1] = y;
		this.gravity[2] = z;
	} else {
		this.gravity = vec3.createFrom( x, y, z );
	}
};

/**
 * Adds a force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyForce = function( force ) {
	vec3.add( this.accumulated_force, force );
};

/**
 * Applies the vector `force` at world coordinate `point`
 *
 * @method applyForceAtWorldPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} world coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtWorldPoint = function( force, point ) {
	var _vec3 = _tmp_vec3_1;
	vec3.set( point, _vec3 );
	vec3.subtract( _vec3, this.position );
	vec3.cross( _vec3, force );

	vec3.add( this.accumulated_force, force );
	vec3.add( this.accumulated_torque, _vec3 );
};

/**
 * Applies vector `force` to body at position `point` in body's frame
 *
 * @method applyForceAtLocalPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} local frame coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtLocalPoint = function( force, point ) {
	var _vec3 = _tmp_vec3_1;
	mat4.multiplyVec3( this.transform, point, _vec3 );
	this.applyForceAtWorldPoint( force, _vec3 );
};

/**
 * Sets the rigid body's transformation matrix to the current position and rotation
 *
 * @method updateDerived
 */
Goblin.RigidBody.prototype.updateDerived = function() {
	// normalize rotation
	quat4.normalize( this.rotation );

	// update this.transform and this.transform_inverse
	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	// update this.inverseInertiaTensorWorldFrame
	if ( this.mass !== Infinity ) {
		this.updateInverseInertiaTensorWorldFrame();
	}

	// Update AABB
	this.aabb.transform( this.shape.aabb, this.transform );
};

Goblin.RigidBody.prototype.updateInverseInertiaTensorWorldFrame = function() {
	var rotmat = this.transform,
		iitWorld = this.inverseInertiaTensorWorldFrame,
		iitBody = this.inverseInertiaTensor,
		q = this.rotation;

	var t4 = rotmat[0]*iitBody[0]+
		rotmat[1]*iitBody[3]+
		rotmat[2]*iitBody[6];
	var t9 = rotmat[0]*iitBody[1]+
		rotmat[1]*iitBody[4]+
		rotmat[2]*iitBody[7];
	var t14 = rotmat[0]*iitBody[2]+
		rotmat[1]*iitBody[5]+
		rotmat[2]*iitBody[8];
	var t28 = rotmat[4]*iitBody[0]+
		rotmat[5]*iitBody[3]+
		rotmat[6]*iitBody[6];
	var t33 = rotmat[4]*iitBody[1]+
		rotmat[5]*iitBody[4]+
		rotmat[6]*iitBody[7];
	var t38 = rotmat[4]*iitBody[2]+
		rotmat[5]*iitBody[5]+
		rotmat[6]*iitBody[8];
	var t52 = rotmat[8]*iitBody[0]+
		rotmat[9]*iitBody[3]+
		rotmat[10]*iitBody[6];
	var t57 = rotmat[8]*iitBody[1]+
		rotmat[9]*iitBody[4]+
		rotmat[10]*iitBody[7];
	var t62 = rotmat[8]*iitBody[2]+
		rotmat[9]*iitBody[5]+
		rotmat[10]*iitBody[8];
	iitWorld[0] = t4*rotmat[0]+
		t9*rotmat[1]+
		t14*rotmat[2];
	iitWorld[1] = t4*rotmat[4]+
		t9*rotmat[5]+
		t14*rotmat[6];
	iitWorld[2] = t4*rotmat[8]+
		t9*rotmat[9]+
		t14*rotmat[10];
	iitWorld[3] = t28*rotmat[0]+
		t33*rotmat[1]+
		t38*rotmat[2];
	iitWorld[4] = t28*rotmat[4]+
		t33*rotmat[5]+
		t38*rotmat[6];
	iitWorld[5] = t28*rotmat[8]+
		t33*rotmat[9]+
		t38*rotmat[10];
	iitWorld[6] = t52*rotmat[0]+
		t57*rotmat[1]+
		t62*rotmat[2];
	iitWorld[7] = t52*rotmat[4]+
		t57*rotmat[5]+
		t62*rotmat[6];
	iitWorld[8] = t52*rotmat[8]+
		t57*rotmat[9]+
		t62*rotmat[10];

	mat3.inverse( this.inverseInertiaTensorWorldFrame, this.inertiaTensorWorldFrame );
};
Goblin.RigidBodyProxy = function() {
	this.parent = null;
	this.id = null;

	this.shape = null;

	this.aabb = new Goblin.AABB();

	this.mass = null;

	this.position = vec3.create();
	this.rotation = quat4.create();

	this.transform = mat4.create();
	this.transform_inverse = mat4.create();

	this.restitution = null;
	this.friction = null;
};

Goblin.RigidBodyProxy.prototype.setFrom = function( parent, shape_data ) {
	this.parent = parent;

	this.id = parent.id;

	this.shape = shape_data.shape;
	this.shape_data = shape_data;

	this.mass = parent.mass;

	mat4.multiplyVec3( parent.transform, shape_data.position, this.position );
	quat4.multiply( parent.rotation, shape_data.rotation, this.rotation );

	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	this.aabb.transform( this.shape.aabb, this.transform );

	this.restitution = parent.restitution;
	this.friction = parent.friction;
};

Goblin.RigidBodyProxy.prototype.findSupportPoint = Goblin.RigidBody.prototype.findSupportPoint;

Goblin.RigidBodyProxy.prototype.getRigidBody = function() {
	var body = this.parent;
	while ( body.parent ) {
		body = this.parent;
	}
	return body;
};
/**
 * Adapted from BulletPhysics's btSequentialImpulseSolver
 *
 * @class SequentialImpulseSolver
 * @constructor
 */
Goblin.SequentialImpulseSolver = function() {
	/**
	 * Holds contact constraints generated from contact manifolds
	 *
	 * @param contact_constraints
	 * @type {Array}
	 */
	this.contact_constraints = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @param friction_constraints
	 * @type {Array}
	 */
	this.friction_constraints = [];

	/**
	 * array of all constraints being solved
	 * @type {Array}
	 */
	this.constraints = [];

	// Maximum solver iterations per time step
	/**
	 * maximum solver iterations to perforrm
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 * @type {Number}
	 */
	this.relaxation = 1;
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.SequentialImpulseSolver.prototype.processContactManifolds = function( contact_manifolds ) {
	var i, j,
		manifold,
		contacts_length,
		contact,
		constraint;

	this.contact_constraints.length = 0;
	this.friction_constraints.length = 0;

	manifold = contact_manifolds.first;

	i = 0;
	while( manifold ) {
		i++;
		contacts_length = manifold.points.length;

		for ( j = 0; j < contacts_length; j++ ) {
			contact = manifold.points[j];

			//if ( contact.penetration_depth >= -0.02 ) {
				// Build contact constraint
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				this.contact_constraints.push( constraint );

				// Build friction constraint
				constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
				constraint.buildFromContact( contact );
				this.friction_constraints.push( constraint );
			//}
		}

		manifold = manifold.next_manifold;
	}

	// @TODO just for now
	this.constraints = [];
	Array.prototype.push.apply( this.constraints, this.contact_constraints );
	Array.prototype.push.apply( this.constraints, this.friction_constraints );
};

Goblin.SequentialImpulseSolver.prototype.prepareConstraints = function() {
	var num_constraints = this.constraints.length,
		num_rows,
		constraint,
		row,
		i, j;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			row.multiplier = 0;

			row.computeB( constraint ); // Jacobian * objects' inverted mass & inertia tensors
			row.computeD( constraint ); // Length of Jacobian
			row.computeEta( constraint ); // Amount of work needed to be done by this constraint
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.resolveContacts = function( time_step ) {
	var iteration, constraint, row,
		i, delta_impulse, max_impulse = 0;

	// Solve penetrations
	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < this.contact_constraints.length; i++ ) {
			constraint = this.contact_constraints[i];
			row = constraint.rows[0];

			var push_dot_n_a =
				row.jacobian[0] * constraint.object_a.push_velocity[0] +
				row.jacobian[1] * constraint.object_a.push_velocity[1] +
				row.jacobian[2] * constraint.object_a.push_velocity[2] +
				row.jacobian[4] * constraint.object_a.turn_velocity[1] +
				row.jacobian[3] * constraint.object_a.turn_velocity[0] +
				row.jacobian[5] * constraint.object_a.turn_velocity[2];

			var push_dot_n_b =
				row.jacobian[6] * constraint.object_b.push_velocity[0] +
				row.jacobian[7] * constraint.object_b.push_velocity[1] +
				row.jacobian[8] * constraint.object_b.push_velocity[2] +
				row.jacobian[9] * constraint.object_b.turn_velocity[0] +
				row.jacobian[10] * constraint.object_b.turn_velocity[1] +
				row.jacobian[11] * constraint.object_b.turn_velocity[2];

			delta_impulse = ( constraint.contact.penetration_depth - ( push_dot_n_a + push_dot_n_b ) ) / row.D;

			var cache = row.applied_push_impulse;
			row.applied_push_impulse = Math.max(
				row.lower_limit,
				Math.min(
					cache + delta_impulse,
					row.upper_limit
				)
			);
			delta_impulse = row.applied_push_impulse - cache;
			max_impulse = Math.max( max_impulse, delta_impulse );

			constraint.object_a.push_velocity[0] += row.B[0] * delta_impulse;
			constraint.object_a.push_velocity[1] += row.B[1] * delta_impulse;
			constraint.object_a.push_velocity[2] += row.B[2] * delta_impulse;
			constraint.object_a.turn_velocity[0] += row.B[3] * delta_impulse;
			constraint.object_a.turn_velocity[1] += row.B[4] * delta_impulse;
			constraint.object_a.turn_velocity[2] += row.B[5] * delta_impulse;

			constraint.object_b.push_velocity[0] += row.B[6] * delta_impulse;
			constraint.object_b.push_velocity[1] += row.B[7] * delta_impulse;
			constraint.object_b.push_velocity[2] += row.B[8] * delta_impulse;
			constraint.object_b.turn_velocity[0] += row.B[9] * delta_impulse;
			constraint.object_b.turn_velocity[1] += row.B[10] * delta_impulse;
			constraint.object_b.turn_velocity[2] += row.B[11] * delta_impulse;
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}

	// Apply position/rotation solver
	var half_dt = time_step * 0.5;
	for ( i = 0; i < this.contact_constraints.length; i++ ) {
		constraint = this.contact_constraints[i];
		row = constraint.rows[0];

		var multiplier = row.applied_push_impulse;

		if ( constraint.object_a.mass !== Infinity ) {
			_tmp_vec3_1[0] = row.B[0] * multiplier;
			_tmp_vec3_1[1] = row.B[1] * multiplier;
			_tmp_vec3_1[2] = row.B[2] * multiplier;
			vec3.add( constraint.object_a.linear_velocity, _tmp_vec3_1 );
			vec3.scale( _tmp_vec3_1, this.relaxation );
			vec3.add( constraint.object_a.position, _tmp_vec3_1 );

			_tmp_vec3_1[0] = row.B[3] * multiplier;
			_tmp_vec3_1[1] = row.B[4] * multiplier;
			_tmp_vec3_1[2] = row.B[5] * multiplier;
			//vec3.add( constraint.object_a.angular_velocity, _tmp_vec3_1 );

			// Update rotation
			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_a.rotation );

			constraint.object_a.rotation[0] += half_dt * _tmp_quat4_1[0];
			constraint.object_a.rotation[1] += half_dt * _tmp_quat4_1[1];
			constraint.object_a.rotation[2] += half_dt * _tmp_quat4_1[2];
			constraint.object_a.rotation[3] += half_dt * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_a.rotation );
		}

		if ( constraint.object_b.mass !== Infinity ) {
			_tmp_vec3_1[0] = row.B[6] * multiplier;
			_tmp_vec3_1[1] = row.B[7] * multiplier;
			_tmp_vec3_1[2] = row.B[8] * multiplier;
			vec3.add( constraint.object_b.linear_velocity, _tmp_vec3_1 );
			vec3.scale( _tmp_vec3_1, this.relaxation );
			vec3.add( constraint.object_b.position, _tmp_vec3_1 );

			_tmp_vec3_1[0] = row.B[9] * multiplier;
			_tmp_vec3_1[1] = row.B[10] * multiplier;
			_tmp_vec3_1[2] = row.B[11] * multiplier;
			//vec3.add( constraint.object_b.angular_velocity, _tmp_vec3_1 );

			// Update rotation
			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_b.rotation );

			constraint.object_b.rotation[0] += half_dt * _tmp_quat4_1[0];
			constraint.object_b.rotation[1] += half_dt * _tmp_quat4_1[1];
			constraint.object_b.rotation[2] += half_dt * _tmp_quat4_1[2];
			constraint.object_b.rotation[3] += half_dt * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_b.rotation );
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.solveConstraints = function() {
	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j;

	var iteration,
		delta_lambda,
		max_impulse = 0, // Track the largest impulse per iteration; if the impulse is <= EPSILON then early out
		jdot;

	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.constraints[i];

			num_rows = constraint.rows.length;
			for ( j = 0; j < num_rows; j++ ) {

				row = constraint.rows[j];

				// How much does the current solver impulse match this constraint
				jdot = 0;
				if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
					jdot +=
						row.jacobian[0] * constraint.object_a.solver_impulse[0] +
						row.jacobian[1] * constraint.object_a.solver_impulse[1] +
						row.jacobian[2] * constraint.object_a.solver_impulse[2] +
						row.jacobian[3] * constraint.object_a.solver_impulse[3] +
						row.jacobian[4] * constraint.object_a.solver_impulse[4] +
						row.jacobian[5] * constraint.object_a.solver_impulse[5];
				}
				if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
					jdot +=
						row.jacobian[6] * constraint.object_b.solver_impulse[0] +
						row.jacobian[7] * constraint.object_b.solver_impulse[1] +
						row.jacobian[8] * constraint.object_b.solver_impulse[2] +
						row.jacobian[9] * constraint.object_b.solver_impulse[3] +
						row.jacobian[10] * constraint.object_b.solver_impulse[4] +
						row.jacobian[11] * constraint.object_b.solver_impulse[5];
				}
				delta_lambda = ( row.eta - jdot ) / row.D;

				var cache = row.multiplier;
				row.multiplier = Math.max(
					row.lower_limit,
					Math.min(
						cache + delta_lambda,
						row.upper_limit
					)
				);
				delta_lambda = row.multiplier - cache;
				max_impulse = Math.max( max_impulse, delta_lambda );

				if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
					constraint.object_a.solver_impulse[0] += delta_lambda * row.B[0];
					constraint.object_a.solver_impulse[1] += delta_lambda * row.B[1];
					constraint.object_a.solver_impulse[2] += delta_lambda * row.B[2];
					constraint.object_a.solver_impulse[3] += delta_lambda * row.B[3];
					constraint.object_a.solver_impulse[4] += delta_lambda * row.B[4];
					constraint.object_a.solver_impulse[5] += delta_lambda * row.B[5];
				}
				if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
					constraint.object_b.solver_impulse[0] += delta_lambda * row.B[6];
					constraint.object_b.solver_impulse[1] += delta_lambda * row.B[7];
					constraint.object_b.solver_impulse[2] += delta_lambda * row.B[8];
					constraint.object_b.solver_impulse[3] += delta_lambda * row.B[9];
					constraint.object_b.solver_impulse[4] += delta_lambda * row.B[10];
					constraint.object_b.solver_impulse[5] += delta_lambda * row.B[11];
				}
			}
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.applyConstraints = function() {
	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j,
		multiplier;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			multiplier = row.multiplier;

			if ( constraint.object_a.mass !== Infinity ) {
				_tmp_vec3_1[0] = row.B[0] * multiplier;
				_tmp_vec3_1[1] = row.B[1] * multiplier;
				_tmp_vec3_1[2] = row.B[2] * multiplier;
				vec3.add( constraint.object_a.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row.B[3] * multiplier;
				_tmp_vec3_1[1] = row.B[4] * multiplier;
				_tmp_vec3_1[2] = row.B[5] * multiplier;
				vec3.add( constraint.object_a.angular_velocity, _tmp_vec3_1 );
			}

			if ( constraint.object_b.mass !== Infinity ) {
				_tmp_vec3_1[0] = row.B[6] * multiplier;
				_tmp_vec3_1[1] = row.B[7] * multiplier;
				_tmp_vec3_1[2] = row.B[8] * multiplier;
				vec3.add( constraint.object_b.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row.B[9] * multiplier;
				_tmp_vec3_1[1] = row.B[10] * multiplier;
				_tmp_vec3_1[2] = row.B[11] * multiplier;
				vec3.add( constraint.object_b.angular_velocity, _tmp_vec3_1 );
			}
		}
	}
};
/**
 * @class BoxShape
 * @param half_width {Number} half width of the cube ( X axis )
 * @param half_height {Number} half height of the cube ( Y axis )
 * @param half_depth {Number} half depth of the cube ( Z axis )
 * @constructor
 */
Goblin.BoxShape = function( half_width, half_height, half_depth ) {
	/**
	 * Half width of the cube ( X axis )
	 *
	 * @property half_width
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * Half height of the cube ( Y axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

	/**
	 * Half width of the cube ( Z axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_depth = half_depth;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.BoxShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min[0] = -this.half_width;
    aabb.min[1] = -this.half_height;
    aabb.min[2] = -this.half_depth;

    aabb.max[0] = this.half_width;
    aabb.max[1] = this.half_height;
    aabb.max[2] = this.half_depth;
};

Goblin.BoxShape.prototype.getInertiaTensor = function( mass ) {
	var height_squared = this.half_height * this.half_height * 4,
		width_squared = this.half_width * this.half_width * 4,
		depth_squared = this.half_depth * this.half_depth * 4,
		element = 0.0833 * mass;
	return mat3.createFrom(
		element * ( height_squared + depth_squared ), 0, 0,
		0, element * ( width_squared + depth_squared ), 0,
		0, 0, element * ( height_squared + width_squared )
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.BoxShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	support_point = [
		sign( direction.x ) * half_width,
		sign( direction.y ) * half_height,
		sign( direction.z ) * half_depth
	]
	*/

	// Calculate the support point in the local frame
	if ( direction[0] < 0 ) {
		support_point[0] = -this.half_width;
	} else {
		support_point[0] = this.half_width;
	}

	if ( direction[1] < 0 ) {
		support_point[1] = -this.half_height;
	} else {
		support_point[1] = this.half_height;
	}

	if ( direction[2] < 0 ) {
		support_point[2] = -this.half_depth;
	} else {
		support_point[2] = this.half_depth;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.BoxShape.prototype.rayIntersect = (function(){
	var direction = vec3.create(),
		tmin, tmax,
		ood, t1, t2;

	return function( start, end ) {
		tmin = 0;

		vec3.subtract( end, start, direction );
		tmax = vec3.length( direction );
		vec3.scale( direction, 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			var extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );

			if ( Math.abs( direction[i] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[i] < -extent || start[i] > extent ) {
					return null;
				}
			} else {
				ood = 1 / direction[i];
				t1 = ( -extent - start[i] ) * ood;
				t2 = ( extent - start[i] ) * ood;
				if ( t1 > t2 ) {
					ood = t1; // ood is a convenient temp variable as it's not used again
					t1 = t2;
					t2 = ood;
				}

				// Find intersection intervals
				tmin = Math.max( tmin, t1 );
				tmax = Math.min( tmax, t2 );

				if ( tmin > tmax ) {
					return null;
				}
			}
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = tmin;
		vec3.scale( direction, tmin, intersection.point );
		vec3.add( intersection.point, start );

		return intersection;
	};
})();
/**
 * @class CompoundShape
 * @constructor
 */
Goblin.CompoundShape = function() {
	this.child_shapes = [];

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Adds the child shape at `position` and `rotation` relative to the compound shape
 *
 * @method addChildShape
 * @param shape
 * @param position
 * @param rotation
 */
Goblin.CompoundShape.prototype.addChildShape = function( shape, position, rotation ) {
	this.child_shapes.push( new Goblin.CompoundShapeChild( shape, position, rotation ) );
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CompoundShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min[0] = aabb.min[1] = aabb.min[2] = Infinity;
	aabb.max[0] = aabb.max[1] = aabb.max[2] = -Infinity;

	var i, shape,
		shape_aabb = new Goblin.AABB();

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		shape = this.child_shapes[i];

		aabb.min[0] = Math.min( aabb.min[0], shape.aabb.min[0] );
		aabb.min[1] = Math.min( aabb.min[1], shape.aabb.min[1] );
		aabb.min[2] = Math.min( aabb.min[2], shape.aabb.min[2] );

		aabb.max[0] = Math.max( aabb.max[0], shape.aabb.max[0] );
		aabb.max[1] = Math.max( aabb.max[1], shape.aabb.max[1] );
		aabb.max[2] = Math.max( aabb.max[2], shape.aabb.max[2] );
	}
};

Goblin.CompoundShape.prototype.getInertiaTensor = function( mass ) {
	return mat3.createFrom(
		1, 0, 0,
		0, 1, 0,
		0, 0, 1
	);
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CompoundShape.prototype.rayIntersect = function( start, end ) {

};
/**
 * @class CompoundShapeChild
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, position, rotation ) {
	this.shape = shape;

	this.position = vec3.createFrom.apply( vec3, position );
	this.rotation = quat4.createFrom.apply( quat4, rotation );

	this.transform = mat4.create();
	this.transform_inverse = mat4.create();
	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	this.aabb = new Goblin.AABB();
	this.aabb.transform( this.shape.aabb, this.transform );
};
/**
 * @class ConeShape
 * @param radius {Number} radius of the cylinder
 * @param half_height {Number} half height of the cylinder
 * @constructor
 */
Goblin.ConeShape = function( radius, half_height ) {
	/**
	 * radius of the cylinder
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the cylinder
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );

    /**
     * sin of the cone's angle
     *
     * @property _sinagle
     * @type {Number}
     * @private
     */
	this._sinangle = this.radius / Math.sqrt( this.radius * this.radius + Math.pow( 2 * this.half_height, 2 ) );

    /**
     * cos of the cone's angle
     *
     * @property _cosangle
     * @type {Number}
     * @private
     */
    this._cosangle = Math.cos( Math.asin( this._sinangle ) );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.ConeShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min[0] = aabb.min[2] = -this.radius;
    aabb.min[1] = -this.half_height;

    aabb.max[0] = aabb.max[2] = this.radius;
    aabb.max[1] = this.half_height;
};

Goblin.ConeShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.1 * mass * Math.pow( this.half_height * 2, 2 ) + 0.15 * mass * this.radius * this.radius;

	return mat3.createFrom(
		element, 0, 0,
		0, 0.3 * mass * this.radius * this.radius, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.ConeShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	 support_point = [

	 ]
	 */

	// Calculate the support point in the local frame
	//var w = direction - ( direction[1] )
	var sigma = Math.sqrt( direction[0] * direction[0] + direction[2] * direction[2] );

	if ( direction[1] > vec3.length( direction ) * this._sinangle ) {
		support_point[0] = support_point[2] = 0;
		support_point[1] = this.half_height;
	} else if ( sigma > 0 ) {
		var r_s = this.radius / sigma;
		support_point[0] = r_s * direction[0];
		support_point[1] = -this.half_height;
		support_point[2] = r_s * direction[2];
	} else {
		support_point[0] = support_point[2] = 0;
		support_point[1] = -this.half_height;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.ConeShape.prototype.rayIntersect = (function(){
    var direction = vec3.create(),
        length,
        p1 = vec3.create(),
        p2 = vec3.create();

    return function( start, end ) {
        vec3.subtract( end, start, direction );
        length = vec3.length( direction );
        vec3.scale( direction, 1 / length ); // normalize direction

        var t1, t2;

        // Check for intersection with cone base
		p1[0] = p1[1] = p1[2] = 0;
        t1 = this._rayIntersectBase( start, end, p1 );

        // Check for intersection with cone shape
		p2[0] = p2[1] = p2[2] = 0;
        t2 = this._rayIntersectCone( start, direction, length, p2 );

        var intersection;

        if ( !t1 && !t2 ) {
            return null;
        } else if ( !t2 || ( t1 &&  t1 < t2 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t1;
            vec3.set( p1, intersection.point );
            return intersection;
        } else if ( !t1 || ( t2 && t2 < t1 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t2;
            vec3.set( p2, intersection.point );
            return intersection;
        }

        return null;
    };
})();

Goblin.ConeShape.prototype._rayIntersectBase = (function(){
    var normal = vec3.createFrom( 0, -1, 0 ),
        ab = vec3.create(),
        _start = vec3.create(),
        _end = vec3.create(),
        t;

    return function( start, end, point ) {
        _start[0] = start[0];
        _start[1] = start[1] + this.half_height;
        _start[2] = start[2];

        _end[0] = end[0];
        _end[1] = end[1] + this.half_height;
        _end[2] = end[2];

        vec3.subtract( _end, _start, ab );
        t = -vec3.dot( normal, _start ) / vec3.dot( normal, ab );

        if ( t < 0 || t > 1 ) {
            return null;
        }

        vec3.scale( ab, t, point );
        vec3.add( point, start );

        if ( point[0] * point[0] + point[2] * point[2] > this.radius * this.radius ) {
            return null;
        }

        return t;
    };
})();

/**
 * Checks if a ray segment intersects with the cone definition
 *
 * @method _rayIntersectCone
 * @property start {vec3} start point of the segment
 * @property direction {vec3} normalized direction vector of the segment, from `start`
 * @property length {Number} segment length
 * @property point {vec3} (out) location of intersection
 * @private
 * @return {vec3|null} if the segment intersects, point where the segment intersects the cone, else `null`
 */
Goblin.ConeShape.prototype._rayIntersectCone = (function(){
    var _point = vec3.create();

    return function( start, direction, length, point ) {
        var A = vec3.createFrom( 0, -1, 0 );

        var AdD = vec3.dot( A, direction ),
            cosSqr = this._cosangle * this._cosangle;

        var E = vec3.create();
        E[0] = start[0];
        E[1] = start[1] - this.half_height;
        E[2] = start[2];

        var AdE = vec3.dot( A, E ),
            DdE = vec3.dot( direction, E ),
            EdE = vec3.dot( E, E ),
            c2 = AdD * AdD - cosSqr,
            c1 = AdD * AdE - cosSqr * DdE,
            c0 = AdE * AdE - cosSqr * EdE,
            dot, t, tmin = null;

        if ( Math.abs( c2 ) >= Goblin.EPSILON ) {
            var discr = c1 * c1 - c0 * c2;
			if ( discr < -Goblin.EPSILON ) {
                return null;
            } else if ( discr > Goblin.EPSILON ) {
                var root = Math.sqrt( discr ),
                    invC2 = 1 / c2;

                t = ( -c1 - root ) * invC2;
                if ( t >= 0 && t <= length ) {
                    vec3.scale( direction, t, _point );
                    vec3.add( _point, start );
                    E[1] = _point[1] - this.half_height;
                    dot = vec3.dot( E, A );
                    if ( dot >= 0 ) {
                        tmin = t;
                        vec3.set( _point, point );
                    }
                }

                t = ( -c1 + root ) * invC2;
                if ( t >= 0 && t <= length ) {
                    if ( tmin == null || t < tmin ) {
                        vec3.scale( direction, t, _point );
                        vec3.add( _point, start );
                        E[1] = _point[1] - this.half_height;
                        dot = vec3.dot( E, A );
                        if ( dot >= 0 ) {
                            tmin = t;
                            vec3.set( _point, point );
                        }
                    }
                }

                if ( tmin == null ) {
                    return null;
                }
                tmin /= length;
            } else {
                t = -c1 / c2;
                vec3.scale( direction, t, _point );
                vec3.add( _point, start );
                E[1] = _point[1] - this.half_height;
                dot = vec3.dot( E, A );
                if ( dot < 0 ) {
                    return null;
                }

                // Verify segment reaches _point
                vec3.subtract( _point, start, _tmp_vec3_1 );
                if ( vec3.squaredLength( _tmp_vec3_1 ) > length * length ) {
                    return null;
                }

                tmin = t / length;
                vec3.set( _point, point );
            }
        } else if ( Math.abs( c1 ) >= Goblin.EPSILON ) {
            t = 0.5 * c0 / c1;
            vec3.scale( direction, t, _point );
            vec3.add( _point, start );
            E[1] = _point[1] - this.half_height;
            dot = vec3.dot( E, A );
            if ( dot < 0 ) {
                return null;
            }
            tmin = t;
            vec3.set( _point, point );
        } else {
            return null;
        }

        if ( point[1] < -this.half_height ) {
            return null;
        }

        return tmin;
    };
})();
/**
 * @class CylinderShape
 * @param radius {Number} radius of the cylinder
 * @param half_height {Number} half height of the cylinder
 * @constructor
 */
Goblin.CylinderShape = function( radius, half_height ) {
	/**
	 * radius of the cylinder
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the cylinder
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CylinderShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min[0] = aabb.min[2] = -this.radius;
    aabb.min[1] = -this.half_height;

    aabb.max[0] = aabb.max[2] = this.radius;
    aabb.max[1] = this.half_height;
};

Goblin.CylinderShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.0833 * mass * ( 3 * this.radius * this.radius + ( this.half_height + this.half_height ) * ( this.half_height + this.half_height ) );

	return mat3.createFrom(
		element, 0, 0,
		0, 0.5 * mass * this.radius * this.radius, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.CylinderShape.prototype.findSupportPoint = function( direction, support_point ) {
	// Calculate the support point in the local frame
	if ( direction[1] < 0 ) {
		support_point[1] = -this.half_height;
	} else {
		support_point[1] = this.half_height;
	}

	if ( direction[0] === 0 && direction[2] === 0 ) {
		support_point[0] = support_point[2] = 0;
	} else {
		var sigma = Math.sqrt( direction[0] * direction[0] + direction[2] * direction[2] ),
			r_s = this.radius / sigma;
		support_point[0] = r_s * direction[0];
		support_point[2] = r_s * direction[2];
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CylinderShape.prototype.rayIntersect = (function(){
	var p = vec3.create(),
		q = vec3.create();

	return function ( start, end ) {
		p[1] = this.half_height;
		q[1] = -this.half_height;

		var d = vec3.create();
		vec3.subtract( q, p, d );

		var m = vec3.create();
		vec3.subtract( start, p, m );

		var n = vec3.create();
		vec3.subtract( end, start, n );

		var md = vec3.dot( m, d ),
			nd = vec3.dot( n, d ),
			dd = vec3.dot( d, d );

		// Test if segment fully outside either endcap of cylinder
		if ( md < 0 && md + nd < 0 ) {
			return null; // Segment outside 'p' side of cylinder
		}
		if ( md > dd && md + nd > dd ) {
			return null; // Segment outside 'q' side of cylinder
		}

		var nn = vec3.dot( n, n ),
			mn = vec3.dot( m, n ),
			a = dd * nn - nd * nd,
			k = vec3.dot( m, m ) - this.radius * this.radius,
			c = dd * k - md * md,
			t, t0;

		if ( Math.abs( a ) < Goblin.EPSILON ) {
			// Segment runs parallel to cylinder axis
			if ( c > 0 ) {
				return null; // 'a' and thus the segment lie outside cylinder
			}

			// Now known that segment intersects cylinder; figure out how it intersects
			if ( md < 0 ) {
				t = -mn / nn; // Intersect segment against 'p' endcap
			} else if ( md > dd ) {
				t = (nd - mn) / nn; // Intersect segment against 'q' endcap
			} else {
				t = 0; // 'a' lies inside cylinder
			}
		} else {
			var b = dd * mn - nd * md,
				discr = b * b - a * c;

			if ( discr < 0 ) {
				return null; // No real roots; no intersection
			}

			t0 = t = ( -b - Math.sqrt( discr ) ) / a;

			if ( md + t * nd < 0 ) {
				// Intersection outside cylinder on 'p' side
				if ( nd <= 0 ) {
					return null; // Segment pointing away from endcap
				}
				t = -md / nd;
				// Keep intersection if Dot(S(t) - p, S(t) - p) <= r^2
				if ( k + t * ( 2 * mn + t * nn ) <= 0 ) {
					t0 = t;
				}
			} else if ( md + t * nd > dd ) {
				// Intersection outside cylinder on 'q' side
				if ( nd >= 0 ) {
					return null; // Segment pointing away from endcap
				}
				t = ( dd - md ) / nd;
				// Keep intersection if Dot(S(t) - q, S(t) - q) <= r^2
				if ( k + dd - 2 * md + t * ( 2 * ( mn - nd ) + t * nn ) <= 0 ) {
					t0 = t;
				}
			}
			t = t0;

			// Intersection if segment intersects cylinder between the end-caps
			if ( t < 0 || t > 1 ) {
				return null;
			}
		}

		// Segment intersects cylinder between the endcaps; t is correct
		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t;
		vec3.scale( n, t, intersection.point );
		vec3.add( intersection.point, start );

		return intersection;
	};
})();
/**
 * @class PlaneShape
 * @param orientation {Number} index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
 * @param half_width {Number} half width of the plane
 * @param half_length {Number} half height of the plane
 * @constructor
 */
Goblin.PlaneShape = function( orientation, half_width, half_length ) {
	/**
	 * index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
	 * when 0, width is Y and length is Z
	 * when 1, width is X and length is Z
	 * when 2, width is X and length is Y
	 *
	 * @property half_width
	 * @type {Number}
	 */
	this.orientation = orientation;

	/**
	 * half width of the plane
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * half length of the plane
	 *
	 * @property half_length
	 * @type {Number}
	 */
	this.half_length = half_length;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );


	if ( this.orientation === 0 ) {
		this._half_width = 0;
		this._half_height = this.half_width;
		this._half_depth = this.half_length;
	} else if ( this.orientation === 1 ) {
		this._half_width = this.half_width;
		this._half_height = 0;
		this._half_depth = this.half_length;
	} else {
		this._half_width = this.half_width;
		this._half_height = this.half_length;
		this._half_depth = 0;
	}
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.PlaneShape.prototype.calculateLocalAABB = function( aabb ) {
    if ( this.orientation === 0 ) {
        this._half_width = 0;
        this._half_height = this.half_width;
        this._half_depth = this.half_length;

        aabb.min[0] = 0;
        aabb.min[1] = -this.half_width;
        aabb.min[2] = -this.half_length;

        aabb.max[0] = 0;
        aabb.max[1] = this.half_width;
        aabb.max[2] = this.half_length;
    } else if ( this.orientation === 1 ) {
        this._half_width = this.half_width;
        this._half_height = 0;
        this._half_depth = this.half_length;

        aabb.min[0] = -this.half_width;
        aabb.min[1] = 0;
        aabb.min[2] = -this.half_length;

        aabb.max[0] = this.half_width;
        aabb.max[1] = 0;
        aabb.max[2] = this.half_length;
    } else {
        this._half_width = this.half_width;
        this._half_height = this.half_length;
        this._half_depth = 0;

        aabb.min[0] = -this.half_width;
        aabb.min[1] = -this.half_length;
        aabb.min[2] = 0;

        aabb.max[0] = this.half_width;
        aabb.max[1] = this.half_length;
        aabb.max[2] = 0;
    }
};

Goblin.PlaneShape.prototype.getInertiaTensor = function( mass ) {
	var width_squared = this.half_width * this.half_width * 4,
		length_squared = this.half_length * this.half_length * 4,
		element = 0.0833 * mass,

		x = element * length_squared,
		y = element * ( width_squared + length_squared ),
		z = element * width_squared;

	if ( this.orientation === 0 ) {
		return mat3.createFrom(
			y, 0, 0,
			0, x, 0,
			0, 0, z
		);
	} else if ( this.orientation === 1 ) {
		return mat3.createFrom(
			x, 0, 0,
			0, y, 0,
			0, 0, z
		);
	} else {
		return mat3.createFrom(
			y, 0, 0,
			0, z, 0,
			0, 0, x
		);
	}
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.PlaneShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	 support_point = [
	 sign( direction.x ) * _half_width,
	 sign( direction.y ) * _half_height,
	 sign( direction.z ) * _half_depth
	 ]
	 */

	// Calculate the support point in the local frame
	if ( direction[0] < 0 ) {
		support_point[0] = -this._half_width;
	} else {
		support_point[0] = this._half_width;
	}

	if ( direction[1] < 0 ) {
		support_point[1] = -this._half_height;
	} else {
		support_point[1] = this._half_height;
	}

	if ( direction[2] < 0 ) {
		support_point[2] = -this._half_depth;
	} else {
		support_point[2] = this._half_depth;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.PlaneShape.prototype.rayIntersect = (function(){
	var normal = vec3.create(),
		ab = vec3.create(),
		point = vec3.create(),
		t;

	return function( start, end ) {
		if ( this.orientation === 0 ) {
			normal[0] = 1;
			normal[1] = normal[2] = 0;
		} else if ( this.orientation === 1 ) {
			normal[1] = 1;
			normal[0] = normal[2] = 0;
		} else {
			normal[2] = 1;
			normal[0] = normal[1] = 0;
		}

		vec3.subtract( end, start, ab );
		t = -vec3.dot( normal, start ) / vec3.dot( normal, ab );

		if ( t < 0 || t > 1 ) {
			return null;
		}

		vec3.scale( ab, t, point );
		vec3.add( point, start );

		if ( point[0] < -this._half_width || point[0] > this._half_width ) {
			return null;
		}

		if ( point[1] < -this._half_height || point[1] > this._half_height ) {
			return null;
		}

		if ( point[2] < -this._half_depth || point[2] > this._half_depth ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t;
		vec3.set( point, intersection.point );

		return intersection;
	};
})();
/**
 * @class SphereShape
 * @param radius {Number} sphere radius
 * @constructor
 */
Goblin.SphereShape = function( radius ) {
	this.radius = radius;

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.SphereShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min[0] = aabb.min[1] = aabb.min[2] = -this.radius;
	aabb.max[0] = aabb.max[1] = aabb.max[2] = this.radius;
};

Goblin.SphereShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.4 * mass * this.radius * this.radius;
	return mat3.createFrom(
		element, 0, 0,
		0, element, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.SphereShape.prototype.findSupportPoint = (function(){
	var temp = vec3.create();
	return function( direction, support_point ) {
		vec3.normalize( direction, temp );
		vec3.scale( temp, this.radius, support_point );
	};
})();

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.SphereShape.prototype.rayIntersect = (function(){
	var direction = vec3.create(),
		length;

	return function( start, end ) {
		vec3.subtract( end, start, direction );
		length = vec3.length( direction );
		vec3.scale( direction, 1 / length ); // normalize direction

		var a = vec3.dot( start, direction ),
			b = vec3.dot( start, start ) - this.radius * this.radius;

		// if ray starts outside of sphere and points away, exit
		if ( a >= 0 && b >= 0 ) {
			return null;
		}

		var discr = a * a - b;

		// Check for ray miss
		if ( discr < 0 ) {
			return null;
		}

		// ray intersects, find closest intersection point
		var discr_sqrt = Math.sqrt( discr ),
			t = -a - discr_sqrt;
		if ( t < 0 ) {
			t = -a + discr_sqrt;
		}

		// verify the segment intersects
		if ( t > length ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		vec3.scale( direction, t, intersection.point );
		intersection.t = t;
		vec3.add( intersection.point, start );

		return intersection;
	};
})();
/**
 * Manages the physics simulation
 *
 * @class World
 * @param broadphase {Goblin.Broadphase} the broadphase used by the world to find possible contacts
 * @param nearphase {Goblin.NearPhase} the nearphase used by the world to generate valid contacts
 * @constructor
 */
Goblin.World = function( broadphase, nearphase, solver ) {
	/**
	 * How many time steps have been simulated. If the steps are always the same length then total simulation time = world.ticks * time_step
	 *
	 * @property ticks
	 * @type {number}
	 */
	this.ticks = 0;

	/**
	 * The broadphase used by the world to find possible contacts
	 *
	 * @property broadphase
	 * @type {Goblin.Broadphase}
	 */
	this.broadphase = broadphase;

	/**
	 * The nearphase used by the world to generate valid contacts
	 *
	 * @property nearphasee
	 * @type {Goblin.NearPhase}
	 */
	this.nearphase = nearphase;

	/**
	 * The contact solver used by the world to calculate and apply impulses resulting from contacts
	 *
	 * @property solver
	 */
	this.solver = solver;

	/**
	 * Array of mass_points in the world
	 *
	 * @property mass_points
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.mass_points = [];

	/**
	 * Array of rigid_bodies in the world
	 *
	 * @property rigid_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.rigid_bodies = [];

	/**
	* the world's gravity, applied by default to all objects in the world
	*
	* @property gravity
	* @type {vec3}
	* @default [ 0, -9.8, 0 ]
	*/
	this.gravity = vec3.createFrom( 0, -9.8, 0 );

	/**
	 * array of force generators in the world
	 *
	 * @property force_generators
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.force_generators = [];

	/**
	 * array of constraints in the world
	 *
	 * @property constraints
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.constraints = [];
};
/**
* Steps the physics simulation according to the time delta
*
* @method step
* @param time_delta {Number} amount of time to simulate, in seconds
* @param [max_step] {Number} maximum time step size, in seconds
*/
Goblin.World.prototype.step = function( time_delta, max_step ) {
    max_step = max_step || time_delta;

	var x, delta, time_loops,
        i, loop_count, body;

    time_loops = time_delta / max_step;
    for ( x = 0; x < time_loops; x++ ) {
		this.ticks++;
        delta = Math.min( max_step, time_delta );
        time_delta -= max_step;

        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            this.rigid_bodies[i].updateDerived();
        }

        // Apply gravity
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];

            // Objects of infinite mass don't move
            if ( body.mass !== Infinity ) {
                vec3.scale( body.gravity || this.gravity, body.mass * delta, _tmp_vec3_1 );
                vec3.add( body.accumulated_force, _tmp_vec3_1 );
            }
        }

        // Apply force generators
        for ( i = 0, loop_count = this.force_generators.length; i < loop_count; i++ ) {
            this.force_generators[i].applyForce();
        }

        // Check for contacts, broadphase
        this.broadphase.predictContactPairs();

        // Find valid contacts, nearphase
        this.nearphase.generateContacts( this.broadphase.collision_pairs );

        // Process contact manifolds into contact and friction constraints
        this.solver.processContactManifolds( this.nearphase.contact_manifolds );

        // Prepare the constraints by precomputing some values
        this.solver.prepareConstraints();

        // Resolve contacts
        this.solver.resolveContacts( delta );

        // Run the constraint solver
        this.solver.solveConstraints();

        // Apply the constraints
        this.solver.applyConstraints();

        // Integrate rigid bodies
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];
            body.integrate( delta );
        }
    }
};

/**
 * Adds a rigid body to the world
 *
 * @method addRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to add to the world
 */
Goblin.World.prototype.addRigidBody = function( rigid_body ) {
	rigid_body.world = this;
	this.rigid_bodies.push( rigid_body );
	this.broadphase.addBody( rigid_body );
};

/**
 * Removes a rigid body from the world
 *
 * @method removeRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to remove from the world
 */
Goblin.World.prototype.removeRigidBody = function( rigid_body ) {
	var i,
		rigid_body_count = this.rigid_bodies.length;

	for ( i = 0; i < rigid_body_count; i++ ) {
		if ( this.rigid_bodies[i] === rigid_body ) {
			this.rigid_bodies.splice( i, 1 );
			this.broadphase.removeBody( rigid_body );
			break;
		}
	}
};

/**
 * Adds a force generator to the world
 *
 * @method addForceGenerator
 * @param force_generator {Goblin.ForceGenerator} force generator object to be added
 */
Goblin.World.prototype.addForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	// Make sure this generator isn't already in the world
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			return;
		}
	}

	this.force_generators.push( force_generator );
};

/**
 * removes a force generator from the world
 *
 * @method removeForceGenerator
 * @param force_generatorv {Goblin.ForceGenerator} force generator object to be removed
 */
Goblin.World.prototype.removeForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			this.force_generators.splice( i, 1 );
			return;
		}
	}
};

/**
 * adds a constraint to the world
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint object to be added
 */
Goblin.World.prototype.addConstraint = function( constraint ) {
	var i, constraints_count;
	// Make sure this constraint isn't already in the world
	for ( i = 0, constraints_count = this.constraints.length; i < constraints_count; i++ ) {
		if ( this.constraints[i] === constraint ) {
			return;
		}
	}

	constraint.world = this;
	this.constraints.push( constraint );
};

/**
 * removes a constraint from the world
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint object to be removed
 */
Goblin.World.prototype.removeConstraint = function( constraint ) {
	var i, constraints_count;
	for ( i = 0, constraints_count = this.constraints.length; i < constraints_count; i++ ) {
		if ( this.constraints[i] === constraint ) {
			this.constraints.splice( i, 1 );
			return;
		}
	}
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {Array<RayIntersection>} an array of intersections, sorted by distance from `start`
 */
Goblin.World.prototype.rayIntersect = (function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
		}
	};
	return function( start, end ) {
		var intersections = this.broadphase.rayIntersect( start, end );
		intersections.sort( tSort );
		return intersections;
	};
})();
	return Goblin;
})();