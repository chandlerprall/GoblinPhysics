/**
 * Represents a rigid body
 *
 * @class RigidBody
 * @constructor
 * @param bounding_radius {Number} distance from the center of the object to the furthest point on the object,
 *                                 creating a bounding sphere which envelops the object
 * @param mass {Number} mass of the rigid body
 */
Goblin.RigidBody = (function() {
	var body_count = 0;

	return function( shape, mass ) {
		/**
		 * goblin ID of the body
		 *
		 * @property id
		 * @type {Number}
		 */
		this.id = body_count++;

		/**
		 * distance from the center of the object to the furthest point in the object,
		 * creating a bounding sphere enveloping the object
		 *
		 * @property bounding_radius
		 * @type {Number}
		 */
		this.bounding_radius = shape.getBoundingRadius();

		/**
		 * shape definition for this rigid body
		 *
		 * @property shape
		 */
		this.shape = shape;

		/**
		 * the rigid body's mass
		 *
		 * @property mass
		 * @type {Number}
		 * @default Infinity
		 */
		this.mass = mass || Infinity;

		/**
		 * the rigid body's current position
		 *
		 * @property position
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.position = vec3.create();

		/**
		 * rotation of the rigid body
		 *
		 * @type {quat4}
		 */
		this.rotation = quat4.createFrom( 0, 0, 0, 1 );

		/**
		 * the rigid body's current linear velocity
		 *
		 * @property linear_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_velocity = vec3.create();

		/**
		 * the rigid body's current angular velocity
		 *
		 * @property angular_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_velocity = vec3.create();

		/**
		 * transformation matrix transforming points from object space to world space
		 *
		 * @property transform
		 * @type {mat4}
		 */
		this.transform = mat4.identity();

		/**
		 * transformation matrix transforming points from world space to object space
		 *
		 * @property transform_inverse
		 * @type {mat4}
		 */
		this.transform_inverse = mat4.identity();

		this.inertiaTensor = shape.getInertiaTensor( mass );

		this.inverseInertiaTensor = mat3.inverse( this.inertiaTensor );

		this.inertiaTensorWorldFrame = mat3.create();

		this.inverseInertiaTensorWorldFrame = mat3.create();

		/**
		 * the rigid body's current acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.acceleration = vec3.create();

		/**
		 * amount of linear damping to apply to the rigid body's velocity
		 *
		 * @property linear_damping
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_damping = vec3.createFrom( 0, 0, 0 );

		/**
		 * amount of angular damping to apply to the rigid body's rotation
		 *
		 * @property angular_damping
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_damping = vec3.createFrom( 0, 0, 0 );

		/**
		 * amount of restitution this object has
		 *
		 * @property restitution
		 * @type {Number}
		 * @default 0.2
		 */
		this.restitution = 0.2;

		/**
		 * amount of friction this object has
		 *
		 * @property friction
		 * @type {Number}
		 * @default 0.5
		 */
		this.friction = 0.5;

		/**
		 * the rigid body's custom gravity
		 *
		 * @property gravity
		 * @type {vec3}
		 * @default null
		 * @private
		 */
		this.gravity = null;

		/**
		 * the world to which the rigid body has been added,
		 * this is set when the rigid body is added to a world
		 *
		 * @property world
		 * @type {Goblin.World}
		 * @default null
		 */
		this.world = null;

		/**
		 * all resultant force accumulated by the rigid body
		 * this force is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_force = vec3.create();

		/**
		 * All resultant torque accumulated by the rigid body
		 * this torque is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_torque = vec3.create();

		// Used by the constraint solver to determine what impulse needs to be added to the body
		this.push_velocity = vec3.create();
		this.turn_velocity = vec3.create();
		this.solver_impulse = new Float64Array( 6 );

		// Set default derived values
		this.updateDerived();
	};
})();

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.RigidBody.prototype.findSupportPoint = (function(){
	var local_direction = vec3.create();
	return function( direction, support_point ) {
		// Convert direction into local frame for the shape
		// cells 12-14 are the position offset which we don't want to use for changing the direction vector
		var x = this.transform_inverse[12],
			y = this.transform_inverse[13],
			z = this.transform_inverse[14];
		this.transform_inverse[12] = this.transform_inverse[13] = this.transform_inverse[14] = 0;

		// Apply rotation
		mat4.multiplyVec3( this.transform_inverse, direction, local_direction );

		// Reset transform
		this.transform_inverse[12] = x;
		this.transform_inverse[13] = y;
		this.transform_inverse[14] = z;

		this.shape.findSupportPoint( local_direction, support_point );

		// Convert from the shape's local coordinates to world coordinates
		mat4.multiplyVec3( this.transform, support_point );
	};
})();

/**
 * Updates the rigid body's position, velocity, and acceleration
 *
 * @method integrate
 * @param timestep {Number} time, in seconds, to use in integration
 */
Goblin.RigidBody.prototype.integrate = function( timestep ) {
	if ( this.mass === Infinity ) {
		return;
	}

	var invmass = 1 / this.mass;

	// Add accumulated linear force
	vec3.scale( this.accumulated_force, invmass, _tmp_vec3_1 );
	vec3.add( this.linear_velocity, _tmp_vec3_1 );

	// Add accumulated angular force
	mat3.multiplyVec3 ( this.inverseInertiaTensorWorldFrame, this.accumulated_torque, _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, timestep );
	vec3.add( this.angular_velocity, _tmp_vec3_1 );

	// Apply damping
	this.linear_velocity[0] *= 1 / ( 1 + timestep * this.linear_damping[0] );
	this.linear_velocity[1] *= 1 / ( 1 + timestep * this.linear_damping[1] );
	this.linear_velocity[2] *= 1 / ( 1 + timestep * this.linear_damping[2] );
	this.angular_velocity[0] *= 1 / ( 1 + timestep * this.angular_damping[0] );
	this.angular_velocity[1] *= 1 / ( 1 + timestep * this.angular_damping[1] );
	this.angular_velocity[2] *= 1 / ( 1 + timestep * this.angular_damping[2] );

	// Update position
	vec3.scale( this.linear_velocity, timestep, _tmp_vec3_1 );
	vec3.add( this.position, _tmp_vec3_1 );

	// Update rotation
	_tmp_quat4_1[0] = this.angular_velocity[0];
	_tmp_quat4_1[1] = this.angular_velocity[1];
	_tmp_quat4_1[2] = this.angular_velocity[2];
	_tmp_quat4_1[3] = 0;

	quat4.multiply( _tmp_quat4_1, this.rotation );

	var half_dt = timestep * 0.5;
	this.rotation[0] += half_dt * _tmp_quat4_1[0];
	this.rotation[1] += half_dt * _tmp_quat4_1[1];
	this.rotation[2] += half_dt * _tmp_quat4_1[2];
	this.rotation[3] += half_dt * _tmp_quat4_1[3];
	quat4.normalize( this.rotation );

	// Clear accumulated forces
	this.accumulated_force[0] = this.accumulated_force[1] = this.accumulated_force[2] = 0;
	this.accumulated_torque[0] = this.accumulated_torque[1] = this.accumulated_torque[2] = 0;
	this.solver_impulse[0] = this.solver_impulse[1] = this.solver_impulse[2] = this.solver_impulse[3] = this.solver_impulse[4] = this.solver_impulse[5] = 0;
	this.push_velocity[0] = this.push_velocity[1] = this.push_velocity[2] = 0;
	this.turn_velocity[0] = this.turn_velocity[1] = this.turn_velocity[2] = 0;
};

/**
 * Sets a custom gravity value for this rigid_body
 *
 * @method setGravity
 * @param x {Number} gravity to apply on x axis
 * @param y {Number} gravity to apply on y axis
 * @param z {Number} gravity to apply on z axis
 */
Goblin.RigidBody.prototype.setGravity = function( x, y, z ) {
	if ( this.gravity ) {
		this.gravity[0] = x;
		this.gravity[1] = y;
		this.gravity[2] = z;
	} else {
		this.gravity = vec3.createFrom( x, y, z );
	}
};

/**
 * Adds a force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyForce = function( force ) {
	vec3.add( this.accumulated_force, force );
};

/**
 * Applies the vector `force` at world coordinate `point`
 *
 * @method applyForceAtWorldPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} world coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtWorldPoint = function( force, point ) {
	// @TODO support for moving center of mass
	var _vec3 = _tmp_vec3_1;
	vec3.set( point, _vec3 );
	vec3.subtract( _vec3, this.position );
	vec3.cross( _vec3, force );

	vec3.add( this.accumulated_force, force );
	vec3.add( this.accumulated_torque, _vec3 );
};

/**
 * Applies vector `force` to body at position `point` in body's frame
 *
 * @method applyForceAtLocalPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} local frame coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtLocalPoint = function( force, point ) {
	var _vec3 = _tmp_vec3_1;
	mat4.multiplyVec3( this.transform, point, _vec3 );
	this.applyForceAtWorldPoint( force, _vec3 );
};

/**
 * Sets the rigid body's transformation matrix to the current position and rotation
 *
 * @method updateDerived
 */
Goblin.RigidBody.prototype.updateDerived = function() {
	// normalize rotation
	quat4.normalize( this.rotation );

	// update this.transform and this.transform_inverse
	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	// update this.inverseInertiaTensorWorldFrame
	if ( this.mass !== Infinity ) {
		this.updateInverseInertiaTensorWorldFrame();
	}
};

Goblin.RigidBody.prototype.updateInverseInertiaTensorWorldFrame = function() {
	var rotmat = this.transform,
		iitWorld = this.inverseInertiaTensorWorldFrame,
		iitBody = this.inverseInertiaTensor,
		q = this.rotation;

	var t4 = rotmat[0]*iitBody[0]+
		rotmat[1]*iitBody[3]+
		rotmat[2]*iitBody[6];
	var t9 = rotmat[0]*iitBody[1]+
		rotmat[1]*iitBody[4]+
		rotmat[2]*iitBody[7];
	var t14 = rotmat[0]*iitBody[2]+
		rotmat[1]*iitBody[5]+
		rotmat[2]*iitBody[8];
	var t28 = rotmat[4]*iitBody[0]+
		rotmat[5]*iitBody[3]+
		rotmat[6]*iitBody[6];
	var t33 = rotmat[4]*iitBody[1]+
		rotmat[5]*iitBody[4]+
		rotmat[6]*iitBody[7];
	var t38 = rotmat[4]*iitBody[2]+
		rotmat[5]*iitBody[5]+
		rotmat[6]*iitBody[8];
	var t52 = rotmat[8]*iitBody[0]+
		rotmat[9]*iitBody[3]+
		rotmat[10]*iitBody[6];
	var t57 = rotmat[8]*iitBody[1]+
		rotmat[9]*iitBody[4]+
		rotmat[10]*iitBody[7];
	var t62 = rotmat[8]*iitBody[2]+
		rotmat[9]*iitBody[5]+
		rotmat[10]*iitBody[8];
	iitWorld[0] = t4*rotmat[0]+
		t9*rotmat[1]+
		t14*rotmat[2];
	iitWorld[1] = t4*rotmat[4]+
		t9*rotmat[5]+
		t14*rotmat[6];
	iitWorld[2] = t4*rotmat[8]+
		t9*rotmat[9]+
		t14*rotmat[10];
	iitWorld[3] = t28*rotmat[0]+
		t33*rotmat[1]+
		t38*rotmat[2];
	iitWorld[4] = t28*rotmat[4]+
		t33*rotmat[5]+
		t38*rotmat[6];
	iitWorld[5] = t28*rotmat[8]+
		t33*rotmat[9]+
		t38*rotmat[10];
	iitWorld[6] = t52*rotmat[0]+
		t57*rotmat[1]+
		t62*rotmat[2];
	iitWorld[7] = t52*rotmat[4]+
		t57*rotmat[5]+
		t62*rotmat[6];
	iitWorld[8] = t52*rotmat[8]+
		t57*rotmat[9]+
		t62*rotmat[10];

	mat3.inverse( this.inverseInertiaTensorWorldFrame, this.inertiaTensorWorldFrame );
};