/**
 * Iterates over an array of contacts, solving the resulting impulses of each collision
 *
 * @class RigidCollisionSolver
 * @constructor
 */
Goblin.RigidContactSolver = function() {

};

/**
 * Takes a contact and calculates & applies the resulting velocities on the two contact objects
 *
 * @method applyVelocityChange
 * @param contact {Goblin.ContactDetails} contact to apply velocity changes to
 * @param duration {Number} how long, in seconds, the current frame is simulating
 * @private
 */
Goblin.RigidContactSolver.prototype.applyVelocityChange = function( contact, duration ) {
	var _vec3_1 = _tmp_vec3_1,

		// Matrices to convert from world space to contact space and vice-versa
		contact_basis = _tmp_mat3_1,
		contact_basis_inverse = _tmp_mat3_2,

		// Float value which holds the total change in velocity
		delta_velocity = 0,

		// `contact_impulse` will hold the final impulse we need to apply
		contact_impulse = _tmp_vec3_2,

		// holds the position of the contact point relative to either
		// the contact's object_a or object_b, depending on which we need
		relative_contact_position = _tmp_vec3_3;

	contact_basis = contact.contact_basis;
	contact_basis_inverse = contact.contact_basis_inverse;

	if ( contact.friction === 0 ) {
		// Build a vector (`contact_impulse`) that shows the change in velocity in world
		// space for a unit impulse in the direction of the contact normal.

		if ( contact.object_a.mass !== Infinity ) {
			// Set `relative_contact_point` to be relative to object_a
			vec3.subtract( contact.contact_point, contact.object_a.position, relative_contact_position );

			// Calculate the delta velocity in world coordinates and store it in_vec3_1
			vec3.cross( relative_contact_position, contact.contact_normal, _vec3_1 );
			mat3.multiplyVec3( contact.object_a.inverseInertiaTensorWorldFrame, _vec3_1 );
			vec3.cross( _vec3_1, relative_contact_position );

			// Work out the change in velocity in contact coordiantes.
			delta_velocity += vec3.dot( _vec3_1, contact.contact_normal );

			// Add the linear component of velocity change
			delta_velocity += 1 / contact.object_a.mass;
		}

		// Check if we need to the second body's data
		if ( contact.object_b.mass !== Infinity ) {
			// Set `relative_contact_point` to be relative to object_b
			vec3.subtract( contact.contact_point, contact.object_b.position, relative_contact_position );

			// Go through the same transformation sequence again
			vec3.cross( relative_contact_position, contact.contact_normal, _vec3_1 );
			mat3.multiplyVec3( contact.object_b.inverseInertiaTensorWorldFrame, _vec3_1 );
			vec3.cross( _vec3_1, relative_contact_position );

			// Add the change in velocity due to rotation
			delta_velocity += vec3.dot( _vec3_1, contact.contact_normal );

			// Add the change in velocity due to linear motion
			delta_velocity += 1 / contact.object_b.mass;
		}

		// Calculate the required size of the impulse
		contact_impulse[0] = contact.desired_delta_velocity / delta_velocity;
		contact_impulse[1] = contact_impulse[2] = 0;
	} else {
		throw 'cannot handle contacts with friction';
	}

	// Convert `contact_impulse` to world coordinates
	mat3.multiplyVec3( contact_basis, contact_impulse );

	// Set `relative_contact_point` to be relative to object_a
	vec3.subtract( contact.contact_point, contact.object_a.position, relative_contact_position );

	// Split in the impulse into linear and rotational components

	// Apply rotational impulse
	vec3.cross( relative_contact_position, contact_impulse, _vec3_1 );
	mat3.multiplyVec3( contact.object_a.inverseInertiaTensorWorldFrame, _vec3_1 );
	vec3.add( contact.object_a.angular_velocity, _vec3_1 );

	// Apply linear impulse
	vec3.scale( contact_impulse, 1 / contact.object_a.mass, _vec3_1 );
	vec3.add( contact.object_a.linear_velocity, _vec3_1 );

	if ( contact.object_b.mass !== Infinity ) {
		// Set `relative_contact_point` to be relative to object_a
		vec3.subtract( contact.contact_point, contact.object_b.position, relative_contact_position );

		// Work out object_b's linear and angular changes
		vec3.cross( contact_impulse, relative_contact_position, _vec3_1 );
		mat3.multiplyVec3( contact.object_b.inverseInertiaTensorWorldFrame, _vec3_1 );
		vec3.add( contact.object_b.angular_velocity, _vec3_1 );

		vec3.scale( contact_impulse, -1 / contact.object_b.mass, _vec3_1 );
		vec3.add( contact.object_b.linear_velocity, _vec3_1 );
	}
};

