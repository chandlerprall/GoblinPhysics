/**
 * @class AABB
 * @param [min] {vec3}
 * @param [max] {vec3}
 * @constructor
 */
Goblin.AABB = function( min, max ) {
	/**
	 * @property min
	 * @type {vec3}
	 */
	this.min = min || new Goblin.Vector3();

	/**
	 * @property max
	 * @type {vec3}
	 */
	this.max = max || new Goblin.Vector3();
};

Goblin.AABB.prototype.copy = function( aabb ) {
	this.min.x = aabb.min.x;
	this.min.y = aabb.min.y;
	this.min.z = aabb.min.z;

	this.max.x = aabb.max.x;
	this.max.y = aabb.max.y;
	this.max.z = aabb.max.z;
};

Goblin.AABB.prototype.combineAABBs = function( a, b ) {
	this.min.x = Math.min( a.min.x, b.min.x );
	this.min.y = Math.min( a.min.y, b.min.y );
	this.min.z = Math.min( a.min.z, b.min.z );

	this.max.x = Math.max( a.max.x, b.max.x );
	this.max.y = Math.max( a.max.y, b.max.y );
	this.max.z = Math.max( a.max.z, b.max.z );
};

Goblin.AABB.prototype.transform = (function(){
	var local_half_extents = new Goblin.Vector3(),
		local_center = new Goblin.Vector3(),
		center = new Goblin.Vector3(),
		extents = new Goblin.Vector3(),
		abs = new Goblin.Matrix3();

	return function( local_aabb, matrix ) {
		local_half_extents.subtractVectors( local_aabb.max, local_aabb.min );
		local_half_extents.scale( 0.5  );

		local_center.addVectors( local_aabb.max, local_aabb.min );
		local_center.scale( 0.5  );

		matrix.transformVector3Into( local_center, center );

		// Extract the absolute rotation matrix
		abs.e00 = Math.abs( matrix.e00 );
		abs.e01 = Math.abs( matrix.e01 );
		abs.e02 = Math.abs( matrix.e02 );
		abs.e10 = Math.abs( matrix.e10 );
		abs.e11 = Math.abs( matrix.e11 );
		abs.e12 = Math.abs( matrix.e12 );
		abs.e20 = Math.abs( matrix.e20 );
		abs.e21 = Math.abs( matrix.e21 );
		abs.e22 = Math.abs( matrix.e22 );

		_tmp_vec3_1.x = abs.e00;
		_tmp_vec3_1.y = abs.e10;
		_tmp_vec3_1.z = abs.e20;
		extents.x = local_half_extents.dot( _tmp_vec3_1 );

		_tmp_vec3_1.x = abs.e01;
		_tmp_vec3_1.y = abs.e11;
		_tmp_vec3_1.z = abs.e21;
		extents.y = local_half_extents.dot( _tmp_vec3_1 );

		_tmp_vec3_1.x = abs.e02;
		_tmp_vec3_1.y = abs.e12;
		_tmp_vec3_1.z = abs.e22;
		extents.z = local_half_extents.dot( _tmp_vec3_1 );

		this.min.subtractVectors( center, extents );
		this.max.addVectors( center, extents );
	};
})();

Goblin.AABB.prototype.intersects = function( aabb ) {
    if (
        this.max.x < aabb.min.x ||
        this.max.y < aabb.min.y ||
        this.max.z < aabb.min.z ||
        this.min.x > aabb.max.x ||
        this.min.y > aabb.max.y ||
        this.min.z > aabb.max.z
    )
    {
        return false;
    }

    return true;
};

/**
 * Checks if a ray segment intersects with this AABB
 *
 * @method testRayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {boolean}
 */
Goblin.AABB.prototype.testRayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		tmin, tmax,
		ood, t1, t2;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		var extent_min, extent_max;

        // Check X axis
        extent_min = this.min.x;
        extent_max = this.max.x;
        if ( Math.abs( direction.x ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.x < extent_min || start.x > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.x;
            t1 = ( extent_min - start.x ) * ood;
            t2 = ( extent_max - start.x ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Y axis
        extent_min = this.min.y;
        extent_max = this.max.y;
        if ( Math.abs( direction.y ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.y < extent_min || start.y > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.y;
            t1 = ( extent_min - start.y ) * ood;
            t2 = ( extent_max - start.y ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Z axis
        extent_min = this.min.z;
        extent_max = this.max.z;
        if ( Math.abs( direction.z ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.z < extent_min || start.z > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.z;
            t1 = ( extent_min - start.z ) * ood;
            t2 = ( extent_max - start.z ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

		return true;
	};
})();