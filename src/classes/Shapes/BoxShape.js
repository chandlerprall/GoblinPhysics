/**
 * @class BoxShape
 * @param half_width {Number} half width of the cube ( X axis )
 * @param half_height {Number} half height of the cube ( Y axis )
 * @param half_depth {Number} half depth of the cube ( Z axis )
 * @constructor
 */
Goblin.BoxShape = function( half_width, half_height, half_depth ) {
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
};

Goblin.BoxShape.prototype.getBoundingRadius = function() {
	return Math.max( this.half_width, this.half_height, this.half_depth ) * 1.7320508075688772; // largest half-axis * sqrt(3);
};

Goblin.BoxShape.prototype.getInertiaTensor = function( mass ) {
	var height_squared = this.half_height * this.half_height * 4,
		width_squared = this.half_width * this.half_width * 4,
		depth_squared = this.half_depth * this.half_depth * 4,
		element = 0.0833 * mass;
	return mat3.createFrom(
		element * ( height_squared + depth_squared ), 0, 0,
		0, element * ( width_squared + depth_squared ), 0,
		0, 0, element * ( height_squared + width_squared )
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.BoxShape.prototype.findSupportPoint = function( rotation, transform, direction, support_point ) {
	var localized_direction = _tmp_vec3_1,
		world_to_local_rotation_transform = _tmp_quat4_1;

	// First transform the direction vector into the body's local frame
	quat4.inverse( rotation, world_to_local_rotation_transform );
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
	mat4.multiplyVec3( transform, support_point );
};