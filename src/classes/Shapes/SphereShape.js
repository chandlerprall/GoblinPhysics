/**
 * @class SphereShape
 * @param radius {Number} sphere radius
 * @constructor
 */
Goblin.SphereShape = function( radius ) {
	this.radius = radius;
};

Goblin.SphereShape.prototype.getBoundingRadius = function() {
	return this.radius;
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.SphereShape.prototype.findSupportPoint = function( rotation, transform, direction, support_point ) {
	var localized_direction = _tmp_vec3_1,
		world_to_local_rotation_transform = _tmp_quat4_1;

	// @TODO shouldn't need to transform the search direction first, but rather align the support point with the search direction after it has been calculated

	// First transform the direction vector into the body's local frame
	quat4.inverse( rotation, world_to_local_rotation_transform );
	quat4.multiplyVec3( world_to_local_rotation_transform, direction, localized_direction );
	/*
	 support_point = radius * (normalized)direction
	*/

	//vec3.normalize( direction, localized_direction );
	vec3.normalize( localized_direction );
	vec3.scale( localized_direction, this.radius, support_point );

	// Transform the localized support point into world coordinates
	mat4.multiplyVec3( transform, support_point );
};