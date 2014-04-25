Goblin.RigidBodyProxy = function() {
	this.parent = null;
	this.id = null;

	this.shape = null;

	this.aabb = new Goblin.AABB();

	this.mass = null;

	this.position = vec3.create();
	this.rotation = quat4.create();

	this.transform = mat4.create();
	this.transform_inverse = mat4.create();

	this.restitution = null;
	this.friction = null;
};

Goblin.RigidBodyProxy.prototype.setFrom = function( parent, shape_data ) {
	this.parent = parent;

	this.id = parent.id;

	this.shape = shape_data.shape;
	this.shape_data = shape_data;

	this.mass = parent.mass;

	mat4.multiplyVec3( parent.transform, shape_data.position, this.position );
	quat4.multiply( parent.rotation, shape_data.rotation, this.rotation );

	mat4.fromRotationTranslation( this.rotation, this.position, this.transform );
	mat4.inverse( this.transform, this.transform_inverse );

	this.aabb.transform( this.shape.aabb, this.transform );

	this.restitution = parent.restitution;
	this.friction = parent.friction;
};

Goblin.RigidBodyProxy.prototype.findSupportPoint = Goblin.RigidBody.prototype.findSupportPoint;

Goblin.RigidBodyProxy.prototype.getRigidBody = function() {
	var body = this.parent;
	while ( body.parent ) {
		body = this.parent;
	}
	return body;
};