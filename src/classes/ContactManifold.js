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
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res0 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 1 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res1 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 2 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res2 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 3 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[2].contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res3 = _tmp_vec3_1.lengthSquared();
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
		if ( this.points[i].contact_point.distanceTo( contact.contact_point ) <= 0.02 ) {
			contact.destroy();
			return;
		}
	}

	var use_contact = false;
	if ( contact != null ) {
		use_contact = contact.object_a.emit( 'speculativeContact', contact.object_b, contact );
		if ( use_contact !== false ) {
			use_contact = contact.object_b.emit( 'speculativeContact', contact.object_a, contact );
		}

		if ( use_contact === false ) {
			contact.destroy();
			return;
		} else {
			contact.object_a.emit( 'contact', contact.object_b, contact );
			contact.object_b.emit( 'contact', contact.object_a, contact );
		}
	}

	// Add contact if we don't have enough points yet
	if ( this.points.length < 4 ) {
		this.points.push( contact );
	} else {
		var replace_index = this.findWeakestContact( contact );
		this.points[replace_index].destroy();
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
		object_a_world_coords = new Goblin.Vector3(),
		object_b_world_coords = new Goblin.Vector3(),
		vector_difference = new Goblin.Vector3(),
		starting_points_length = this.points.length;

	for ( i = 0; i < this.points.length; i++ ) {
		point = this.points[i];

		// Convert the local contact points into world coordinates
		point.object_a.transform.transformVector3Into( point.contact_point_in_a, object_a_world_coords );
		point.object_b.transform.transformVector3Into( point.contact_point_in_b, object_b_world_coords );

		// Find new world contact point
		point.contact_point.addVectors( object_a_world_coords, object_b_world_coords );
		point.contact_point.scale( 0.5  );

		// Find the new penetration depth
		vector_difference.subtractVectors( object_a_world_coords, object_b_world_coords );
		point.penetration_depth = vector_difference.dot( point.contact_normal );

		// If distance from contact is too great remove this contact point
		if ( point.penetration_depth < -0.02 ) {
			// Points are too far away along the contact normal
			point.destroy();
			for ( j = i; j < this.points.length; j++ ) {
				this.points[j] = this.points[j + 1];
			}
			this.points.length = this.points.length - 1;
			this.object_a.emit( 'endContact', this.object_b );
			this.object_b.emit( 'endContact', this.object_a );
		} else {
			// Check if points are too far away orthogonally
			_tmp_vec3_1.scaleVector( point.contact_normal, point.penetration_depth );
			_tmp_vec3_1.subtractVectors( object_a_world_coords, _tmp_vec3_1 );

			_tmp_vec3_1.subtractVectors( object_b_world_coords, _tmp_vec3_1 );
			var distance = _tmp_vec3_1.lengthSquared();
			if ( distance > 0.2 * 0.2 ) {
				// Points are indeed too far away
				point.destroy();
				for ( j = i; j < this.points.length; j++ ) {
					this.points[j] = this.points[j + 1];
				}
				this.points.length = this.points.length - 1;
				this.object_a.emit( 'endContact', this.object_b );
				this.object_b.emit( 'endContact', this.object_a );
			}
		}
	}

	if (starting_points_length > 0 && this.points.length === 0) {
		// this update removed all contact points
		this.object_a.emit( 'endAllContact', this.object_b );
		this.object_b.emit( 'endAllContact', this.object_a );
	}
};