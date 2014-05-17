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
	aabb.min[0] = aabb.min[1] = aabb.min[2] = Infinity;
	aabb.max[0] = aabb.max[1] = aabb.max[2] = -Infinity;

	var i, shape,
		shape_aabb = new Goblin.AABB();

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		shape = this.child_shapes[i];

		aabb.min[0] = Math.min( aabb.min[0], shape.aabb.min[0] );
		aabb.min[1] = Math.min( aabb.min[1], shape.aabb.min[1] );
		aabb.min[2] = Math.min( aabb.min[2], shape.aabb.min[2] );

		aabb.max[0] = Math.max( aabb.max[0], shape.aabb.max[0] );
		aabb.max[1] = Math.max( aabb.max[1], shape.aabb.max[1] );
		aabb.max[2] = Math.max( aabb.max[2], shape.aabb.max[2] );
	}
};

Goblin.CompoundShape.prototype.getInertiaTensor = function( mass ) {
	var tensor = mat3.identity(),
		j = mat3.create(),
		i,
		child,
		child_tensor;

	mass /= this.child_shapes.length;

	// Holds center of current tensor
	_tmp_vec3_1[0] = _tmp_vec3_1[1] = _tmp_vec3_1[2] = 0;

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		child = this.child_shapes[i];

		vec3.subtract( _tmp_vec3_1, child.position );

		j[0] = mass * -( _tmp_vec3_1[1] * _tmp_vec3_1[1] + _tmp_vec3_1[2] * _tmp_vec3_1[1] );
		j[1] = mass * _tmp_vec3_1[0] * _tmp_vec3_1[1];
		j[2] = mass * _tmp_vec3_1[0] * _tmp_vec3_1[2];

		j[3] = mass * _tmp_vec3_1[0] * _tmp_vec3_1[1];
		j[4] = mass * -( _tmp_vec3_1[0] * _tmp_vec3_1[0] + _tmp_vec3_1[2] * _tmp_vec3_1[2] );
		j[5] = mass * _tmp_vec3_1[1] * _tmp_vec3_1[2];

		j[6] = mass * _tmp_vec3_1[0] * _tmp_vec3_1[2];
		j[7] = mass * _tmp_vec3_1[1] * _tmp_vec3_1[2];
		j[8] = mass * -( _tmp_vec3_1[0] * _tmp_vec3_1[0] + _tmp_vec3_1[1] * _tmp_vec3_1[1] );

		mat4.toMat3( child.transform, _tmp_mat3_1 );
		child_tensor = child.shape.getInertiaTensor( mass );
		mat3.transpose( _tmp_mat3_1, _tmp_mat3_2 );
		mat3.multiply( _tmp_mat3_1, child_tensor );
		mat3.multiply( _tmp_mat3_1, _tmp_mat3_2 );

		tensor[0] += _tmp_mat3_1[0] + j[0];
		tensor[1] += _tmp_mat3_1[1] + j[1];
		tensor[2] += _tmp_mat3_1[2] + j[2];
		tensor[3] += _tmp_mat3_1[3] + j[3];
		tensor[4] += _tmp_mat3_1[4] + j[4];
		tensor[5] += _tmp_mat3_1[5] + j[5];
		tensor[6] += _tmp_mat3_1[6] + j[6];
		tensor[7] += _tmp_mat3_1[7] + j[7];
		tensor[8] += _tmp_mat3_1[8] + j[8];
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
			local_start = vec3.create(),
			local_end = vec3.create(),
			intersection,
			i, child;

		for ( i = 0; i < this.child_shapes.length; i++ ) {
			child = this.child_shapes[i];

			mat4.multiplyVec3( child.transform_inverse, ray_start, local_start );
			mat4.multiplyVec3( child.transform_inverse, ray_end, local_end );

			intersection = child.shape.rayIntersect( local_start, local_end );
			if ( intersection != null ) {
				intersection.object = this; // change from the shape to the body
				mat4.multiplyVec3( child.transform, intersection.point ); // transform child's local coordinates to the compound's coordinates
				intersections.push( intersection );
			}
		}

		intersections.sort( tSort );
		return intersections[0] || null;
	};
})();