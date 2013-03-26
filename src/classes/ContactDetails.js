/**
 * Structure which holds information about a contact between two objects
 *
 * @Class ContactDetails
 * @param object_a {Goblin.RigidBody} first body in the contact
 * @param object_b {Goblin.RigidBody} second body in the contact
 * @param contact_point {vec3} point in world coordinates of the contact
 * @param contact_normal {wec3} normal vector, in world frame, of the contact
 * @param penetration_depth {Number} how far the objects are penetrated at the point of contact
 * @constructor
 */
Goblin.ContactDetails = function() {
	/**
	 * first body in the  contact
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this['object_a'] = null;

	/**
	 * second body in the  contact
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this['object_b'] = null;

	/**
	 * point of contact in world coordinates
	 *
	 * @property contact_point
	 * @type {vec3}
	 */
	this['contact_point'] = vec3.create();

	/**
	 * Point in 'object_a` local frame of `object_a`
	 *
	 * @property contact_point_in_a
	 * @type {vec3}
	 */
	this['contact_point_in_a'] = vec3.create();

	/**
	 * Point in 'object_b` local frame of `object_b`
	 *
	 * @property contact_point_in_b
	 * @type {vec3}
	 */
	this['contact_point_in_b'] = vec3.create();

	/**
	 * normal vector, in world frame, of the contact
	 *
	 * @property contact_normal
	 * @type {vec3}
	 */
	this['contact_normal'] = vec3.create();

	/**
	 * how far the objects are penetrated at the point of contact
	 *
	 * @property penetration_depth
	 * @type {Number}
	 */
	this['penetration_depth'] = 0;

	/**
	 * amount of restitution between the objects in contact
	 *
	 * @property restitution
	 * @type {Number}
	 */
	this['restitution'] = 0;

	/**
	 * amount of friction between the objects in contact
	 *
	 * @property friction
	 * @type {*}
	 */
	this['friction'] = 0;

	/**
	 * Matrix to convert from contact space to world space, aligned where the X axis is along the contact normal
	 *
	 * @property contact_basis
	 * @type {mat3}
	 */
	this['contact_basis'] = mat3.create();

	/**
	 * Matrix to convert from world space to contact space
	 *
	 * @property contact_basis_inverse
	 * @type {mat3}
	 */
	this['contact_basis_inverse'] = mat3.create();

	/**
	 * Velocity of the two objects relative to the contact
	 *
	 * @property relative_velocity
	 * @type {vec3}
	 */
	this['relative_velocity'] = vec3.create();

	/**
	 * Two-element array holding the positions of each object relative to the contact point
	 *
	 * @property relative_positions
	 * @type {Array}
	 */
	this['relative_positions'] = [ vec3.create(), vec3.create() ];

	/**
	 * The total desired delta separating velocity
	 *
	 * @property desired_delta_velocity
	 * @type {Number}
	 */
	this['desired_delta_velocity'] = vec3.create();
};

/**
 * Constructs an arbitrary orthonormal basis for the contact.
 * This is stored as a 3x3 matrix, where each vector is a row
 * (in other words the matrix transforms contact space into world
 * space). The x direction is generated from the contact normal,
 * and the y and z directions are set so they are at right angles to
 * it.
 *
 * @method calculateContactBasis
 * @private
 */
Goblin.ContactDetails.prototype.calculateContactBasis = function() {
	var _vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2,

		contact_normal = this['contact_normal'],
		resulting_basis = this['contact_basis'],

		scaling_factor;

	// Check whether the Z axis is nearer to the X or Y axis.
	if ( Math.abs( contact_normal[0] ) > Math.abs( contact_normal[1] ) ) {
		// Scaling factor to ensure the results are normalized.
		scaling_factor = 1.0 / Math.sqrt( contact_normal[2] * contact_normal[2] + contact_normal[0] * contact_normal[0] );

		// The new X axis is at right angles to the world Y axis.
		_vec3_1[0] = contact_normal[2] * scaling_factor;
		_vec3_1[1] = 0;
		_vec3_1[2] = -contact_normal[0] * scaling_factor;

		// The new Y axis is at right angles to the new X and Z axes.
		_vec3_2[0] = contact_normal[1] * _vec3_1[0];
		_vec3_2[1] = contact_normal[2] * _vec3_1[0] - contact_normal[0] * _vec3_1[2];
		_vec3_2[2] = -contact_normal[1] * _vec3_1[0];
	} else {
		// Scaling factor to ensure the results are normalized.
		scaling_factor = 1.0 / Math.sqrt( contact_normal[2] * contact_normal[2] + contact_normal[1] * contact_normal[1] );

		// The new X axis is at right angles to the world X axis.
		_vec3_1[0] = 0;
		_vec3_1[1] = -contact_normal[2] * scaling_factor;
		_vec3_1[2] = contact_normal[1] * scaling_factor;

		// The new Y axis is at right angles to the new X and Z axes.
		_vec3_2[0] = contact_normal[1] * _vec3_1[2] - contact_normal[2] * _vec3_1[1];
		_vec3_2[1] = -contact_normal[0] * _vec3_1[2];
		_vec3_2[2] = contact_normal[0] * _vec3_1[1];
	}

	// Make a matrix from the three vectors.
	resulting_basis[0] = contact_normal[0];
	resulting_basis[1] = contact_normal[1];
	resulting_basis[2] = contact_normal[2];

	resulting_basis[3] = _vec3_1[0];
	resulting_basis[4] = _vec3_1[1];
	resulting_basis[5] = _vec3_1[2];

	resulting_basis[6] = _vec3_2[0];
	resulting_basis[7] = _vec3_2[1];
	resulting_basis[8] = _vec3_2[2];

	// Calculate the inverse basis matrix
	mat3.transpose( resulting_basis, this['contact_basis_inverse'] );
};

