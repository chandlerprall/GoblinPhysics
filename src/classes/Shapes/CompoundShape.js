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
	return mat3.createFrom(
		1, 0, 0,
		0, 1, 0,
		0, 0, 1
	);
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CompoundShape.prototype.rayIntersect = function( start, end ) {

};