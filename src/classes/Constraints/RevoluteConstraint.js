Goblin.RevoluteConstraint = function( object_a, point_a, object_b, point_b ) {
	Goblin.Constraint.call( this );

	this.object_a = object_a;
	this.point_a = point_a;

	this.object_b = object_b || null;
	if ( this.object_b != null ) {
		this.point_b = point_b;
	} else {
		this.point_b = vec3.create();
		this.object_a.updateDerived(); // Ensure the body's transform is correct
		mat4.multiplyVec3( this.object_a.transform, this.point_a, this.point_b );
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
	var r1 = vec3.create(),
		r2 = vec3.create();

	return function( time_delta ) {
		mat4.multiplyVec3( this.object_a.transform, this.point_a, _tmp_vec3_1 );
		vec3.subtract( _tmp_vec3_1, this.object_a.position, r1 );

		this.rows[0].jacobian[0] = -1;
		this.rows[0].jacobian[1] = 0;
		this.rows[0].jacobian[2] = 0;
		this.rows[0].jacobian[3] = 0;
		this.rows[0].jacobian[4] = -r1[2];
		this.rows[0].jacobian[5] = r1[1];

		this.rows[1].jacobian[0] = 0;
		this.rows[1].jacobian[1] = -1;
		this.rows[1].jacobian[2] = 0;
		this.rows[1].jacobian[3] = r1[2];
		this.rows[1].jacobian[4] = 0;
		this.rows[1].jacobian[5] = -r1[0];

		this.rows[2].jacobian[0] = 0;
		this.rows[2].jacobian[1] = 0;
		this.rows[2].jacobian[2] = -1;
		this.rows[2].jacobian[3] = -r1[1];
		this.rows[2].jacobian[4] = r1[0];
		this.rows[2].jacobian[5] = 0;

		if ( this.object_b != null ) {
			mat4.multiplyVec3( this.object_b.transform, this.point_b, _tmp_vec3_2 );
			vec3.subtract( _tmp_vec3_2, this.object_b.position, r2 );

			this.rows[0].jacobian[6] = 1;
			this.rows[0].jacobian[7] = 0;
			this.rows[0].jacobian[8] = 0;
			this.rows[0].jacobian[9] = 0;
			this.rows[0].jacobian[10] = r2[2];
			this.rows[0].jacobian[11] = -r2[1];

			this.rows[1].jacobian[6] = 0;
			this.rows[1].jacobian[7] = 1;
			this.rows[1].jacobian[8] = 0;
			this.rows[1].jacobian[9] = -r2[2];
			this.rows[1].jacobian[10] = 0;
			this.rows[1].jacobian[11] = r2[0];

			this.rows[2].jacobian[6] = 0;
			this.rows[2].jacobian[7] = 0;
			this.rows[2].jacobian[8] = 1;
			this.rows[2].jacobian[9] = r2[1];
			this.rows[2].jacobian[10] = -r2[0];
			this.rows[2].jacobian[11] = 0;
		} else {
			vec3.set( this.point_b, _tmp_vec3_2 );
		}

		vec3.subtract( _tmp_vec3_1, _tmp_vec3_2, _tmp_vec3_3 );
		vec3.scale( _tmp_vec3_3, this.erp / time_delta );
		this.rows[0].bias = _tmp_vec3_3[0];
		this.rows[1].bias = _tmp_vec3_3[1];
		this.rows[2].bias = _tmp_vec3_3[2];
	};
})();