/**
 * Structure which holds information about a contact between two objects
 *
 * @Class ContactDetails
 * @constructor
 */
Goblin.ContactDetails = function() {
	/**
	 * first body in the  contact
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this.object_a = null;

	/**
	 * second body in the  contact
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this.object_b = null;

	/**
	 * point of contact in world coordinates
	 *
	 * @property contact_point
	 * @type {vec3}
	 */
	this.contact_point = vec3.create();

	/**
	 * contact point in local frame of `object_a`
	 *
	 * @property contact_point_in_a
	 * @type {vec3}
	 */
	this.contact_point_in_a = vec3.create();

	/**
	 * contact point in local frame of `object_b`
	 *
	 * @property contact_point_in_b
	 * @type {vec3}
	 */
	this.contact_point_in_b = vec3.create();

	/**
	 * normal vector, in world coordinates, of the contact
	 *
	 * @property contact_normal
	 * @type {vec3}
	 */
	this.contact_normal = vec3.create();

	/**
	 * how far the objects are penetrated at the point of contact
	 *
	 * @property penetration_depth
	 * @type {Number}
	 */
	this.penetration_depth = 0;

	/**
	 * amount of restitution between the objects in contact
	 *
	 * @property restitution
	 * @type {Number}
	 */
	this.restitution = 0;

	/**
	 * amount of friction between the objects in contact
	 *
	 * @property friction
	 * @type {*}
	 */
	this.friction = 0;

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.ContactDetails );

Goblin.ContactDetails.prototype.destroy = function() {
	this.emit( 'destroy' );
	Goblin.ObjectPool.freeObject( 'ContactDetails', this );
};