function getConstraintRow() {
	var row =  Goblin.ObjectPool.getObject( 'ConstraintRow' );
	row.lower_limit = -Infinity;
	row.upper_limit = Infinity;
	row.bias = 0;

	row.jacobian[0] = row.jacobian[1] = row.jacobian[2] =
	row.jacobian[3] = row.jacobian[4] = row.jacobian[5] =
	row.jacobian[6] = row.jacobian[7] = row.jacobian[8] =
	row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;

	return row;
}

Goblin.HingeConstraint = function( object_a, hinge_a, point_a, object_b, point_b ) {
	Goblin.Constraint.call( this );

	this.object_a = object_a;
	this.hinge_a = hinge_a;
	this.point_a = point_a;

	this.initial_quaternion = new Goblin.Quaternion();
	this.limit_min = null;
	this.limit_max = null;
	this.limit_row = null;

	this.object_b = object_b || null;
	this.point_b = new Goblin.Vector3();
	this.hinge_b = new Goblin.Vector3();
	if ( this.object_b != null ) {
		this.object_a.rotation.transformVector3Into( this.hinge_a, this.hinge_b );
		_tmp_quat4_1.invertQuaternion( this.object_b.rotation );
		_tmp_quat4_1.transformVector3( this.hinge_b );

		this.point_b = point_b;

		this.initial_quaternion.set( this.object_b.rotation.x, this.object_b.rotation.y, this.object_b.rotation.z, this.object_b.rotation.w );
		this.initial_quaternion.multiply( this.object_a.rotation );
	} else {
		this.object_a.updateDerived(); // Ensure the body's transform is correct
		this.object_a.rotation.transformVector3Into( this.hinge_a, this.hinge_b );
		this.object_a.transform.transformVector3Into( this.point_a, this.point_b );
		this.initial_quaternion.set( this.object_a.rotation.x, this.object_a.rotation.y, this.object_a.rotation.z, this.object_a.rotation.w );
	}

	this.erp = 0.1;

	// Create rows
	// rows 0,1,2 are the same as point constraint and constrain the objects' positions
	// rows 3,4 introduce the rotational constraints which constrains angular velocity orthogonal to the hinge axis
	for ( var i = 0; i < 5; i++ ) {
		this.rows[i] = getConstraintRow();
	}
};
Goblin.HingeConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.HingeConstraint.prototype.updateLimits = function( time_delta, world_axis ) {
	if ( this.object_b == null ) {
		// this.initial_quaternion is the original rotation of object_a
		var separating_angle = this.initial_quaternion.signedAngleBetween( this.object_a.rotation, world_axis );

		if ( this.limit_min != null && separating_angle <= this.limit_min ) {
			if ( this.limit_row == null ) {
				this.limit_row = getConstraintRow();
				this.limit_row.upper_limit = 0;
				this.rows.push( this.limit_row );
			}
			this.limit_row.jacobian[3] = -world_axis.x;
			this.limit_row.jacobian[4] = -world_axis.y;
			this.limit_row.jacobian[5] = -world_axis.z;

			var correction = separating_angle - this.limit_min;
			this.limit_row.bias = correction * this.erp / time_delta;
		} else if ( this.limit_max != null && separating_angle >= this.limit_max ) {
			if ( this.limit_row == null ) {
				this.limit_row = getConstraintRow();
				this.limit_row.lower_limit = 0;
				this.rows.push( this.limit_row );
			}
			this.limit_row.jacobian[3] = -world_axis.x;
			this.limit_row.jacobian[4] = -world_axis.y;
			this.limit_row.jacobian[5] = -world_axis.z;

			var correction = separating_angle - this.limit_max;
			this.limit_row.bias = correction * this.erp / time_delta;
		} else if ( this.limit_row != null ) {
			var row_idx = this.rows.indexOf( this.limit_row );
			this.rows.splice( row_idx, 1 );
			this.limit_row = null;
		}
	} else {
		// this.initial_quaternion is the original difference in rotation between object_a and object_b
	}
};

