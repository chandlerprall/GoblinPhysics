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

			if ( object_a._mass === Infinity && object_b._mass === Infinity ) {
				// Two static objects aren't considered to be in contact
				continue;
			}

			// Check collision masks
			if ( object_a.collision_mask !== 0 ) {
				if ( ( object_a.collision_mask & 1 ) === 0 ) {
					// object_b must not be in a matching group
					if ( ( object_a.collision_mask & object_b.collision_groups ) !== 0 ) {
						continue;
					}
				} else {
					// object_b must be in a matching group
					if ( ( object_a.collision_mask & object_b.collision_groups ) === 0 ) {
						continue;
					}
				}
			}
			if ( object_b.collision_mask !== 0 ) {
				if ( ( object_b.collision_mask & 1 ) === 0 ) {
					// object_a must not be in a matching group
					if ( ( object_b.collision_mask & object_a.collision_groups ) !== 0 ) {
						continue;
					}
				} else {
					// object_a must be in a matching group
					if ( ( object_b.collision_mask & object_a.collision_groups ) === 0 ) {
						continue;
					}
				}
			}

			if ( this.mightIntersect( object_a, object_b ) ) {
				this.collision_pairs.push( [ object_a, object_b ] );
			}
		}
	}
};

/**
 * Returns an of objects the given body may be colliding with
 *
 * @method intersectsWith
 * @param object_a {RigidBody}
 * @return Array<RigidBody>
 */
Goblin.BasicBroadphase.prototype.intersectsWith = function( object_a ) {
	var i, object_b,
		bodies_count = this.bodies.length,
		intersections = [];

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_b = this.bodies[i];

		if ( object_a === object_b ) {
			continue;
		}

		if ( this.mightIntersect( object_a, object_b ) ) {
			intersections.push( object_b );
		}
	}

	return intersections;
};

/**
 * Determines whether two objects may be colliding
 *
 * @method mightIntersect
 * @param object_a {RigidBody}
 * @param object_b {RigidBody}
 * @returns {Boolean}
 */
Goblin.BasicBroadphase.prototype.mightIntersect = function( object_a, object_b ) {
	return object_a.aabb.intersects( object_b.aabb );
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