/**
 * @class CompoundShapeChild
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, position, rotation ) {
	this.shape = shape;

	this.position = new Goblin.Vector3( position.x, position.y, position.z );
	this.rotation = new Goblin.Quaternion( rotation.x, rotation.y, rotation.z, rotation.w );

	this.transform = new Goblin.Matrix4();
	this.transform_inverse = new Goblin.Matrix4();
	this.transform.makeTransform( this.rotation, this.position );
	this.transform.invertInto( this.transform_inverse );

	this.aabb = new Goblin.AABB();
	this.aabb.transform( this.shape.aabb, this.transform );
};