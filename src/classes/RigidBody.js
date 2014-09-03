/**
 * Represents a rigid body
 *
 * @class RigidBody
 * @constructor
 * @param shape
 * @param mass {Number}
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
		 * shape definition for this rigid body
		 *
		 * @property shape
		 */
		this.shape = shape;

        /**
         * axis-aligned bounding box enclosing this body
         *
         * @property aabb
         * @type {AABB}
         */
        this.aabb = new Goblin.AABB();

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
		 * amount of restitution this object has
		 *
		 * @property restitution
		 * @type {Number}
		 * @default 0.1
		 */
		this.restitution = 0.1;

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
		 * proportion of linear velocity lost per second ( 0.0 - 1.0 )
		 *
		 * @property linear_damping
		 * @type {Number}
		 */
		this.linear_damping = 0;

		/**
		 * proportion of angular velocity lost per second ( 0.0 - 1.0 )
		 *
		 * @property angular_damping
		 * @type {Number}
		 */
		this.angular_damping = 0;

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

		this.listeners = {};
	};
})();
Goblin.EventEmitter.apply( Goblin.RigidBody );

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
 * Checks if a ray segment intersects with the object
 *
 * @method rayIntersect
 * @property ray_start {vec3} start point of the segment
 * @property ray_end {vec3{ end point of the segment
 * @property intersection_list {Array} array to append intersection to
 */
Goblin.RigidBody.prototype.rayIntersect = (function(){
	var local_start = vec3.create(),
		local_end = vec3.create();

	return function( ray_start, ray_end, intersection_list ) {
		// transform start & end into local coordinates
		mat4.multiplyVec3( this.transform_inverse, ray_start, local_start );
		mat4.multiplyVec3( this.transform_inverse, ray_end, local_end );

		// Intersect with shape
		var intersection = this.shape.rayIntersect( local_start, local_end );

		if ( intersection != null ) {
			intersection.object = this; // change from the shape to the body
			mat4.multiplyVec3( this.transform, intersection.point ); // transform shape's local coordinates to the body's world coordinates

            // Rotate intersection normal
            mat4.toMat3( this.transform, _tmp_mat3_1 );
            mat3.multiplyVec3( _tmp_mat3_1, intersection.normal );

			intersection_list.push( intersection );
		}
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
	vec3.add( this.angular_velocity, _tmp_vec3_1 );

	// Apply damping
	vec3.scale( this.linear_velocity, Math.pow( 1 - this.linear_damping, timestep ) );
	vec3.scale( this.angular_velocity, Math.pow( 1 - this.angular_damping, timestep ) );

	// Update position
	vec3.scale( this.linear_velocity, timestep, _tmp_vec3_1 );
	vec3.add( this.position, _tmp_vec3_1 );

	// Update rotation
	_tmp_quat4_1[0] = this.angular_velocity[0] * timestep;
	_tmp_quat4_1[1] = this.angular_velocity[1] * timestep;
	_tmp_quat4_1[2] = this.angular_velocity[2] * timestep;
	_tmp_quat4_1[3] = 0;

	quat4.multiply( _tmp_quat4_1, this.rotation );

	var half_dt = 0.5;
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
 * Directly adds linear velocity to the body
 *
 * @method applyImpulse
 * @param impulse {vec3} linear velocity to add to the body
 */
Goblin.RigidBody.prototype.applyImpulse = function( impulse ) {
	vec3.add( this.linear_velocity, impulse );
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

Goblin.RigidBody.prototype.getVelocityInLocalPoint = function( point, out ) {
	vec3.set( this.angular_velocity, out );
	vec3.cross( out, point );
	vec3.add( out, this.linear_velocity );
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

	// Update AABB
	this.aabb.transform( this.shape.aabb, this.transform );
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