/**
 * @class SphereShape
 * @param radius {Number} sphere radius
 * @constructor
 */
Goblin.SphereShape = function( radius ) {
	this.radius = radius;

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.SphereShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = -this.radius;
	aabb.max.x = aabb.max.y = aabb.max.z = this.radius;
};

Goblin.SphereShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.4 * mass * this.radius * this.radius;
	return new Goblin.Matrix3(
		element, 0, 0,
		0, element, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.SphereShape.prototype.findSupportPoint = (function(){
	var temp = new Goblin.Vector3();
	return function( direction, support_point ) {
		temp.normalizeVector( direction );
		support_point.scaleVector( temp, this.radius );
	};
})();

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.SphereShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		length;

	return function( start, end ) {
		direction.subtractVectors( end, start );
		length = direction.length();
		direction.scale( 1 / length  ); // normalize direction

		var a = start.dot( direction ),
			b = start.dot( start ) - this.radius * this.radius;

		// if ray starts outside of sphere and points away, exit
		if ( a >= 0 && b >= 0 ) {
			return null;
		}

		var discr = a * a - b;

		// Check for ray miss
		if ( discr < 0 ) {
			return null;
		}

		// ray intersects, find closest intersection point
		var discr_sqrt = Math.sqrt( discr ),
			t = -a - discr_sqrt;
		if ( t < 0 ) {
			t = -a + discr_sqrt;
		}

		// verify the segment intersects
		if ( t > length ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.point.scaleVector( direction, t );
		intersection.t = t;
		intersection.point.add( start );

        intersection.normal.normalizeVector( intersection.point );

		return intersection;
	};
})();