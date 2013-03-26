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
	this['bodies'] = [];

	/**
	 * Array of all (current) collision pairs between the broadphase's bodies
	 *
	 * @property collision_pairs
	 * @type {Array}
	 */
	this['collision_pairs'] = [];
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {MassPoint|RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.addBody = function( body ) {
	this['bodies'].push( body );
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {MassPoint|RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.removeBody = function( body ) {
	var i,
		body_count = this['bodies'].length;

	for ( i = 0; i < body_count; i++ ) {
		if ( this['bodies'][i] === body ) {
			this['bodies'].splice( i, 1 );
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
	var _vec3 = _tmp_vec3_1,
		i, j,
		object_a, object_b,
		distance,
		bodies_count = this['bodies'].length;

	// Clear any old contact pairs
	this['collision_pairs'].length = 0;

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_a = this['bodies'][i];

		for ( j = 0; j < bodies_count; j++ ) {
			if ( i <= j ) {
				// if i < j then we have already performed this check
				// if i === j then the two objects are the same and can't be in contact
				continue;
			}

			object_b = this['bodies'][j];

			vec3.subtract( object_a['position'], object_b['position'], _vec3 );
			distance = vec3.length( _vec3 ) - object_a['bounding_radius'] - object_b['bounding_radius'];

			if ( distance <= 0 ) {
				// We have a possible contact
				this['collision_pairs'].push([ object_a, object_b ]);
			}
		}
	}
};


// mappings for closure compiler
Goblin['BasicBroadphase'] = Goblin.BasicBroadphase;
Goblin.BasicBroadphase.prototype['predictContactPairs'] = Goblin.BasicBroadphase.prototype.predictContactPairs;
Goblin.BasicBroadphase.prototype['addBody'] = Goblin.BasicBroadphase.prototype.addBody;
Goblin.BasicBroadphase.prototype['removeBody'] = Goblin.BasicBroadphase.prototype.removeBody;