/**
 * @class TriangleShape
 * @param vertex_a {Vector3} first vertex
 * @param vertex_b {Vector3} second vertex
 * @param vertex_c {Vector3} third vertex
 * @constructor
 */
Goblin.TriangleShape = function( vertex_a, vertex_b, vertex_c ) {
	/**
	 * first vertex of the triangle
	 *
	 * @property a
	 * @type {Vector3}
	 */
	this.a = vertex_a;

	/**
	 * second vertex of the triangle
	 *
	 * @property b
	 * @type {Vector3}
	 */
	this.b = vertex_b;

	/**
	 * third vertex of the triangle
	 *
	 * @property c
	 * @type {Vector3}
	 */
	this.c = vertex_c;

	/**
	 * normal vector of the triangle
	 *
	 * @property normal
	 * @type {Goblin.Vector3}
	 */
	this.normal = new Goblin.Vector3();
	_tmp_vec3_1.subtractVectors( this.b, this.a );
	_tmp_vec3_2.subtractVectors( this.c, this.a );
	this.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );

	/**
	 * area of the triangle
	 *
	 * @property volume
	 * @type {Number}
	 */
	this.volume = this.normal.length() / 2;

	this.normal.normalize();

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.TriangleShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = Math.min( this.a.x, this.b.x, this.c.x );
	aabb.min.y = Math.min( this.a.y, this.b.y, this.c.y );
	aabb.min.z = Math.min( this.a.z, this.b.z, this.c.z );

	aabb.max.x = Math.max( this.a.x, this.b.x, this.c.x );
	aabb.max.y = Math.max( this.a.y, this.b.y, this.c.y );
	aabb.max.z = Math.max( this.a.z, this.b.z, this.c.z );
};

Goblin.TriangleShape.prototype.getInertiaTensor = function( mass ) {
	// @TODO http://www.efunda.com/math/areas/triangle.cfm
	return new Goblin.Matrix3(
		0, 0, 0,
		0, 0, 0,
		0, 0, 0
	);
};

Goblin.TriangleShape.prototype.classifyVertex = function( vertex ) {
	var w = this.normal.dot( this.a );
	return this.normal.dot( vertex ) - w;
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.TriangleShape.prototype.findSupportPoint = function( direction, support_point ) {
	var dot, best_dot = -Infinity;

	dot = direction.dot( this.a );
	if ( dot > best_dot ) {
		support_point.copy( this.a );
		best_dot = dot;
	}

	dot = direction.dot( this.b );
	if ( dot > best_dot ) {
		support_point.copy( this.b );
		best_dot = dot;
	}

	dot = direction.dot( this.c );
	if ( dot > best_dot ) {
		support_point.copy( this.c );
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.TriangleShape.prototype.rayIntersect = (function(){
	var d1 = new Goblin.Vector3(),
		d2 = new Goblin.Vector3(),
		n = new Goblin.Vector3(),
		segment = new Goblin.Vector3(),
		b = new Goblin.Vector3(),
		u = new Goblin.Vector3();

	return function( start, end ) {
		d1.subtractVectors( this.b, this.a );
		d2.subtractVectors( this.c, this.a );
		n.crossVectors( d1, d2 );

		segment.subtractVectors( end, start );
		var det = -segment.dot( n );

		if ( det <= 0 ) {
			// Ray is parallel to triangle or triangle's normal points away from ray
			return null;
		}

		b.subtractVectors( start, this.a );

		var t = b.dot( n ) / det;
		if ( 0 > t || t > 1 ) {
			// Ray doesn't intersect the triangle's plane
			return null;
		}

		u.crossVectors( b, segment );
		var u1 = d2.dot( u ) / det,
			u2 = -d1.dot( u ) / det;

		if ( u1 + u2 > 1 || u1 < 0 || u2 < 0 ) {
			// segment does not intersect triangle
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t * segment.length();
		intersection.point.scaleVector( segment, t );
		intersection.point.add( start );
		intersection.normal.copy( this.normal );

		return intersection;
	};
})();