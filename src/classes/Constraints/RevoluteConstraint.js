Goblin.RevoluteConstraint = function( object_a, point_a, object_b, point_b ) {
	Goblin.Constraint.call( this );

	this.object_a = object_a;
	this.point_a = point_a;

	this.object_b = object_b || null;
	if ( this.object_b != null ) {
		this.point_b = point_b;
	} else {
		this.point_b = new Goblin.Vector3();
		this.object_a.updateDerived(); // Ensure the body's transform is correct
		this.object_a.transform.transformVector3Into( this.point_a, this.point_b );
	}

	this.erp = 0.1;

	// Create rows
	for ( var i = 0; i < 3; i++ ) {
		this.rows[i] = Goblin.ObjectPool.getObject( 'ConstraintRow' );
		this.rows[i].lower_limit = -Infinity;
		this.rows[i].upper_limit = Infinity;
		this.rows[i].bias = 0;

		this.rows[i].jacobian[6] = this.rows[i].jacobian[7] = this.rows[i].jacobian[8] =
			this.rows[i].jacobian[9] = this.rows[i].jacobian[10] = this.rows[i].jacobian[11] = 0;
	}
};
Goblin.RevoluteConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.RevoluteConstraint.prototype.update = (function(){
	var r1 = new Goblin.Vector3(),
		r2 = new Goblin.Vector3();

	return function( time_delta ) {
		this.object_a.transform.transformVector3Into( this.point_a, _tmp_vec3_1 );
		r1.subtractVectors( _tmp_vec3_1, this.object_a.position );

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

		if ( this.object_b != null ) {
			this.object_b.transform.transformVector3Into( this.point_b, _tmp_vec3_2 );
			r2.subtractVectors( _tmp_vec3_2, this.object_b.position );

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
		} else {
			_tmp_vec3_2.copy( this.point_b );
		}

		_tmp_vec3_3.subtractVectors( _tmp_vec3_1, _tmp_vec3_2 );
		_tmp_vec3_3.scale( this.erp / time_delta );
		this.rows[0].bias = _tmp_vec3_3.x;
		this.rows[1].bias = _tmp_vec3_3.y;
		this.rows[2].bias = _tmp_vec3_3.z;
	};
})( );