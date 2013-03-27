/**
 * A rigid cube implementation
 *
 * @class RigidBox
 * @param half_width {Number} half width of the cube ( X axis )
 * @param half_height {Number} half height of the cube ( Y axis )
 * @param half_depth {Number} half depth of the cube ( Z axis )
 * @param mass {Number} mass of the sphere
 * @constructor
 */
Goblin.RigidBox = function( half_width, half_height, half_depth, mass ) {
	Goblin.RigidBody.call(
		this,
		Math.max( half_width, half_height, half_depth ) * 1.7320508075688772, // largest half-axis * sqrt(3);
		mass
	);

	/**
	 * Half width of the cube ( X axis )
	 *
	 * @proptery half_width
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * Half height of the cube ( Y axis )
	 *
	 * @proptery half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

	/**
	 * Half width of the cube ( Z axis )
	 *
	 * @proptery half_height
	 * @type {Number}
	 */
	this.half_depth = half_depth;

	this.points = [
		vec3.createFrom( -half_width, -half_height, -half_depth ),
		vec3.createFrom( half_width, -half_height, -half_depth ),
		vec3.createFrom( half_width, -half_height, half_depth ),
		vec3.createFrom( -half_width, -half_height, half_depth ),
		vec3.createFrom( -half_width, half_height, -half_depth ),
		vec3.createFrom( half_width, half_height, -half_depth ),
		vec3.createFrom( half_width, half_height, half_depth ),
		vec3.createFrom( -half_width, half_height, half_depth )
	];
};
Goblin.RigidBox.prototype = new Goblin.RigidBody();

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.RigidBox.prototype.findSupportPoint = function( direction, support_point ) {
	var localized_direction = _tmp_vec3_1,
		world_to_local_rotation_transform = _tmp_quat4_1;

	// First transform the direction vector into the body's local frame
	quat4.inverse( this.rotation, world_to_local_rotation_transform );
	quat4.multiplyVec3( world_to_local_rotation_transform, direction, localized_direction );

	/*
	support_point = [
		 sign( direction.x ) * half_width,
		 sign( direction.y ) * half_height,
		 sign( direction.z ) * half_depth
	]
	*/

	// Calculate the support point in the local frame
	if ( localized_direction[0] < 0 ) {
		support_point[0] = -this.half_width;
	} else {
		support_point[0] = this.half_width;
	}

	if ( localized_direction[1] < 0 ) {
		support_point[1] = -this.half_height;
	} else {
		support_point[1] = this.half_height;
	}

	if ( localized_direction[2] < 0 ) {
		support_point[2] = -this.half_depth;
	} else {
		support_point[2] = this.half_depth;
	}

	// Transform the localized support point into world coordinates
	mat4.multiplyVec3( this.transform, support_point );

	/*console.debug( this.id );
	console.debug( direction[0], direction[1], direction[2] );
	console.debug( support_point[0], support_point[1], support_point[2] );
	console.debug( '' );*/
};