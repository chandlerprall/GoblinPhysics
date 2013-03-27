/**
 * Structure which holds information about the contact points between two objects
 *
 * @Class ContactManifold
 * @constructor
 */
Goblin.ContactManifold = function() {
	/**
	 * First body in the contact
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this.object_a = null;

	/**
	 * Second body in the contact
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this.object_b = null;

	/**
	 * Holds all of the active contact points for this manifold
	 *
	 * @property points
	 * @type {Array}
	 */
	this.points = [];

	/**
	 * Reference to the next ContactManifold in the list
	 *
	 * @property next_manifold
	 * @type Goblin.ContactManifold
	 */
	this.next_manifold = null;
};

Goblin.ContactManifold.getTriangleArea = function( a, b, c ) {
	vec3.subtract( b, a, _tmp_vec3_1 );
	vec3.subtract( c, b, _tmp_vec3_2 );
	vec3.cross( _tmp_vec3_1, _tmp_vec3_2 );
	return _tmp_vec3_1[0] * _tmp_vec3_1[0] + _tmp_vec3_1[1] * _tmp_vec3_1[1] + _tmp_vec3_1[2] * _tmp_vec3_1[2];
};

Goblin.ContactManifold.prototype.addContact = function( contact ) {
	// Make sure this isn't a duplicate
	var i;
	for ( i = 0; i < this.points.length; i++ ) {
		if ( vec3.dist( this.points[i].contact_point, contact.contact_point ) <= 0.01 ) {
			return;
		}
	}
	// Add contact if we don't have enough points yet
	if ( this.points.length < 3 ) {
		this.points.push( contact );
	} else {
		var is_deeper = 0,
			deeper_than = null;

		// Determine if the new contact would yield a larger contact surface area
		// @TODO cache `current_area` - no need to constantly calculate it
		var current_area = Goblin.ContactManifold.getTriangleArea(
				this.points[0].contact_point,
				this.points[1].contact_point,
				this.points[2].contact_point
			),
			replace_a = Goblin.ContactManifold.getTriangleArea(
				contact.contact_point,
				this.points[1].contact_point,
				this.points[2].contact_point
			),
			replace_b = Goblin.ContactManifold.getTriangleArea(
				this.points[0].contact_point,
				contact.contact_point,
				this.points[2].contact_point
			),
			replace_c = Goblin.ContactManifold.getTriangleArea(
				contact.contact_point,
				this.points[0].contact_point,
				this.points[1].contact_point,
				contact.contact_point
			);

		var to_replace = -1,
			max_area = current_area,
			depth_delta = 0;

		if ( replace_a > max_area ) {
			to_replace = 0;
			max_area = replace_a;
		} else {
			depth_delta = contact.penetration_depth - this.points[0].penetration_depth;
			if ( depth_delta > 0 && depth_delta > is_deeper ) {
				is_deeper =  depth_delta;
				deeper_than = 0;
			}
		}

		if ( replace_b > max_area ) {
			to_replace = 1;
			max_area = replace_b;
		} else {
			depth_delta = contact.penetration_depth - this.points[1].penetration_depth;
			if ( depth_delta > 0 && depth_delta > is_deeper ) {
				is_deeper =  depth_delta;
				deeper_than = 1;
			}
		}

		if ( replace_c > max_area ) {
			to_replace = 2;
			max_area = replace_c;
		} else {
			depth_delta = contact.penetration_depth - this.points[2].penetration_depth;
			if ( depth_delta > 0 && depth_delta > is_deeper ) {
				is_deeper =  depth_delta;
				deeper_than = 2;
			}
		}

		if ( to_replace !== -1 ) {
			this.points[to_replace] = contact;
		} else if ( is_deeper > 0 ) {
			this.points[deeper_than] = contact;
		}
	}
};

/**
 * Updates all of this manifold's ContactDetails with the correct contact location & penetration depth
 *
 * @method update
 */
Goblin.ContactManifold.prototype.update = function() {
	// Update positions / depths of contacts
	var i = this.points.length - 1,
		j,
		point,
		object_a_world_coords = vec3.create(),
		object_b_world_coords = vec3.create(),
		vector_difference = vec3.create();

	while( i >= 0 ) {
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
		/*if ( vec3.dot( point.contact_normal, vector_difference ) < 0 ) {
			point.penetration_depth *= -1;
		}*/

		// If distance is too great, remove this contact point
		if ( true || point.penetration_depth < -0.04 ) {
			for ( j = this.points.length - 2; j >= i; j-- ) {
				this.points[j] = this.points[j + 1];
			}
			this.points.length = this.points.length - 1;
		}

		i--;
	}
};