/**
 * Calculates the relative velocity between the two objects in this contact
 *
 * @method calculateRelativeVelocity
 * @param duration {Number} duration of time, in seconds, to calculate for
 * @private
 */
Goblin.ContactDetails.prototype.calculateRelativeVelocity = function( duration ) {
	var object_velocity = vec3.create(),
		object_acceleration_velocity = vec3.create(),
		relative_velocity = this['relative_velocity'],

		object_a = this['object_a'],
		object_b = this['object_b'];

	// Zero-fill the `relative_velocity` vector
	relative_velocity[0] = relative_velocity[1] = relative_velocity[2] = 0;

	if ( object_a['mass'] !== Infinity ) {
		vec3.cross( object_a['angular_velocity'], this['relative_positions'][0], object_velocity );
		vec3.add( object_velocity, object_a['linear_velocity'] );

		// Turn the velocity into contact-coordinates and add it to the relative velocity
		mat3.multiplyVec3( this['contact_basis_inverse'], object_velocity );
		vec3.add( relative_velocity, object_velocity );

		// Calculate the amount of velocity that is due to forces without reactions.
		vec3.scale( object_a['acceleration'], duration, object_acceleration_velocity );

		// Calculate the velocity in contact-coordinates.
		mat3.multiplyVec3( this['contact_basis_inverse'], object_acceleration_velocity );

		// We ignore any component of acceleration in the contact normal
		// direction, we are only interested in planar acceleration
		object_acceleration_velocity[0] = 0;

		// Add the planar velocities - if there's enough friction they will be removed during velocity resolution
		vec3.add( relative_velocity, object_acceleration_velocity );
	}

	if ( object_b['mass'] !== Infinity ) {
		vec3.cross( object_b['angular_velocity'], this['relative_positions'][0], object_velocity );
		vec3.add( object_velocity, object_b['linear_velocity'] );

		// Turn the velocity into contact-coordinates and add it to the relative velocity
		mat3.multiplyVec3( this['contact_basis_inverse'], object_velocity );
		vec3.add( relative_velocity, object_velocity );

		// Calculate the amount of velocity that is due to forces without reactions.
		vec3.scale( object_b['acceleration'], duration, object_acceleration_velocity );

		// Calculate the velocity in contact-coordinates.
		mat3.multiplyVec3( this['contact_basis_inverse'], object_acceleration_velocity );

		// We ignore any component of acceleration in the contact normal
		// direction, we are only interested in planar acceleration
		object_acceleration_velocity[0] = 0;

		// Add the planar velocities - if there's enough friction they will be removed during velocity resolution
		vec3.add( relative_velocity, object_acceleration_velocity );
	}
};

/**
 * Calculates the total desired delta separating velocity
 *
 * @method calculateDesiredDeltaVelocity
 * @param duration {Number} time, in seconds, this frame is simulating
 * @private
 */
Goblin.ContactDetails.prototype.calculateDesiredDeltaVelocity = function( duration ) {
	var velocity_limit = 0.25, // If the contact velocity is less than `velocity_limit`, don't apply any restitution
		velocity_from_acceleration = 0,

		restitution = this['restitution'],

		object_a = this['object_a'],
		object_b = this['object_b'],

		_vec3_1 = _tmp_vec3_1;

	// Calculate the acceleration induced velocity accumulated this frame
	if ( object_a['mass'] !== Infinity ) {
		vec3.scale( object_a['acceleration'], duration, _vec3_1 );
		velocity_from_acceleration += vec3.dot( _vec3_1, this['contact_normal'] );
	}

	if ( object_b['mass'] !== Infinity ) {
		vec3.scale( object_b['acceleration'], duration, _vec3_1 );
		velocity_from_acceleration -= vec3.dot( _vec3_1, this['contact_normal'] );
	}

	// If the velocity is very slow, limit the restitution
	if ( Math.abs( this['relative_velocity'][0] ) < velocity_limit ) {
		restitution = 0;
	}

	// Combine the bounce velocity with the removed acceleration velocity.
	this['desired_delta_velocity'] = -this['relative_velocity'][0] - restitution * ( this['relative_velocity'][0] - velocity_from_acceleration );
};

Goblin.ContactDetails.prototype.calculateInternals = function( duration ) {
	// Calculate the relative contact points
	vec3.subtract( this['contact_point'], this['object_a']['position'], this['relative_positions'][0] );
	vec3.subtract( this['contact_point'], this['object_b']['position'], this['relative_positions'][1] );

	this.calculateContactBasis();
	this.calculateRelativeVelocity( duration );
	this.calculateDesiredDeltaVelocity( duration );
};

// mappings for closure compiler
Goblin['ContactDetails'] = Goblin.ContactDetails;
Goblin.ContactDetails.prototype['calculateInternals'] = Goblin.ContactDetails.prototype.calculateInternals;