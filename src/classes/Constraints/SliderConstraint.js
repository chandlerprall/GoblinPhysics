Goblin.SliderConstraint = function( object_a, axis, object_b ) {
	Goblin.Constraint.call( this );

	this.object_a = object_a;
	this.axis = axis;
	this.object_b = object_b;

	// Find the initial distance between the two objects in object_a's local frame
	this.position_error = new Goblin.Vector3();
	this.position_error.subtractVectors( this.object_b.position, this.object_a.position );
	_tmp_quat4_1.invertQuaternion( this.object_a.rotation );
	_tmp_quat4_1.transformVector3( this.position_error );

	this.rotation_difference = new Goblin.Quaternion();
	if ( this.object_b != null ) {
		_tmp_quat4_1.invertQuaternion( this.object_b.rotation );
		this.rotation_difference.multiplyQuaternions( _tmp_quat4_1, this.object_a.rotation );
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
	var _axis = new Goblin.Vector3(),
		n1 = new Goblin.Vector3(),
		n2 = new Goblin.Vector3();

	return function( time_delta ) {
		// `axis` is in object_a's local frame, convert to world
		this.object_a.rotation.transformVector3Into( this.axis, _axis );

		// Find two vectors that are orthogonal to `axis`
		_axis.findOrthogonal( n1, n2 );

		this._updateLinearConstraints( time_delta, n1, n2 );
		this._updateAngularConstraints( time_delta, n1, n2 );
	};
})();

Goblin.SliderConstraint.prototype._updateLinearConstraints = function( time_delta, n1, n2 ) {
	var c = new Goblin.Vector3();
	c.subtractVectors( this.object_b.position, this.object_a.position );
	//c.scale( 0.5 );

	var cx = new Goblin.Vector3( );

	// first linear constraint
	cx.crossVectors( c, n1 );
	this.rows[0].jacobian[0] = -n1.x;
	this.rows[0].jacobian[1] = -n1.y;
	this.rows[0].jacobian[2] = -n1.z;
	//this.rows[0].jacobian[3] = -cx[0];
	//this.rows[0].jacobian[4] = -cx[1];
	//this.rows[0].jacobian[5] = -cx[2];

	this.rows[0].jacobian[6] = n1.x;
	this.rows[0].jacobian[7] = n1.y;
	this.rows[0].jacobian[8] = n1.z;
	this.rows[0].jacobian[9] = 0;
	this.rows[0].jacobian[10] = 0;
	this.rows[0].jacobian[11] = 0;

	// second linear constraint
	cx.crossVectors( c, n2 );
	this.rows[1].jacobian[0] = -n2.x;
	this.rows[1].jacobian[1] = -n2.y;
	this.rows[1].jacobian[2] = -n2.z;
	//this.rows[1].jacobian[3] = -cx[0];
	//this.rows[1].jacobian[4] = -cx[1];
	//this.rows[1].jacobian[5] = -cx[2];

	this.rows[1].jacobian[6] = n2.x;
	this.rows[1].jacobian[7] = n2.y;
	this.rows[1].jacobian[8] = n2.z;
	this.rows[1].jacobian[9] = 0;
	this.rows[1].jacobian[10] = 0;
	this.rows[1].jacobian[11] = 0;

	// linear constraint error
	//c.scale( 2  );
	this.object_a.rotation.transformVector3Into( this.position_error, _tmp_vec3_1 );
	_tmp_vec3_2.subtractVectors( c, _tmp_vec3_1 );
	_tmp_vec3_2.scale( this.erp / time_delta  );
	this.rows[0].bias = -n1.dot( _tmp_vec3_2 );
	this.rows[1].bias = -n2.dot( _tmp_vec3_2 );
};

Goblin.SliderConstraint.prototype._updateAngularConstraints = function( time_delta, n1, n2, axis ) {
	this.rows[2].jacobian[3] = this.rows[3].jacobian[4] = this.rows[4].jacobian[5] = -1;
	this.rows[2].jacobian[9] = this.rows[3].jacobian[10] = this.rows[4].jacobian[11] = 1;

	_tmp_quat4_1.invertQuaternion( this.object_b.rotation );
	_tmp_quat4_1.multiply( this.object_a.rotation );

	_tmp_quat4_2.invertQuaternion( this.rotation_difference );
	_tmp_quat4_2.multiply( _tmp_quat4_1 );
	// _tmp_quat4_2 is now the rotational error that needs to be corrected

	var error = new Goblin.Vector3();
	error.x = _tmp_quat4_2.x;
	error.y = _tmp_quat4_2.y;
	error.z = _tmp_quat4_2.z;
	error.scale( this.erp / time_delta  );

	//this.rows[2].bias = error[0];
	//this.rows[3].bias = error[1];
	//this.rows[4].bias = error[2];
};