Goblin.HingeConstraint.prototype.update = (function(){
	var r1 = new Goblin.Vector3(),
		r2 = new Goblin.Vector3(),
		t1 = new Goblin.Vector3(),
		t2 = new Goblin.Vector3(),
		world_axis = new Goblin.Vector3();

	return function( time_delta ) {
		this.object_a.rotation.transformVector3Into( this.hinge_a, world_axis );

		this.object_a.transform.transformVector3Into( this.point_a, _tmp_vec3_1 );
		r1.subtractVectors( _tmp_vec3_1, this.object_a.position );

		// 0,1,2 are positional, same as PointConstraint
		this.rows[0].jacobian[0] = -1;
		this.rows[0].jacobian[1] = 0;
		this.rows[0].jacobian[2] = 0;
		this.rows[0].jacobian[3] = 0;
		this.rows[0].jacobian[4] = -r1.z;
		this.rows[0].jacobian[5] = r1.y;

		this.rows[1].jacobian[0] = 0;
		this.rows[1].jacobian[1] = -1;
		this.rows[1].jacobian[2] = 0;
		this.rows[1].jacobian[3] = r1.z;
		this.rows[1].jacobian[4] = 0;
		this.rows[1].jacobian[5] = -r1.x;

		this.rows[2].jacobian[0] = 0;
		this.rows[2].jacobian[1] = 0;
		this.rows[2].jacobian[2] = -1;
		this.rows[2].jacobian[3] = -r1.y;
		this.rows[2].jacobian[4] = r1.x;
		this.rows[2].jacobian[5] = 0;

		// 3,4 are rotational, constraining motion orthogonal to axis
		world_axis.findOrthogonal( t1, t2 );
		this.rows[3].jacobian[3] = -t1.x;
		this.rows[3].jacobian[4] = -t1.y;
		this.rows[3].jacobian[5] = -t1.z;

		this.rows[4].jacobian[3] = -t2.x;
		this.rows[4].jacobian[4] = -t2.y;
		this.rows[4].jacobian[5] = -t2.z;

		if ( this.object_b != null ) {
			this.object_b.transform.transformVector3Into( this.point_b, _tmp_vec3_2 );
			r2.subtractVectors( _tmp_vec3_2, this.object_b.position );

			// 0,1,2 are positional, same as PointConstraint
			this.rows[0].jacobian[6] = 1;
			this.rows[0].jacobian[7] = 0;
			this.rows[0].jacobian[8] = 0;
			this.rows[0].jacobian[9] = 0;
			this.rows[0].jacobian[10] = r2.z;
			this.rows[0].jacobian[11] = -r2.y;

			this.rows[1].jacobian[6] = 0;
			this.rows[1].jacobian[7] = 1;
			this.rows[1].jacobian[8] = 0;
			this.rows[1].jacobian[9] = -r2.z;
			this.rows[1].jacobian[10] = 0;
			this.rows[1].jacobian[11] = r2.x;

			this.rows[2].jacobian[6] = 0;
			this.rows[2].jacobian[7] = 0;
			this.rows[2].jacobian[8] = 1;
			this.rows[2].jacobian[9] = r2.y;
			this.rows[2].jacobian[10] = -r2.z;
			this.rows[2].jacobian[11] = 0;

			// 3,4 are rotational, constraining motion orthogonal to axis
			this.rows[3].jacobian[9] = t1.x;
			this.rows[3].jacobian[10] = t1.y;
			this.rows[3].jacobian[11] = t1.z;

			this.rows[4].jacobian[9] = t2.x;
			this.rows[4].jacobian[10] = t2.y;
			this.rows[4].jacobian[11] = t2.z;
		} else {
			_tmp_vec3_2.copy( this.point_b );
		}

		// Linear error correction
		_tmp_vec3_3.subtractVectors( _tmp_vec3_1, _tmp_vec3_2 );
		_tmp_vec3_3.scale( this.erp / time_delta );
		this.rows[0].bias = _tmp_vec3_3.x;
		this.rows[1].bias = _tmp_vec3_3.y;
		this.rows[2].bias = _tmp_vec3_3.z;

		// Angular error correction
		if (this.object_b != null) {
			this.object_a.rotation.transformVector3Into(this.hinge_a, _tmp_vec3_1);
			this.object_b.rotation.transformVector3Into(this.hinge_b, _tmp_vec3_2);
			_tmp_vec3_1.cross(_tmp_vec3_2);
			this.rows[3].bias = -_tmp_vec3_1.dot(t1);
			this.rows[4].bias = -_tmp_vec3_1.dot(t2);
		} else {
			this.rows[3].bias = this.rows[4].bias = 0;
		}

		// limits & motor
		this.updateLimits( time_delta, world_axis );
	};
})( );