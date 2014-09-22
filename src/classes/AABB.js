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
		ood, t1, t2,
		axis;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			axis = i === 0 ? 'x' : ( i === 1 ? 'y' : 'z' );
			var extent_min = ( i === 0 ? this.min.x : (  i === 1 ? this.min.y : this.min.z )  ),
				extent_max = ( i === 0 ? this.max.x : (  i === 1 ? this.max.y : this.max.z ) );

			if ( Math.abs( direction[axis] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[axis] < extent_min || start[axis] > extent_max ) {
					return false;
				}
			} else {
				ood = 1 / direction[axis];
				t1 = ( extent_min - start[axis] ) * ood;
				t2 = ( extent_max - start[axis] ) * ood;
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
		}

		return true;
	};
})();