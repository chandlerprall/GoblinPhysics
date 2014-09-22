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
	 * @property half_width
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * Half height of the cube ( Y axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

	/**
	 * Half width of the cube ( Z axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_depth = half_depth;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.BoxShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = -this.half_width;
    aabb.min.y = -this.half_height;
    aabb.min.z = -this.half_depth;

    aabb.max.x = this.half_width;
    aabb.max.y = this.half_height;
    aabb.max.z = this.half_depth;
};

Goblin.BoxShape.prototype.getInertiaTensor = function( mass ) {
	var height_squared = this.half_height * this.half_height * 4,
		width_squared = this.half_width * this.half_width * 4,
		depth_squared = this.half_depth * this.half_depth * 4,
		element = 0.0833 * mass;
	return new Goblin.Matrix3(
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
Goblin.BoxShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	support_point = [
		sign( direction.x ) * half_width,
		sign( direction.y ) * half_height,
		sign( direction.z ) * half_depth
	]
	*/

	// Calculate the support point in the local frame
	if ( direction.x < 0 ) {
		support_point.x = -this.half_width;
	} else {
		support_point.x = this.half_width;
	}

	if ( direction.y < 0 ) {
		support_point.y = -this.half_height;
	} else {
		support_point.y = this.half_height;
	}

	if ( direction.z < 0 ) {
		support_point.z = -this.half_depth;
	} else {
		support_point.z = this.half_depth;
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
Goblin.BoxShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		tmin, tmax,
		axis, ood, t1, t2, extent;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			axis = i === 0 ? 'x' : ( i === 1 ? 'y' : 'z' );
			extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );

			if ( Math.abs( direction[axis] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[axis] < -extent || start[axis] > extent ) {
					return null;
				}
			}

            ood = 1 / direction[axis];
            t1 = ( -extent - start[axis] ) * ood;
            t2 = ( extent - start[axis] ) * ood;
            if ( t1 > t2  ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return null;
            }
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = tmin;
		intersection.point.scaleVector( direction, tmin );
		intersection.point.add( start );

		// Find face normal
        var max = Infinity;
		for ( i = 0; i < 3; i++ ) {
			axis = i === 0 ? 'x' : ( i === 1 ? 'y' : 'z' );
			extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );
			if ( extent - Math.abs( intersection.point[axis] ) < max ) {
				intersection.normal.x = intersection.normal.y = intersection.normal.z = 0;
				intersection.normal[axis] = intersection.point[axis] < 0 ? -1 : 1;
				max = extent - Math.abs( intersection.point[axis] );
			}
		}

		return intersection;
	};
})();