/**
 * @class CompoundShapeChild
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, position, rotation ) {
	this.shape = shape;

	this.position = vec3.createFrom.apply( vec3, position );
	this.rotation = quat4.createFrom.apply( quat4, rotation );

	this.transform = mat4.create();
	this.transform_inverse = mat4.create();
	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	this.aabb = new Goblin.AABB();
	this.aabb.transform( this.shape.aabb, this.transform );
};