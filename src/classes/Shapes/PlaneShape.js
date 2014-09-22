/**
 * @class PlaneShape
 * @param orientation {Number} index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
 * @param half_width {Number} half width of the plane
 * @param half_length {Number} half height of the plane
 * @constructor
 */
Goblin.PlaneShape = function( orientation, half_width, half_length ) {
	/**
	 * index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
	 * when 0, width is Y and length is Z
	 * when 1, width is X and length is Z
	 * when 2, width is X and length is Y
	 *
	 * @property half_width
	 * @type {Number}
	 */
	this.orientation = orientation;

	/**
	 * half width of the plane
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * half length of the plane
	 *
	 * @property half_length
	 * @type {Number}
	 */
	this.half_length = half_length;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );


	if ( this.orientation === 0 ) {
		this._half_width = 0;
		this._half_height = this.half_width;
		this._half_depth = this.half_length;
	} else if ( this.orientation === 1 ) {
		this._half_width = this.half_width;
		this._half_height = 0;
		this._half_depth = this.half_length;
	} else {
		this._half_width = this.half_width;
		this._half_height = this.half_length;
		this._half_depth = 0;
	}
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.PlaneShape.prototype.calculateLocalAABB = function( aabb ) {
    if ( this.orientation === 0 ) {
        this._half_width = 0;
        this._half_height = this.half_width;
        this._half_depth = this.half_length;

        aabb.min.x = 0;
        aabb.min.y = -this.half_width;
        aabb.min.z = -this.half_length;

        aabb.max.x = 0;
        aabb.max.y = this.half_width;
        aabb.max.z = this.half_length;
    } else if ( this.orientation === 1 ) {
        this._half_width = this.half_width;
        this._half_height = 0;
        this._half_depth = this.half_length;

        aabb.min.x = -this.half_width;
        aabb.min.y = 0;
        aabb.min.z = -this.half_length;

        aabb.max.x = this.half_width;
        aabb.max.y = 0;
        aabb.max.z = this.half_length;
    } else {
        this._half_width = this.half_width;
        this._half_height = this.half_length;
        this._half_depth = 0;

        aabb.min.x = -this.half_width;
        aabb.min.y = -this.half_length;
        aabb.min.z = 0;

        aabb.max.x = this.half_width;
        aabb.max.y = this.half_length;
        aabb.max.z = 0;
    }
};

Goblin.PlaneShape.prototype.getInertiaTensor = function( mass ) {
	var width_squared = this.half_width * this.half_width * 4,
		length_squared = this.half_length * this.half_length * 4,
		element = 0.0833 * mass,

		x = element * length_squared,
		y = element * ( width_squared + length_squared ),
		z = element * width_squared;

	if ( this.orientation === 0 ) {
		return new Goblin.Matrix3(
			y, 0, 0,
			0, x, 0,
			0, 0, z
		);
	} else if ( this.orientation === 1 ) {
		return new Goblin.Matrix3(
			x, 0, 0,
			0, y, 0,
			0, 0, z
		);
	} else {
		return new Goblin.Matrix3(
			y, 0, 0,
			0, z, 0,
			0, 0, x
		);
	}
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.PlaneShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	 support_point = [
	 sign( direction.x ) * _half_width,
	 sign( direction.y ) * _half_height,
	 sign( direction.z ) * _half_depth
	 ]
	 */

	// Calculate the support point in the local frame
	if ( direction.x < 0 ) {
		support_point.x = -this._half_width;
	} else {
		support_point.x = this._half_width;
	}

	if ( direction.y < 0 ) {
		support_point.y = -this._half_height;
	} else {
		support_point.y = this._half_height;
	}

	if ( direction.z < 0 ) {
		support_point.z = -this._half_depth;
	} else {
		support_point.z = this._half_depth;
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
Goblin.PlaneShape.prototype.rayIntersect = (function(){
	var normal = new Goblin.Vector3(),
		ab = new Goblin.Vector3(),
		point = new Goblin.Vector3(),
		t;

	return function( start, end ) {
		if ( this.orientation === 0 ) {
			normal.x = 1;
			normal.y = normal.z = 0;
		} else if ( this.orientation === 1 ) {
			normal.y = 1;
			normal.x = normal.z = 0;
		} else {
			normal.z = 1;
			normal.x = normal.y = 0;
		}

		ab.subtractVectors( end, start );
		t = -normal.dot( start ) / normal.dot( ab );

		if ( t < 0 || t > 1 ) {
			return null;
		}

		point.scaleVector( ab, t );
		point.add( start );

		if ( point.x < -this._half_width || point.x > this._half_width ) {
			return null;
		}

		if ( point.y < -this._half_height || point.y > this._half_height ) {
			return null;
		}

		if ( point.z < -this._half_depth || point.z > this._half_depth ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t * ab.length();
		intersection.point.copy( point );
		intersection.normal.copy( normal );

		return intersection;
	};
})();