Goblin.SliderConstraint = function( object_a, axis, object_b ) {
	Goblin.Constraint.call( this );

	this.object_a = object_a;
	this.axis = axis;
	this.object_b = object_b;

	// Find the initial distance between the two objects in object_a's local frame
	this.position_error = vec3.create();
	vec3.subtract( this.object_b.position, this.object_a.position, this.position_error );
	quat4.inverse( this.object_a.rotation, _tmp_quat4_1 );
	quat4.multiplyVec3( _tmp_quat4_1, this.position_error );

	this.rotation_difference = quat4.create();
	if ( this.object_b != null ) {
		quat4.inverse( this.object_b.rotation, _tmp_quat4_1 );
		quat4.multiply( _tmp_quat4_1, this.object_a.rotation, this.rotation_difference );
	}

	this.erp = 0.1;

	// First two rows constrain the linear velocities orthogonal to `axis`
	// Rows three through five constrain angular velocities
	for ( var i = 0; i < 5; i++ ) {
		this.rows[i] = Goblin.ObjectPool.getObject( 'ConstraintRow' );
		this.rows[i].lower_limit = -Infinity;
		this.rows[i].upper_limit = Infinity;
		this.rows[i].bias = 0;

		this.rows[i].jacobian[0] = this.rows[i].jacobian[1] = this.rows[i].jacobian[2] =
			this.rows[i].jacobian[3] = this.rows[i].jacobian[4] = this.rows[i].jacobian[5] =
			this.rows[i].jacobian[6] = this.rows[i].jacobian[7] = this.rows[i].jacobian[8] =
			this.rows[i].jacobian[9] = this.rows[i].jacobian[10] = this.rows[i].jacobian[11] = 0;
	}
};
Goblin.SliderConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.SliderConstraint.prototype.update = (function(){
	var _axis = vec3.create(),
		n1 = vec3.create(),
		n2 = vec3.create();

	return function( time_delta ) {
		// `axis` is in object_a's local frame, convert to world
		quat4.multiplyVec3( this.object_a.rotation, this.axis, _axis );

		// Find two vectors that are orthogonal to `axis`
		n1[0] = _axis[1];
		n1[1] = -_axis[0];
		n1[2] = 0;
		vec3.normalize( n1 );
		vec3.cross( _axis, n1, n2 );

		this._updateLinearConstraints( time_delta, n1, n2 );
		this._updateAngularConstraints( time_delta, n1, n2 );
	};
})();

Goblin.SliderConstraint.prototype._updateLinearConstraints = function( time_delta, n1, n2 ) {
	var c = vec3.create();
	vec3.subtract( this.object_b.position, this.object_a.position, c );
	//vec3.scale( c, 0.5 );

	var cx = vec3.create();

	// first linear constraint
	vec3.cross( c, n1, cx );
	this.rows[0].jacobian[0] = -n1[0];
	this.rows[0].jacobian[1] = -n1[1];
	this.rows[0].jacobian[2] = -n1[2];
	//this.rows[0].jacobian[3] = -cx[0];
	//this.rows[0].jacobian[4] = -cx[1];
	//this.rows[0].jacobian[5] = -cx[2];

	this.rows[0].jacobian[6] = n1[0];
	this.rows[0].jacobian[7] = n1[1];
	this.rows[0].jacobian[8] = n1[2];
	this.rows[0].jacobian[9] = 0;
	this.rows[0].jacobian[10] = 0;
	this.rows[0].jacobian[11] = 0;

	// second linear constraint
	vec3.cross( c, n2, cx );
	this.rows[1].jacobian[0] = -n2[0];
	this.rows[1].jacobian[1] = -n2[1];
	this.rows[1].jacobian[2] = -n2[2];
	//this.rows[1].jacobian[3] = -cx[0];
	//this.rows[1].jacobian[4] = -cx[1];
	//this.rows[1].jacobian[5] = -cx[2];

	this.rows[1].jacobian[6] = n2[0];
	this.rows[1].jacobian[7] = n2[1];
	this.rows[1].jacobian[8] = n2[2];
	this.rows[1].jacobian[9] = 0;
	this.rows[1].jacobian[10] = 0;
	this.rows[1].jacobian[11] = 0;

	// linear constraint error
	//vec3.scale( c, 2 );
	quat4.multiplyVec3( this.object_a.rotation, this.position_error, _tmp_vec3_1 );
	vec3.subtract( c, _tmp_vec3_1, _tmp_vec3_2 );
	vec3.scale( _tmp_vec3_2, this.erp / time_delta );
	this.rows[0].bias = -vec3.dot( n1, _tmp_vec3_2 );
	this.rows[1].bias = -vec3.dot( n2, _tmp_vec3_2 );
};

Goblin.SliderConstraint.prototype._updateAngularConstraints = function( time_delta, n1, n2, axis ) {
	this.rows[2].jacobian[3] = this.rows[3].jacobian[4] = this.rows[4].jacobian[5] = -1;
	this.rows[2].jacobian[9] = this.rows[3].jacobian[10] = this.rows[4].jacobian[11] = 1;

	quat4.inverse( this.object_b.rotation, _tmp_quat4_1 );
	quat4.multiply( _tmp_quat4_1, this.object_a.rotation );

	quat4.inverse( this.rotation_difference, _tmp_quat4_2 );
	quat4.multiply( _tmp_quat4_2, _tmp_quat4_1 );
	// _tmp_quat4_2 is now the rotational error that needs to be corrected

	var error = vec3.create();
	error[0] = _tmp_quat4_2[0];
	error[1] = _tmp_quat4_2[1];
	error[2] = _tmp_quat4_2[2];
	vec3.scale( error, this.erp / time_delta );

	//this.rows[2].bias = error[0];
	//this.rows[3].bias = error[1];
	//this.rows[4].bias = error[2];
};