/**
 * Takes a contact and corrects the position of each object so they do not overlap
 *
 * @method applyPositionChange
 * @param contact {Goblin.ContactDetails} contact to apply position changes to
 * @private
 */
Goblin.RigidContactSolver.prototype.applyPositionChange = function( contact ) {
	// @TODO too many objects are created in this function
	var angular_limit = 0.2,

		angular_change = [ vec3.create(), vec3.create() ],
		linear_change = [ vec3.create(), vec3.create() ],

		// holds the amount of angular movement each object needs
		angular_move = [],

		// holds the amount of linear movement each object needs
		linear_move = [],

		// total inerita in the contact
		total_inertia = 0,

		// linear inertia in each object
		linear_inertia = [],

		// angular inertia in each object
		angular_inertia = [],

		_vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2,

		contact_basis = _tmp_mat3_1,
		contact_basis_inverse = _tmp_mat3_2,

		// holds the position of the contact point relative to either
		// the contact's object_a or object_b, depending on which we need
		relative_contact_position = _tmp_vec3_3,

		i;

	// We need to work out the inertia of each object in the direction of the contact normal, due to angular inertia only.
	if ( contact.object_a.mass !== Infinity ) {
		// Set `relative_contact_point` to be relative to object_a
		vec3.subtract( contact.contact_point, contact.object_a.position, relative_contact_position );

		// Use the same procedure as for calculating frictionless velocity change to work out the angular inertia.
		// store world coordinates of angular inertia in _vec3_1
		vec3.cross( relative_contact_position, contact.contact_normal, _vec3_1 );
		mat3.multiplyVec3( contact.object_a.inverseInertiaTensorWorldFrame, _vec3_1 );
		vec3.cross( _vec3_1, relative_contact_position );
		angular_inertia[0] = vec3.dot( _vec3_1, contact.contact_normal );

		// The linear component is simply the inverse mass
		linear_inertia[0] = 1 / contact.object_a.mass;

		// Keep track of the total inertia from all components
		total_inertia += linear_inertia[0] + angular_inertia[0];
	}
	if ( contact.object_b.mass !== Infinity ) {
		// Set `relative_contact_point` to be relative to object_b
		vec3.subtract( contact.contact_point, contact.object_b.position, relative_contact_position );

		// Use the same procedure as for calculating frictionless velocity change to work out the angular inertia.
		// store world coordinates of angular inertia in _vec3_1
		vec3.cross( relative_contact_position, contact.contact_normal, _vec3_1 );
		mat3.multiplyVec3( contact.object_b.inverseInertiaTensorWorldFrame, _vec3_1 );
		vec3.cross( _vec3_1, relative_contact_position );
		angular_inertia[1] = vec3.dot( _vec3_1, contact.contact_normal );

		// The linear component is simply the inverse mass
		linear_inertia[1] = 1 / contact.object_b.mass;

		// Keep track of the total inertia from all components
		total_inertia += linear_inertia[1] + angular_inertia[1];
	}

	for ( i = 0; i < 2; i++ ) {
		if ( contact[ i === 0 ? 'object_a' : 'object_b' ].mass === Infinity ) {
			continue;
		}

		// The linear and angular movements required are in proportion to the two inverse inertias.
		var sign = i === 0 ? 1 : -1;

		angular_move[i] = sign * contact.penetration_depth * ( angular_inertia[i] / total_inertia );
		linear_move[i] = sign * contact.penetration_depth * ( linear_inertia[i] / total_inertia );

		// Set `relative_contact_point` to be relative to the current object
		vec3.subtract( contact.contact_point, contact[ i === 0 ? 'object_a' : 'object_b' ].position, relative_contact_position );

		// To avoid angular projections that are too great (when mass is large but inertia tensor is small) limit the angular move.
		vec3.set( relative_contact_position, _vec3_1 ); // set `relative_contact_position` as the initial projection

		vec3.scale(
			contact.contact_normal,
			- vec3.dot( relative_contact_position, contact.contact_normal ),
			_vec3_2
		);
		vec3.add( _vec3_1, _vec3_2 );

		// Use the small angle approximation for the sine of the angle (i.e.
		// the magnitude would be sine(angularLimit) * projection.magnitude
		// but we approximate sine(angularLimit) to angularLimit).
		var max_magnitude = angular_limit * vec3.length( _vec3_1 );

		var total_move;
		if ( angular_move[i] < -max_magnitude ) {
			total_move = angular_move[i] + linear_move[i];
			angular_move[i] = - max_magnitude;
			linear_move[i] = total_move - angular_move[i];
		} else if ( angular_move[i] > max_magnitude ) {
			total_move = angular_move[i] + linear_move[i];
			angular_move[i] = max_magnitude;
			linear_move[i] = total_move - angular_move[i];
		}

		// We have the linear amount of movement required by turning
		// the rigid body (in `angular_move[i]`). We now need to
		// calculate the desired rotation to achieve that.
		if ( angular_move[i] === 0 ) {
			// Easy case - no angular movement means no rotation.
			angular_change[i][0] = angular_change[i][1] = angular_change[i][2];
		} else {
			// Work out the direction we'd like to rotate in.
			vec3.cross( relative_contact_position, contact.contact_normal, _vec3_1 );

			mat3.multiplyVec3( contact[ i === 0 ? 'object_a' : 'object_b' ].inverseInertiaTensorWorldFrame, _vec3_1 );
			vec3.scale( _vec3_1, angular_move[i] / angular_inertia[i], angular_change[i] );
		}

		// Velocity change is easier - it is just the linear movement along the contact normal.
		vec3.scale( contact.contact_normal, linear_move[i], linear_change[i] );

		// Now we can start to apply the values we've calculated.
		// Apply the linear movement
		vec3.add( contact[ i === 0 ? 'object_a' : 'object_b' ].position, linear_change[i] );

		// And the change in orientation
		quat4.addScaledVector( contact[ i === 0 ? 'object_a' : 'object_b' ].rotation, angular_change[i], 1 );
	}
};

/**
 * Solves each contact in the passed array
 *
 * @method solveContacts
 * @param contacts {Array} array of contacts to solve
 * @param duration {Number} time, in seconds, is the current frame simulating
 */
Goblin.RigidContactSolver.prototype.solveContacts = function( contact_manifolds, duration ) {
	var i,
		//contacts_length = contacts.length,
		current_manifold = contact_manifolds.first,
		contacts_length, contact;

	while ( current_manifold !== null ) {
		contacts_length = current_manifold.points.length;
		for ( i = 0; i < contacts_length; i++ ) {
			contact = current_manifold.points[i];
			if ( contact.penetration_depth >= 0 ) {
				contact.calculateInternals( duration );
				this.applyVelocityChange( contact, duration );
				this.applyPositionChange( contact );
			}
		}
		current_manifold = current_manifold.next_manifold;
	}

	/*for ( i = 0; i < contacts_length; i++ ) {
		contact = contacts[i];
		contact.calculateInternals( duration );
		this.applyVelocityChange( contact, duration );
		this.applyPositionChange( contact );
	}*/
};