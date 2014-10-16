/**
 * Extends a given shape by sweeping a line around it
 *
 * @class LineSweptShape
 * @param start {Vector3} starting point of the line
 * @param end {Vector3} line's end point
 * @param shape any Goblin shape object
 * @constructor
 */
Goblin.LineSweptShape = function( start, end, shape ) {
	/**
	 * starting point of the line
	 *
	 * @property start
	 * @type {Vector3}
	 */
	this.start = start;

	/**
	 * line's end point
	 *
	 * @property end
	 * @type {Vector3}
	 */
	this.end = end;

	/**
	 * shape being swept
	 *
	 * @property shape
	 */
	this.shape = shape;

	/**
	 * unit direction of the line
	 *
	 * @property direction
	 * @type {Vector3}
	 */
	this.direction = new Goblin.Vector3();
	this.direction.subtractVectors( end, start );

	/**
	 * length of the line
	 *
	 * @property length
	 * @type {Number}
	 */
	this.length = this.direction.length();
	this.direction.normalize();

	/**
	 * axis-aligned bounding box of this shape
	 *
	 * @property aabb
	 * @type {AABB}
	 */
	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.LineSweptShape.prototype.calculateLocalAABB = function( aabb ) {
	this.shape.calculateLocalAABB( aabb );

	aabb.min.x = Math.min( aabb.min.x + this.start.x, aabb.min.x + this.end.x );
	aabb.min.y = Math.min( aabb.min.y + this.start.y, aabb.min.y + this.end.y );
	aabb.min.z = Math.min( aabb.min.z + this.start.z, aabb.min.z + this.end.z );

	aabb.max.x = Math.max( aabb.max.x + this.start.x, aabb.max.x + this.end.x );
	aabb.max.y = Math.max( aabb.max.y + this.start.y, aabb.max.y + this.end.y );
	aabb.max.z = Math.max( aabb.max.z + this.start.z, aabb.max.z + this.end.z );
};

Goblin.LineSweptShape.prototype.getInertiaTensor = function( mass ) {
	// this is wrong, but currently not used for anything
	return this.shape.getInertiaTensor( mass );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.LineSweptShape.prototype.findSupportPoint = function( direction, support_point ) {
	this.shape.findSupportPoint( direction, support_point );

	// Add whichever point of this line lies in `direction`
	var dot = this.direction.dot( direction );

	if ( dot < 0 ) {
		support_point.add( this.start );
	} else {
		support_point.add( this.end );
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.LineSweptShape.prototype.rayIntersect = function(){
	return null;
};