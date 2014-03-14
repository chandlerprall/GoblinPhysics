Goblin.ConstraintRow = function() {
	this.jacobian = new Float64Array( 12 );
	this.B = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this.D = 0; // Length of the jacobian

	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;

	this.bias = 0;
	this.multiplier = 0;
	this.multiplier_cache = 0;
	this.eta = 0; // The amount of work required of the constraint
	this.eta_row = new Float64Array( 12 );

	this.applied_push_impulse = 0;
};

Goblin.ConstraintRow.prototype.computeB = function( constraint ) {
	var invmass = 0;

	if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
		invmass = 1 / constraint.object_a.mass;

		this.B[0] = invmass * this.jacobian[0];
		this.B[1] = invmass * this.jacobian[1];
		this.B[2] = invmass * this.jacobian[2];

		_tmp_vec3_1[0] = this.jacobian[3];
		_tmp_vec3_1[1] = this.jacobian[4];
		_tmp_vec3_1[2] = this.jacobian[5];
		mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.B[3] = _tmp_vec3_1[0];
		this.B[4] = _tmp_vec3_1[1];
		this.B[5] = _tmp_vec3_1[2];
	} else {
		this.B[0] = this.B[1] = this.B[2] = 0;
		this.B[3] = this.B[4] = this.B[5] = 0;
	}

	if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
		invmass = 1 / constraint.object_b.mass;
		this.B[6] = invmass * this.jacobian[6];
		this.B[7] = invmass * this.jacobian[7];
		this.B[8] = invmass * this.jacobian[8];

		_tmp_vec3_1[0] = this.jacobian[9];
		_tmp_vec3_1[1] = this.jacobian[10];
		_tmp_vec3_1[2] = this.jacobian[11];
		mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.B[9] = _tmp_vec3_1[0];
		this.B[10] = _tmp_vec3_1[1];
		this.B[11] = _tmp_vec3_1[2];
	} else {
		this.B[6] = this.B[7] = this.B[8] = 0;
		this.B[9] = this.B[10] = this.B[11] = 0;
	}
};

Goblin.ConstraintRow.prototype.computeD = function( constraint ) {
	this.D = 0;

	if ( constraint.object_a != null ) {
		this.D += this.jacobian[0] * this.jacobian[0] +
			this.jacobian[1] * this.B[1] +
			this.jacobian[2] * this.B[2] +
			this.jacobian[3] * this.B[3] +
			this.jacobian[4] * this.B[4] +
			this.jacobian[5] * this.B[5];
	}

	if ( constraint.object_b != null ) {
		this.D += this.jacobian[6] * this.jacobian[6] +
			this.jacobian[7] * this.B[7] +
			this.jacobian[8] * this.B[8] +
			this.jacobian[9] * this.B[9] +
			this.jacobian[10] * this.B[10] +
			this.jacobian[11] * this.B[11];
	}
};

Goblin.ConstraintRow.prototype.computeEta = function( constraint ) {
	var invmass;

	if ( constraint.object_a != null ) {
		// Compute linear distance traveling this tick
		invmass = 1 / constraint.object_a.mass;
		this.eta_row[0] = ( constraint.object_a.linear_velocity[0] + ( invmass * constraint.object_a.accumulated_force[0] ) );
		this.eta_row[1] = ( constraint.object_a.linear_velocity[1] + ( invmass * constraint.object_a.accumulated_force[1] ) );
		this.eta_row[2] = ( constraint.object_a.linear_velocity[2] + ( invmass * constraint.object_a.accumulated_force[2] ) );

		// Compute angular distance traveling this tick
		vec3.set( constraint.object_a.accumulated_torque, _tmp_vec3_1 );
		mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.eta_row[3] = ( constraint.object_a.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
		this.eta_row[4] = ( constraint.object_a.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
		this.eta_row[5] = ( constraint.object_a.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
	} else {
		this.eta_row[0] = this.eta_row[1] = this.eta_row[2] = this.eta_row[3] = this.eta_row[4] = this.eta_row[5] = 0;
	}
	if ( constraint.object_b != null ) {
		invmass = 1 / constraint.object_b.mass;
		this.eta_row[6] = ( constraint.object_b.linear_velocity[0] + ( invmass * constraint.object_b.accumulated_force[0] ) );
		this.eta_row[7] = ( constraint.object_b.linear_velocity[1] + ( invmass * constraint.object_b.accumulated_force[1] ) );
		this.eta_row[8] = ( constraint.object_b.linear_velocity[2] + ( invmass * constraint.object_b.accumulated_force[2] ) );

		// Compute angular distance traveling this tick
		vec3.set( constraint.object_b.accumulated_torque, _tmp_vec3_1 );
		mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
		this.eta_row[9] = ( constraint.object_b.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
		this.eta_row[10] = ( constraint.object_b.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
		this.eta_row[11] = ( constraint.object_b.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
	} else {
		this.eta_row[6] = this.eta_row[7] = this.eta_row[8] = this.eta_row[9] = this.eta_row[10] = this.eta_row[11] = 0;
	}

	var jdotv = this.jacobian[0] * this.eta_row[0] +
		this.jacobian[1] * this.eta_row[1] +
		this.jacobian[2] * this.eta_row[2] +
		this.jacobian[3] * this.eta_row[3] +
		this.jacobian[4] * this.eta_row[4] +
		this.jacobian[5] * this.eta_row[5] +
		this.jacobian[6] * this.eta_row[6] +
		this.jacobian[7] * this.eta_row[7] +
		this.jacobian[8] * this.eta_row[8] +
		this.jacobian[9] * this.eta_row[9] +
		this.jacobian[10] * this.eta_row[10] +
		this.jacobian[11] * this.eta_row[11];

	this.eta = this.bias - jdotv;
};