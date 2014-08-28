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

	var use_contact = false;
	if ( contact != null ) {
		use_contact = contact.object_a.emit( 'newContact', contact.object_b, contact );
		if ( use_contact !== false ) {
			use_contact = contact.object_b.emit( 'newContact', contact.object_a, contact );
		}

		if ( use_contact === false ) {
			Goblin.ObjectPool.freeObject( 'ContactDetails', contact );
			return;
		}
	}

	// Add contact if we don't have enough points yet
	if ( this.points.length < 4 ) {
		this.points.push( contact );
	} else {
		var replace_index = this.findWeakestContact( contact );
		//@TODO give the contact back to the object pool
		this.points[replace_index] = contact;
	}
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