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
		this.position = new Goblin.Vector3();

		/**
		 * rotation of the rigid body
		 *
		 * @type {quat4}
		 */
		this.rotation = new Goblin.Quaternion( 0, 0, 0, 1 );

		/**
		 * the rigid body's current linear velocity
		 *
		 * @property linear_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_velocity = new Goblin.Vector3();

		/**
		 * the rigid body's current angular velocity
		 *
		 * @property angular_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_velocity = new Goblin.Vector3();

		/**
		 * transformation matrix transforming points from object space to world space
		 *
		 * @property transform
		 * @type {mat4}
		 */
		this.transform = new Goblin.Matrix4();
		this.transform.identity();

		/**
		 * transformation matrix transforming points from world space to object space
		 *
		 * @property transform_inverse
		 * @type {mat4}
		 */
		this.transform_inverse = new Goblin.Matrix4();
		this.transform_inverse.identity();

		this.inertiaTensor = shape.getInertiaTensor( mass );

		this.inverseInertiaTensor = new Goblin.Matrix3();
		this.inertiaTensor.invertInto( this.inverseInertiaTensor );

		this.inertiaTensorWorldFrame = new Goblin.Matrix3();

		this.inverseInertiaTensorWorldFrame = new Goblin.Matrix3();

		/**
		 * the rigid body's current acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.acceleration = new Goblin.Vector3();

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
		this.accumulated_force = new Goblin.Vector3();

		/**
		 * All resultant torque accumulated by the rigid body
		 * this torque is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_torque = new Goblin.Vector3();

		// Used by the constraint solver to determine what impulse needs to be added to the body
		this.push_velocity = new Goblin.Vector3();
		this.turn_velocity = new Goblin.Vector3();
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
	var local_direction = new Goblin.Vector3();

	return function( direction, support_point ) {
		// Convert direction into local frame for the shape
		this.transform_inverse.rotateVector3Into( direction, local_direction );

		this.shape.findSupportPoint( local_direction, support_point );

		// Convert from the shape's local coordinates to world coordinates
		this.transform.transformVector3( support_point );
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
	var local_start = new Goblin.Vector3(),
		local_end = new Goblin.Vector3();

	return function( ray_start, ray_end, intersection_list ) {
		// transform start & end into local coordinates
		this.transform_inverse.transformVector3Into( ray_start, local_start );
		this.transform_inverse.transformVector3Into( ray_end, local_end );

		// Intersect with shape
		var intersection = this.shape.rayIntersect( local_start, local_end );

		if ( intersection != null ) {
			intersection.object = this; // change from the shape to the body
			this.transform.transformVector3( intersection.point ); // transform shape's local coordinates to the body's world coordinates

            // Rotate intersection normal
			this.transform.rotateVector3( intersection.normal );

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
	_tmp_vec3_1.scaleVector( this.accumulated_force, invmass );
	this.linear_velocity.add( _tmp_vec3_1 );

	// Add accumulated angular force
	this.inverseInertiaTensorWorldFrame.transformVector3Into( this.accumulated_torque, _tmp_vec3_1 );
	this.angular_velocity.add( _tmp_vec3_1 );

	// Apply damping
	this.linear_velocity.scale( Math.pow( 1 - this.linear_damping, timestep ) );
	this.angular_velocity.scale( Math.pow( 1 - this.angular_damping, timestep ) );

	// Update position
	_tmp_vec3_1.scaleVector( this.linear_velocity, timestep );
	this.position.add( _tmp_vec3_1 );

	// Update rotation
	_tmp_quat4_1.x = this.angular_velocity.x * timestep;
	_tmp_quat4_1.y = this.angular_velocity.y * timestep;
	_tmp_quat4_1.z = this.angular_velocity.z * timestep;
	_tmp_quat4_1.w = 0;

	_tmp_quat4_1.multiply( this.rotation );

	var half_dt = 0.5;
	this.rotation.x += half_dt * _tmp_quat4_1.x;
	this.rotation.y += half_dt * _tmp_quat4_1.y;
	this.rotation.z += half_dt * _tmp_quat4_1.z;
	this.rotation.w += half_dt * _tmp_quat4_1.w;
	this.rotation.normalize();

	// Clear accumulated forces
	this.accumulated_force.x = this.accumulated_force.y = this.accumulated_force.z = 0;
	this.accumulated_torque.x = this.accumulated_torque.y = this.accumulated_torque.z = 0;
	this.solver_impulse[0] = this.solver_impulse[1] = this.solver_impulse[2] = this.solver_impulse[3] = this.solver_impulse[4] = this.solver_impulse[5] = 0;
	this.push_velocity.x = this.push_velocity.y = this.push_velocity.z = 0;
	this.turn_velocity.x = this.turn_velocity.y = this.turn_velocity.z = 0;
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
		this.gravity.x = x;
		this.gravity.y = y;
		this.gravity.z = z;
	} else {
		this.gravity = new Goblin.Vector3( x, y, z );
	}
};

/**
 * Directly adds linear velocity to the body
 *
 * @method applyImpulse
 * @param impulse {vec3} linear velocity to add to the body
 */
Goblin.RigidBody.prototype.applyImpulse = function( impulse ) {
	this.linear_velocity.add( impulse );
};

/**
 * Adds a force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyForce = function( force ) {
	this.accumulated_force.add( force );
};

/**
 * Applies the vector `force` at world coordinate `point`
 *
 * @method applyForceAtWorldPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} world coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtWorldPoint = function( force, point ) {
	_tmp_vec3_1.copy( point );
	_tmp_vec3_1.subtract( this.position );
	_tmp_vec3_1.cross( force );

	this.accumulated_force.add( force );
	this.accumulated_torque.add( _tmp_vec3_1 );
};

/**
 * Applies vector `force` to body at position `point` in body's frame
 *
 * @method applyForceAtLocalPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} local frame coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtLocalPoint = function( force, point ) {
	this.transform.transformVector3Into( point, _tmp_vec3_1 );
	this.applyForceAtWorldPoint( force, _vec3 );
};

Goblin.RigidBody.prototype.getVelocityInLocalPoint = function( point, out ) {
	out.copy( this.angular_velocity );
	out.cross( point );
	out.add( this.linear_velocity );
};

/**
 * Sets the rigid body's transformation matrix to the current position and rotation
 *
 * @method updateDerived
 */
Goblin.RigidBody.prototype.updateDerived = function() {
	// normalize rotation
	this.rotation.normalize();

	// update this.transform and this.transform_inverse
	this.transform.makeTransform( this.rotation, this.position );
	this.transform.invertInto( this.transform_inverse );

	// Update the world frame inertia tensor and inverse
	if ( this.mass !== Infinity ) {
		_tmp_mat3_1.fromMatrix4( this.transform_inverse );
		_tmp_mat3_1.transposeInto( _tmp_mat3_2 );
		_tmp_mat3_2.multiply( this.inertiaTensor );
		this.inertiaTensorWorldFrame.multiplyFrom( _tmp_mat3_2, _tmp_mat3_1 );

		this.inertiaTensorWorldFrame.invertInto( this.inverseInertiaTensorWorldFrame );
	}

	// Update AABB
	this.aabb.transform( this.shape.aabb, this.transform );
};