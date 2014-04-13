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
	aabb.min[0] = aabb.min[1] = aabb.min[2] = -this.radius;
	aabb.max[0] = aabb.max[1] = aabb.max[2] = this.radius;
};

Goblin.SphereShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.4 * mass * this.radius * this.radius;
	return mat3.createFrom(
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
	var temp = vec3.create();
	return function( direction, support_point ) {
		vec3.normalize( direction, temp );
		vec3.scale( temp, this.radius, support_point );
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
	var direction = vec3.create(),
		length;

	return function( start, end ) {
		vec3.subtract( end, start, direction );
		length = vec3.length( direction );
		vec3.scale( direction, 1 / length ); // normalize direction

		var a = vec3.dot( start, direction ),
			b = vec3.dot( start, start ) - this.radius * this.radius;

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
		vec3.scale( direction, t, intersection.point );
		intersection.t = t;
		vec3.add( intersection.point, start );

		return intersection;
	};
})();