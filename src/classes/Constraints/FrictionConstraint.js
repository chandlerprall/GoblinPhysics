Goblin.FrictionConstraint = function() {
	Goblin.Constraint.call( this );

	this.contact = null;
};
Goblin.FrictionConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.FrictionConstraint.prototype.buildFromContact = function( contact ) {
	this.rows[0] = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );
	this.rows[1] = this.rows[1] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;
	this.contact = contact;

	var self = this;
	var onDestroy = function() {
		this.removeListener( 'destroy', onDestroy );
		self.deactivate();
	};
	this.contact.addListener( 'destroy', onDestroy );

	this.update();
};

Goblin.FrictionConstraint.prototype.update = (function(){
	var rel_a = new Goblin.Vector3(),
		rel_b = new Goblin.Vector3(),
		u1 = new Goblin.Vector3(),
		u2 = new Goblin.Vector3();

	return function updateFrictionConstraint() {
		var row_1 = this.rows[0],
			row_2 = this.rows[1];

		// Find the contact point relative to object_a and object_b
		rel_a.subtractVectors( this.contact.contact_point, this.object_a.position );
		rel_b.subtractVectors( this.contact.contact_point, this.object_b.position );

		this.contact.contact_normal.findOrthogonal( u1, u2 );

		if ( this.object_a == null || this.object_a._mass === Infinity ) {
			row_1.jacobian[0] = row_1.jacobian[1] = row_1.jacobian[2] = 0;
			row_1.jacobian[3] = row_1.jacobian[4] = row_1.jacobian[5] = 0;
			row_2.jacobian[0] = row_2.jacobian[1] = row_2.jacobian[2] = 0;
			row_2.jacobian[3] = row_2.jacobian[4] = row_2.jacobian[5] = 0;
		} else {
			row_1.jacobian[0] = -u1.x;
			row_1.jacobian[1] = -u1.y;
			row_1.jacobian[2] = -u1.z;

			_tmp_vec3_1.crossVectors( rel_a, u1 );
			row_1.jacobian[3] = -_tmp_vec3_1.x;
			row_1.jacobian[4] = -_tmp_vec3_1.y;
			row_1.jacobian[5] = -_tmp_vec3_1.z;

			row_2.jacobian[0] = -u2.x;
			row_2.jacobian[1] = -u2.y;
			row_2.jacobian[2] = -u2.z;

			_tmp_vec3_1.crossVectors( rel_a, u2 );
			row_2.jacobian[3] = -_tmp_vec3_1.x;
			row_2.jacobian[4] = -_tmp_vec3_1.y;
			row_2.jacobian[5] = -_tmp_vec3_1.z;
		}

		if ( this.object_b == null || this.object_b._mass === Infinity ) {
			row_1.jacobian[6] = row_1.jacobian[7] = row_1.jacobian[8] = 0;
			row_1.jacobian[9] = row_1.jacobian[10] = row_1.jacobian[11] = 0;
			row_2.jacobian[6] = row_2.jacobian[7] = row_2.jacobian[8] = 0;
			row_2.jacobian[9] = row_2.jacobian[10] = row_2.jacobian[11] = 0;
		} else {
			row_1.jacobian[6] = u1.x;
			row_1.jacobian[7] = u1.y;
			row_1.jacobian[8] = u1.z;

			_tmp_vec3_1.crossVectors( rel_b, u1 );
			row_1.jacobian[9] = _tmp_vec3_1.x;
			row_1.jacobian[10] = _tmp_vec3_1.y;
			row_1.jacobian[11] = _tmp_vec3_1.z;

			row_2.jacobian[6] = u2.x;
			row_2.jacobian[7] = u2.y;
			row_2.jacobian[8] = u2.z;

			_tmp_vec3_1.crossVectors( rel_b, u2 );
			row_2.jacobian[9] = _tmp_vec3_1.x;
			row_2.jacobian[10] = _tmp_vec3_1.y;
			row_2.jacobian[11] = _tmp_vec3_1.z;
		}

		var limit = this.contact.friction;
		if (this.object_a != null && this.object_a._mass !== Infinity) {
			limit *= this.object_a._mass;
		}
		if (this.object_b != null && this.object_b._mass !== Infinity) {
			limit *= this.object_b._mass;
		}
		if ( limit < 0 ) {
			limit = 0;
		}
		row_1.lower_limit = row_2.lower_limit = -limit;
		row_1.upper_limit = row_2.upper_limit = limit;

		row_1.bias = row_2.bias = 0;

		this.rows[0] = row_1;
		this.rows[1] = row_2;
	};
})();