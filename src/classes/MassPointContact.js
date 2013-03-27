/**
 * Holds contact information for collisions between particles
 *
 * @class MassPointContact
 * @constructor
 * @param object_a {Goblin.PointMass} first particle in the contact
 * @param object_b {Goblin.PointMass} second particle in the contact
 * @param restition {Number} restitution coefficient at the contact
 * @param contact_normal {vec3} direction, in world coordinates, of the contact
 */
Goblin.MassPointContact = function( object_a, object_b, restition, contact_normal, penetration ) {
	/**
	 * First object in the contact
	 *
	 * @property object_a
	 * @type {Goblin.PointMass}
	 */
	this.object_a = object_a;

	/**
	 * Second object in the contact
	 *
	 * @property object_b
	 * @type {Goblin.PointMass}
	 */
	this.object_b = object_b;

	/**
	 * Total restitution coefficient of the concact
	 *
	 * @property restitution
	 * @type {Number}
	 */
	this.restitution = restition || 0.9;

	/**
	 * Direction, in world coordinates, of the contact
	 *
	 * @property contact_normal
	 * @type {vec3}
	 */
	this.contact_normal = contact_normal || vec3.create();

	/**
	 * Holds the depth of penetration at the contact.
	 *
	 * @property penetration
	 * @type {Number}
	 */
	this.penetration = penetration;
};

/**
 * Resolves the contact, both velocity & interpenetration
 *
 * @method resolve
 * @param duration {Number} Duration of time, in seconds, to apply resolution forces for
 */
Goblin.MassPointContact.prototype.resolve = function( duration ) {
	this.resolveVelocity( duration );
	this.resolveInterpenetration();
};

/**
 * Calculates the separating velocity at this contact
 *
 * @method calculateSeparatingVelocity
 * @return {Number} Resulting velocity
 */
Goblin.MassPointContact.prototype.calculateSeparatingVelocity = function() {
	var relative_velocity = _tmp_vec3_1;
	vec3.set( this.object_a.linear_velocity, relative_velocity );

	if ( this.object_b !== undefined ) {
		vec3.subtract( relative_velocity, this.object_b.linear_velocity );
	}

	return vec3.dot( relative_velocity, this.contact_normal );
};

/**
 * Handles the impulse calculations for this collision.
 *
 * @method resolveVelocity
 * @private
 * @param duration {Number} Duration of time, in seconds, to calculate velocities for
 */
Goblin.MassPointContact.prototype.resolveVelocity = function( duration ) {
	var separating_velocity,
		new_separating_velocity,
		acceleration_caused_separation_velocity,
		delta_velocity,
		total_inverse_mass,
		impulse,
		_vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2;
	
	// Find the velocity in the direction of the contact.
	separating_velocity = this.calculateSeparatingVelocity();

	// Check whether it needs to be resolved.
	if (separating_velocity > 0)
	{
		// The contact is either separating or stationary - there’s
		// no impulse required.
		return;
	}

	// Calculate the new separating velocity.
	new_separating_velocity = -separating_velocity * this.restitution;

	// Check the velocity build-up due to acceleration only.
	vec3.set( this.object_a.acceleration, _vec3_1 );
	if ( this.object_b !== undefined ) {
		vec3.subtract( _vec3_1, this.object_b.acceleration );
	}
	acceleration_caused_separation_velocity = vec3.dot( _vec3_1, this.contact_normal ) * duration;

	// If we’ve got a closing velocity due to acceleration build-up,
	// remove it from the new separating velocity.
	if ( acceleration_caused_separation_velocity < 0 ) {
		new_separating_velocity += this.restitution * acceleration_caused_separation_velocity;

		// Make sure we haven’t removed more than was
		// there to remove.
		if ( new_separating_velocity < 0 ) {
			new_separating_velocity = 0;
		}
	}

	delta_velocity = new_separating_velocity - separating_velocity;

	// We apply the change in velocity to each object in proportion to
	// its inverse mass (i.e., those with lower inverse mass [higher
	// actual mass] get less change in velocity).
	total_inverse_mass = 1 / this.object_a.mass;
	if ( this.object_b !== undefined ) {
		total_inverse_mass += 1 / this.object_b.mass;
	}

	// If all particles have infinite mass, then impulses have no effect.
	if ( total_inverse_mass <= 0 ) {
		return;
	}

	// Calculate the impulse to apply.
	impulse = delta_velocity / total_inverse_mass;

	// Find the amount of impulse per unit of inverse mass.
	vec3.scale( this.contact_normal, impulse, _vec3_1 );
	
	// Apply impulses: they are applied in the direction of the contact,
	// and are proportional to the inverse mass.
	vec3.scale( _vec3_1, 1 / this.object_a.mass, _vec3_2 );
	vec3.add( this.object_a.linear_velocity, _vec3_2 );

	if ( this.object_b !== undefined ) {
		// Object B goes in the opposite direction.
		vec3.scale( _vec3_1, -1 / this.object_b.mass, _vec3_2 );
		vec3.add( this.object_b.linear_velocity, _vec3_2 );
	}
};

/**
 * Separates the objects in contact so that they are not in penetration
 *
 * @method resolveInterpenetration
 * @private
 */
Goblin.MassPointContact.prototype.resolveInterpenetration = function() {
	var total_inverse_mass,
		_vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2;

	// If we don’t have any penetration, skip this step.
	if ( this.penetration <= 0 ) {
		return;
	}

	// The movement of each object is based on its inverse mass, so total that.
	total_inverse_mass = 1 / this.object_a.mass;
	if ( this.object_b !== undefined ) {
		total_inverse_mass += 1 / this.object_b.mass;
	}

	// If all particles have infinite mass, then we do nothing.
	if ( total_inverse_mass <= 0 ) {
		return;
	}

	// Find the amount of penetration resolution per unit of inverse mass.
	vec3.scale( this.contact_normal, -this.penetration / total_inverse_mass, _vec3_1 );

	// Apply the penetration resolution.
	vec3.scale( _vec3_1, 1 / this.object_a.mass, _vec3_2 );
	vec3.add( this.object_a.position, _vec3_2 );

	if ( this.object_b !== undefined ) {
		vec3.scale( _vec3_1, 1 / this.object_b.mass );
		vec3.add( this.object_b.position, _vec3_2 );
	}
};