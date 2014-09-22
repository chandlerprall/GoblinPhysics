Goblin.ContactConstraint = function() {
	Goblin.Constraint.call( this );

	this.contact = null;
};
Goblin.ContactConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.ContactConstraint.prototype.buildFromContact = function( contact ) {
	this.object_a = contact.object_a;
	this.object_b = contact.object_b;
	this.contact = contact;

	var self = this;
	var onDestroy = function() {
		this.removeListener( 'destroy', onDestroy );
		self.deactivate();
	};
	this.contact.addListener( 'destroy', onDestroy );

	var row = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );
	row.lower_limit = 0;
	row.upper_limit = Infinity;
	this.rows[0] = row;

	this.update();
};

Goblin.ContactConstraint.prototype.update = function() {
	var row = this.rows[0];

	if ( this.object_a == null || this.object_a.mass === Infinity ) {
		row.jacobian[0] = row.jacobian[1] = row.jacobian[2] = 0;
		row.jacobian[3] = row.jacobian[4] = row.jacobian[5] = 0;
	} else {
		row.jacobian[0] = -this.contact.contact_normal.x;
		row.jacobian[1] = -this.contact.contact_normal.y;
		row.jacobian[2] = -this.contact.contact_normal.z;

		_tmp_vec3_1.subtractVectors( this.contact.contact_point, this.contact.object_a.position );
		_tmp_vec3_1.cross( this.contact.contact_normal );
		row.jacobian[3] = -_tmp_vec3_1.x;
		row.jacobian[4] = -_tmp_vec3_1.y;
		row.jacobian[5] = -_tmp_vec3_1.z;
	}

	if ( this.object_b == null || this.object_b.mass === Infinity ) {
		row.jacobian[6] = row.jacobian[7] = row.jacobian[8] = 0;
		row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;
	} else {
		row.jacobian[6] = this.contact.contact_normal.x;
		row.jacobian[7] = this.contact.contact_normal.y;
		row.jacobian[8] = this.contact.contact_normal.z;

		_tmp_vec3_1.subtractVectors( this.contact.contact_point, this.contact.object_b.position );
		_tmp_vec3_1.cross( this.contact.contact_normal );
		row.jacobian[9] = _tmp_vec3_1.x;
		row.jacobian[10] = _tmp_vec3_1.y;
		row.jacobian[11] = _tmp_vec3_1.z;
	}

	// Pre-calc error
	row.bias = 0;

	// Apply restitution
	var velocity_along_normal = 0;
	if ( this.object_a.mass !== Infinity ) {
		this.object_a.getVelocityInLocalPoint( this.contact.contact_point_in_a, _tmp_vec3_1 );
		velocity_along_normal += _tmp_vec3_1.dot( this.contact.contact_normal );
	}
	if ( this.object_b.mass !== Infinity ) {
		this.object_b.getVelocityInLocalPoint( this.contact.contact_point_in_b, _tmp_vec3_1 );
		velocity_along_normal -= _tmp_vec3_1.dot( this.contact.contact_normal );
	}

	// Add restitution to bias
	row.bias += velocity_along_normal * this.contact.restitution;
};