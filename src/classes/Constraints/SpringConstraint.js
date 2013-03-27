/**
 * acts like a spring between two objects, or an object and a fixed point
 *
 * @class SpringConstraint
 * @constructor
 * @param object_a {Mixed} first object attached to the spring
 * @param object_b {Mixed} second object attached to the spring, or optionally a {vec3} specifying a fixed world position
 * @param resting_length {Number} the length of the spring when at rest
 * @param stiffness {Number} stiffness of the spring
 * @param damping {Number} how much damping to apply to the spring force
 */
Goblin.SpringConstraint = function( object_a, object_b, resting_length, stiffness, damping ) {
	/**
	 * first object attached to the spring
	 *
	 * @property object_a
	 * @type {Mixed}
	 */
	this.object_a = object_a;

	/**
	 * second object attached to the spring, or optionally a {vec3} specifying a fixed world position
	 *
	 * @property object_b
	 * @type {Mixed}
	 */
	this.object_b = object_b;

	/**
	 * the length of the spring when at rest
	 *
	 * @property resting_length
	 * @type {Number}
	 */
	this.resting_length = resting_length;

	/**
	 * stiffness of the spring
	 *
	 * @property stiffness
	 * @type {Number}
	 * @default 10
	 */
	this.stiffness = stiffness || 10;

	/**
	 * how much damping to apply to the spring force
	 *
	 * @property damping
	 * @type {Number}
	 * @default 0.9
	 */
	this.linear_damping = damping || 0.9;

	/**
	 * @property world
	 * @type {Goblin.World}
	 */
	this.world = null;
};
/**
 * apply the spring's forces acting on object_a and object_b
 *
 * @method apply
 */
Goblin.SpringConstraint.prototype.apply = function() {
	var force = _tmp_vec3_1,
		magnitude;

	vec3.subtract(
		this.object_a.position,
		this.object_b.position !== undefined ? this.object_b.position : this.object_b,
		force
	);

	// Calculate the magnitude of the force.
	magnitude = vec3.length( force );
	magnitude = Math.abs( magnitude - this.resting_length ) * this.stiffness * this.linear_damping;

	// Calculate the final force and apply it.
	vec3.normalize( force );
	vec3.scale( force, magnitude );

	if ( this.object_b.position !== undefined ) {
		this.object_b.applyForce( force );
	}

	vec3.negate( force );
	this.object_a.applyForce( force );
};