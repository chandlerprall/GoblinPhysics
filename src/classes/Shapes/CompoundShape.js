/**
 * @class CompoundShape
 * @constructor
 */
Goblin.CompoundShape = function() {
	this.child_shapes = [];

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Adds the child shape at `position` and `rotation` relative to the compound shape
 *
 * @method addChildShape
 * @param shape
 * @param position
 * @param rotation
 */
Goblin.CompoundShape.prototype.addChildShape = function( shape, position, rotation ) {
	this.child_shapes.push( new Goblin.CompoundShapeChild( shape, position, rotation ) );
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CompoundShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = Infinity;
	aabb.max.x = aabb.max.y = aabb.max.z = -Infinity;

	var i, shape;

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		shape = this.child_shapes[i];

		aabb.min.x = Math.min( aabb.min.x, shape.aabb.min.x );
		aabb.min.y = Math.min( aabb.min.y, shape.aabb.min.y );
		aabb.min.z = Math.min( aabb.min.z, shape.aabb.min.z );

		aabb.max.x = Math.max( aabb.max.x, shape.aabb.max.x );
		aabb.max.y = Math.max( aabb.max.y, shape.aabb.max.y );
		aabb.max.z = Math.max( aabb.max.z, shape.aabb.max.z );
	}
};

Goblin.CompoundShape.prototype.getInertiaTensor = function( mass ) {
	var tensor = new Goblin.Matrix3(),
		j = new Goblin.Matrix3(),
		i,
		child,
		child_tensor;
	tensor.identity();

	mass /= this.child_shapes.length;

	// Holds center of current tensor
	_tmp_vec3_1.x = _tmp_vec3_1.y = _tmp_vec3_1.z = 0;

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		child = this.child_shapes[i];

		_tmp_vec3_1.subtract( child.position );

		j.e00 = mass * -( _tmp_vec3_1.y * _tmp_vec3_1.y + _tmp_vec3_1.z * _tmp_vec3_1.z );
		j.e10 = mass * _tmp_vec3_1.x * _tmp_vec3_1.y;
		j.e20 = mass * _tmp_vec3_1.x * _tmp_vec3_1.z;

		j.e01 = mass * _tmp_vec3_1.x * _tmp_vec3_1.y;
		j.e11 = mass * -( _tmp_vec3_1.x * _tmp_vec3_1.x + _tmp_vec3_1.z * _tmp_vec3_1.z );
		j.e21 = mass * _tmp_vec3_1.y * _tmp_vec3_1.z;

		j.e02 = mass * _tmp_vec3_1.x * _tmp_vec3_1.z;
		j.e12 = mass * _tmp_vec3_1.y * _tmp_vec3_1.z;
		j.e22 = mass * -( _tmp_vec3_1.x * _tmp_vec3_1.x + _tmp_vec3_1.y * _tmp_vec3_1.y );

		_tmp_mat3_1.fromMatrix4( child.transform );
		child_tensor = child.shape.getInertiaTensor( mass );
		_tmp_mat3_1.transposeInto( _tmp_mat3_2 );
		_tmp_mat3_1.multiply( child_tensor );
		_tmp_mat3_1.multiply( _tmp_mat3_2 );

		tensor.e00 += _tmp_mat3_1.e00 + j.e00;
		tensor.e10 += _tmp_mat3_1.e10 + j.e10;
		tensor.e20 += _tmp_mat3_1.e20 + j.e20;
		tensor.e01 += _tmp_mat3_1.e01 + j.e01;
		tensor.e11 += _tmp_mat3_1.e11 + j.e11;
		tensor.e21 += _tmp_mat3_1.e21 + j.e21;
		tensor.e02 += _tmp_mat3_1.e02 + j.e02;
		tensor.e12 += _tmp_mat3_1.e12 + j.e12;
		tensor.e22 += _tmp_mat3_1.e22 + j.e22;
	}

	return tensor;
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property ray_start {vec3} start point of the segment
 * @property ray_end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CompoundShape.prototype.rayIntersect = (function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
		}
	};
	return function( ray_start, ray_end ) {
		var intersections = [],
			local_start = new Goblin.Vector3(),
			local_end = new Goblin.Vector3(),
			intersection,
			i, child;

		for ( i = 0; i < this.child_shapes.length; i++ ) {
			child = this.child_shapes[i];

			child.transform_inverse.transformVector3Into( ray_start, local_start );
			child.transform_inverse.transformVector3Into( ray_end, local_end );

			intersection = child.shape.rayIntersect( local_start, local_end );
			if ( intersection != null ) {
				intersection.object = this; // change from the shape to the body
				child.transform.transformVector3( intersection.point ); // transform child's local coordinates to the compound's coordinates
				intersections.push( intersection );
			}
		}

		intersections.sort( tSort );
		return intersections[0] || null;
	};
})();