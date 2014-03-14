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