Goblin.FrictionConstraint = function() {
	Goblin.Constraint.call( this );
};

Goblin.FrictionConstraint.prototype.buildFromContact = function( contact ) {
	var row0 = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' ),
		row1 = this.rows[1] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;

	// Find the two constraint vectors
	// _tmp_vec3_1 becomes linear vector 1
	// _tmp_vec3_2 becomes linear vector 2
	vec3.subtract( contact.contact_point, contact.object_a.position, _tmp_vec3_1 );
	vec3.cross( _tmp_vec3_1, contact.contact_normal );

	vec3.subtract( contact.contact_point, contact.object_b.position, _tmp_vec3_2 );
	vec3.cross( _tmp_vec3_2, contact.contact_normal );
	vec3.negate( _tmp_vec3_2 );

	// @TODO Make it so this never happens
	// (happens now when two spheres collide directly on top of each other)
	if ( _tmp_vec3_1[0] === 0 && _tmp_vec3_1[1] === 0 && _tmp_vec3_1[2] === 0 ) {
		this.rows = [];
		return;
	}

	// @TODO gravity shouldn't just come from object_a
	var limit = contact.friction * ( (contact.object_a.mass !== Infinity ? contact.object_a.mass : 0) + (contact.object_b.mass !== Infinity ? contact.object_b.mass : 0) ) * vec3.length( contact.object_a.world.gravity );
	row0.lower_limit = row1.lower_limit = -limit;
	row0.upper_limit = row1.upper_limit = limit;


	// Compute jacobian
	if ( this.object_a == null || this.object_a.mass === Infinity ) {
		row0.jacobian[0] = row0.jacobian[1] = row0.jacobian[2] = row0.jacobian[3] = row0.jacobian[4] = row0.jacobian[5] = 0;
		row1.jacobian[0] = row1.jacobian[1] = row1.jacobian[2] = row1.jacobian[3] = row1.jacobian[4] = row1.jacobian[5] = 0;
	} else {
		row0.jacobian[0] = -_tmp_vec3_1[0];
		row0.jacobian[1] = -_tmp_vec3_1[1];
		row0.jacobian[2] = -_tmp_vec3_1[2];
		row1.jacobian[0] = -_tmp_vec3_2[0];
		row1.jacobian[1] = -_tmp_vec3_2[1];
		row1.jacobian[2] = -_tmp_vec3_2[2];

		// @TODO This calculation for angular velocity is wrong
		vec3.subtract( contact.contact_point, contact.object_a.position, _tmp_vec3_3 );
		vec3.cross( _tmp_vec3_3, _tmp_vec3_1 );
		row0.jacobian[3] = -_tmp_vec3_3[0];
		row0.jacobian[4] = -_tmp_vec3_3[1];
		row0.jacobian[5] = -_tmp_vec3_3[2];
		vec3.subtract( contact.contact_point, contact.object_b.position, _tmp_vec3_3 );
		vec3.cross( _tmp_vec3_3, _tmp_vec3_2 );
		row1.jacobian[3] = -_tmp_vec3_3[0];
		row1.jacobian[4] = -_tmp_vec3_3[1];
		row1.jacobian[5] = -_tmp_vec3_3[2];
	}

	if ( this.object_b == null || this.object_b.mass === Infinity ) {
		row0.jacobian[6] = row0.jacobian[7] = row0.jacobian[8] = row0.jacobian[9] = row0.jacobian[10] = row0.jacobian[11] = 0;
		row1.jacobian[6] = row1.jacobian[7] = row1.jacobian[8] = row1.jacobian[9] = row1.jacobian[10] = row1.jacobian[11] = 0;
	} else {
		row0.jacobian[6] = _tmp_vec3_1[0];
		row0.jacobian[7] = _tmp_vec3_1[1];
		row0.jacobian[8] = _tmp_vec3_1[2];
		row1.jacobian[6] = _tmp_vec3_2[0];
		row1.jacobian[7] = _tmp_vec3_2[1];
		row1.jacobian[8] = _tmp_vec3_2[2];

		vec3.subtract( contact.contact_point, contact.object_b.position, _tmp_vec3_3 );
		vec3.cross( _tmp_vec3_3, _tmp_vec3_1 );
		row0.jacobian[9] = _tmp_vec3_3[0];
		row0.jacobian[10] = _tmp_vec3_3[1];
		row0.jacobian[11] = _tmp_vec3_3[2];
		vec3.subtract( contact.contact_point, contact.object_b.position, _tmp_vec3_3 );
		vec3.cross( _tmp_vec3_3, _tmp_vec3_2 );
		row1.jacobian[9] = _tmp_vec3_3[0];
		row1.jacobian[10] = _tmp_vec3_3[1];
		row1.jacobian[11] = _tmp_vec3_3[2];
	}

	row0.bias = row1.bias = 0;

	this.rows[0] = row0;
	this.rows[1] = row1;

	this.rows.length = 0;
};