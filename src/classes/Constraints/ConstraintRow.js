Goblin.ConstraintRow = function() {
	this.jacobian = new Float64Array( 12 );
	this.B = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this.D = 0; // Length of the jacobian

	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;

	this.bias = 0;
	this.multiplier = 0;
	this.multiplier_cached = 0;
	this.eta = 0;
	this.eta_row = new Float64Array( 12 );
};

Goblin.ConstraintRow.prototype.computeB = function( constraint ) {
	var invmass;

	if ( constraint.object_a != null && constraint.object_a._mass !== Infinity ) {
		invmass = constraint.object_a._mass_inverted;

		this.B[0] = invmass * this.jacobian[0] * constraint.object_a.linear_factor.x;
		this.B[1] = invmass * this.jacobian[1] * constraint.object_a.linear_factor.y;
		this.B[2] = invmass * this.jacobian[2] * constraint.object_a.linear_factor.z;

		_tmp_vec3_1.x = this.jacobian[3];
		_tmp_vec3_1.y = this.jacobian[4];
		_tmp_vec3_1.z = this.jacobian[5];
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		this.B[3] = _tmp_vec3_1.x * constraint.object_a.angular_factor.x;
		this.B[4] = _tmp_vec3_1.y * constraint.object_a.angular_factor.y;
		this.B[5] = _tmp_vec3_1.z * constraint.object_a.angular_factor.z;
	} else {
		this.B[0] = this.B[1] = this.B[2] = 0;
		this.B[3] = this.B[4] = this.B[5] = 0;
	}

	if ( constraint.object_b != null && constraint.object_b._mass !== Infinity ) {
		invmass = constraint.object_b._mass_inverted;
		this.B[6] = invmass * this.jacobian[6] * constraint.object_b.linear_factor.x;
		this.B[7] = invmass * this.jacobian[7] * constraint.object_b.linear_factor.y;
		this.B[8] = invmass * this.jacobian[8] * constraint.object_b.linear_factor.z;

		_tmp_vec3_1.x = this.jacobian[9];
		_tmp_vec3_1.y = this.jacobian[10];
		_tmp_vec3_1.z = this.jacobian[11];
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		this.B[9] = _tmp_vec3_1.x * constraint.object_b.linear_factor.x;
		this.B[10] = _tmp_vec3_1.y * constraint.object_b.linear_factor.y;
		this.B[11] = _tmp_vec3_1.z * constraint.object_b.linear_factor.z;
	} else {
		this.B[6] = this.B[7] = this.B[8] = 0;
		this.B[9] = this.B[10] = this.B[11] = 0;
	}
};

Goblin.ConstraintRow.prototype.computeD = function() {
	this.D = (
		this.jacobian[0] * this.B[0] +
		this.jacobian[1] * this.B[1] +
		this.jacobian[2] * this.B[2] +
		this.jacobian[3] * this.B[3] +
		this.jacobian[4] * this.B[4] +
		this.jacobian[5] * this.B[5] +
		this.jacobian[6] * this.B[6] +
		this.jacobian[7] * this.B[7] +
		this.jacobian[8] * this.B[8] +
		this.jacobian[9] * this.B[9] +
		this.jacobian[10] * this.B[10] +
		this.jacobian[11] * this.B[11]
	);
};

Goblin.ConstraintRow.prototype.computeEta = function( constraint, time_delta ) {
	var invmass,
		inverse_time_delta = 1 / time_delta;

	if ( constraint.object_a == null || constraint.object_a._mass === Infinity ) {
		this.eta_row[0] = this.eta_row[1] = this.eta_row[2] = this.eta_row[3] = this.eta_row[4] = this.eta_row[5] = 0;
	} else {
		invmass = constraint.object_a._mass_inverted;

		this.eta_row[0] = ( constraint.object_a.linear_velocity.x + ( invmass * constraint.object_a.accumulated_force.x ) ) * inverse_time_delta;
		this.eta_row[1] = ( constraint.object_a.linear_velocity.y + ( invmass * constraint.object_a.accumulated_force.y ) ) * inverse_time_delta;
		this.eta_row[2] = ( constraint.object_a.linear_velocity.z + ( invmass * constraint.object_a.accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_a.accumulated_torque );
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		this.eta_row[3] = ( constraint.object_a.angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		this.eta_row[4] = ( constraint.object_a.angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		this.eta_row[5] = ( constraint.object_a.angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
	}

	if ( constraint.object_b == null || constraint.object_b._mass === Infinity ) {
		this.eta_row[6] = this.eta_row[7] = this.eta_row[8] = this.eta_row[9] = this.eta_row[10] = this.eta_row[11] = 0;
	} else {
		invmass = constraint.object_b._mass_inverted;

		this.eta_row[6] = ( constraint.object_b.linear_velocity.x + ( invmass * constraint.object_b.accumulated_force.x ) ) * inverse_time_delta;
		this.eta_row[7] = ( constraint.object_b.linear_velocity.y + ( invmass * constraint.object_b.accumulated_force.y ) ) * inverse_time_delta;
		this.eta_row[8] = ( constraint.object_b.linear_velocity.z + ( invmass * constraint.object_b.accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_b.accumulated_torque );
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		this.eta_row[9] = ( constraint.object_b.angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		this.eta_row[10] = ( constraint.object_b.angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		this.eta_row[11] = ( constraint.object_b.angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
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

	this.eta = ( this.bias * inverse_time_delta ) - jdotv;
};