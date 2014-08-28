Goblin.FrictionConstraint = function() {
	Goblin.Constraint.call( this );
};
Goblin.FrictionConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.FrictionConstraint.prototype.buildFromContact = function( contact ) {
	var row_1 = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' ),
		row_2 = this.rows[1] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;

	// Find the contact point relative to object_a and object_b
	var rel_a = vec3.create(),
		rel_b = vec3.create();
	vec3.subtract( contact.contact_point, contact.object_a.position, rel_a );
	vec3.subtract( contact.contact_point, contact.object_b.position, rel_b );

	var u1 = vec3.create(),
		u2 = vec3.create();

	var a, k;
	if ( Math.abs( contact.contact_normal[2] ) > 0.7071067811865475 ) {
		// choose p in y-z plane
		a = -contact.contact_normal[1] * contact.contact_normal[1] + contact.contact_normal[2] * contact.contact_normal[2];
		k = 1 / Math.sqrt( a );
		u1[0] = 0;
		u1[1] = -contact.contact_normal[2] * k;
		u1[2] = contact.contact_normal[1] * k;
		// set q = n x p
		u2[0] = a * k;
		u2[1] = -contact.contact_normal[0] * u1[2];
		u2[2] = contact.contact_normal[0] * u1[1];
	}
	else {
		// choose p in x-y plane
		a = contact.contact_normal[0] * contact.contact_normal[0] + contact.contact_normal[1] * contact.contact_normal[1];
		k = 1 / Math.sqrt( a );
		u1[0] = -contact.contact_normal[1] * k;
		u1[1] = contact.contact_normal[0] * k;
		u1[2] = 0;
		// set q = n x p
		u2[0] = -contact.contact_normal[2] * u1[1];
		u2[1] = contact.contact_normal[2] * u1[0];
		u2[2] = a*k;
	}

	if ( this.object_a == null || this.object_a.mass === Infinity ) {
		row_1.jacobian[0] = row_1.jacobian[1] = row_1.jacobian[2] = 0;
		row_1.jacobian[3] = row_1.jacobian[4] = row_1.jacobian[5] = 0;
		row_2.jacobian[0] = row_2.jacobian[1] = row_2.jacobian[2] = 0;
		row_2.jacobian[3] = row_2.jacobian[4] = row_2.jacobian[5] = 0;
	} else {
		row_1.jacobian[0] = -u1[0];
		row_1.jacobian[1] = -u1[1];
		row_1.jacobian[2] = -u1[2];

		vec3.cross( rel_a, u1, _tmp_vec3_1 );
		row_1.jacobian[3] = -_tmp_vec3_1[0];
		row_1.jacobian[4] = -_tmp_vec3_1[1];
		row_1.jacobian[5] = -_tmp_vec3_1[2];

		row_2.jacobian[0] = -u2[0];
		row_2.jacobian[1] = -u2[1];
		row_2.jacobian[2] = -u2[2];

		vec3.cross( rel_a, u2, _tmp_vec3_1 );
		row_2.jacobian[3] = -_tmp_vec3_1[0];
		row_2.jacobian[4] = -_tmp_vec3_1[1];
		row_2.jacobian[5] = -_tmp_vec3_1[2];
	}

	if ( this.object_b == null || this.object_b.mass === Infinity ) {
		row_1.jacobian[6] = row_1.jacobian[7] = row_1.jacobian[8] = 0;
		row_1.jacobian[9] = row_1.jacobian[10] = row_1.jacobian[11] = 0;
		row_2.jacobian[6] = row_2.jacobian[7] = row_2.jacobian[8] = 0;
		row_2.jacobian[9] = row_2.jacobian[10] = row_2.jacobian[11] = 0;
	} else {
		row_1.jacobian[6] = u1[0];
		row_1.jacobian[7] = u1[1];
		row_1.jacobian[8] = u1[2];

		vec3.cross( rel_b, u1, _tmp_vec3_1 );
		row_1.jacobian[9] = _tmp_vec3_1[0];
		row_1.jacobian[10] = _tmp_vec3_1[1];
		row_1.jacobian[11] = _tmp_vec3_1[2];

		row_2.jacobian[6] = u2[0];
		row_2.jacobian[7] = u2[1];
		row_2.jacobian[8] = u2[2];

		vec3.cross( rel_b, u2, _tmp_vec3_1 );
		row_2.jacobian[9] = _tmp_vec3_1[0];
		row_2.jacobian[10] = _tmp_vec3_1[1];
		row_2.jacobian[11] = _tmp_vec3_1[2];
	}

	// Find total velocity between the two bodies along the contact normal
	var velocity = vec3.dot( this.object_a.linear_velocity, contact.contact_normal );
	velocity -= vec3.dot( this.object_b.linear_velocity, contact.contact_normal );

	var avg_mass = 0;
	if ( this.object_a == null || this.object_a.mass === Infinity ) {
		avg_mass = this.object_b.mass;
	} else if ( this.object_b == null || this.object_b.mass === Infinity ) {
		avg_mass = this.object_a.mass;
	} else {
		avg_mass = ( this.object_a.mass + this.object_b.mass ) / 2;
	}

	velocity = 1; // @TODO velocity calculation above needs to be total external forces, not the velocity
	var limit = contact.friction * velocity * avg_mass;
	if ( limit < 0 ) {
		limit = 0;
	}
	row_1.lower_limit = row_2.lower_limit = -limit;
	row_1.upper_limit = row_2.upper_limit = limit;

	row_1.bias = row_2.bias = 0;

	this.rows[0] = row_1;
	this.rows[1] = row_2;
};