/**
* Represents a masspoint
*
* @class MassPoint
* @constructor
* @param mass {Number} mass of the masspoint
*/
Goblin.MassPoint = function( mass ) {
	/**
	* the masspoint's mass
	*
	* @property mass
	* @type {Number}
	* @default Infinity
	*/
	this.mass = mass || Infinity;

	/**
	* the masspoint's current position
	*
	* @property position
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this.position = vec3.create();

	/**
	* the mass point's current linear velocity
	*
	* @property linear_velocity
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this.linear_velocity = vec3.create();

	/**
	* the mass point's current acceleration
	*
	* @property acceleration
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this.acceleration = vec3.create();

	/**
	* amount of linear damping to apply to the mass point's velocity
	*
	* @property lineaDamping
	* @type {vec3}
	* @default [ 0.999, 0.999, 0.999 ]
	*/
	this.linear_damping = vec3.createFrom( 0.999, 0.999, 0.999 );

	/**
	* the mass point's custom gravity
	*
	* @property gravity
	* @type {vec3}
	* @default null
	* @private
	*/
	this.gravity = null;

	/**
	* the world to which the mass point has been added,
	* this is set when the mass point is added to a world
	*
	* @property world
	* @type {Goblin.World}
	* @default null
	*/
	this.world = null;

	/**
	* all resultant force accumulated by the masspoint in the previous step
	* this force is applied in the next occurring integration
	*
	* @property accumulated_force
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	* @private
	*/
	this.accumulated_force = vec3.create();
};
/**
* Updates the masspoint's position, velocity, and acceleration
*
* @method integrate
* @param duration {Number} time, in seconds, to use in integration
*/
Goblin.MassPoint.prototype.integrate = function( duration ) {
	var _vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2;

	/* Clear accumulated forces*/
	this.accumulated_force[0] = this.accumulated_force[1] = this.accumulated_force[2] = 0;

	/* Work out the acceleration from all forces & gravity*/
	vec3.set( this.acceleration, _vec3_1 );

	// Add accumulated forces
	vec3.set( this.accumulated_force, _vec3_2 );
	vec3.scale( _vec3_2, 1 / this.mass );
	vec3.add( _vec3_1, _vec3_2 );

	// Add gravity
	if ( this.mass < Infinity ) {
		vec3.add( _vec3_1, this.gravity || this.world.gravity );
	}


	/* Apply damping*/
	vec3.multiply( this.linear_velocity, this.linear_damping );


	/* Update linear position
	 // Simpler, but not quite as accurate as the following method
	 // as it does add the additional velocity caused by acceleration
	 vec3.set( this.velocity, _vec3_1 );
	 vec3.scale( _vec3_1, duration );
	 vec3.add( this.position, _vec3_1 );
	 */
	// Apply velocity
	vec3.set( this.linear_velocity, _vec3_1 );
	vec3.scale( _vec3_1, duration );
	// Apply acceleration
	vec3.set( this.acceleration, _vec3_2 );
	vec3.scale( _vec3_2, duration * duration * 0.5 );
	// Bring it all together
	vec3.add( this.position, _vec3_1 );
	vec3.add( this.position, _vec3_2 );

	/* Update linear velocity from the acceleration.*/
	vec3.scale( _vec3_1, duration );
	vec3.add( this.linear_velocity, _vec3_1 );
};
/**
* Sets a custom gravity value for this masspoint
*
* @method setGravity
* @param x {Number} gravity to apply on x axis
* @param y {Number} gravity to apply on y axis
* @param z {Number} gravity to apply on z axis
*/
Goblin.MassPoint.prototype.setGravity = function( x, y, z ) {
	if ( this.gravity ) {
		this.gravity[0] = x;
		this.gravity[1] = y;
		this.gravity[2] = z;
	} else {
		this.gravity = vec3.createFrom( x, y, z );
	}
};
/**
* Adds a force to the masspoint which will be used only for the next integration
*
* @method applyForce
* @param force {vec3} force to apply to the masspoint
*/
Goblin.MassPoint.prototype.applyForce = function( force ) {
	vec3.add( this.accumulated_force, force );
};