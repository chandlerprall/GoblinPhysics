/**
 * Connects two objects together, generating a contact if
 * they violate the constraints of their link. It is used as a
 * base class for cables and rods, and could be used as a base
 * class for springs with a limit to their extension.
 *
 * @class RopeConstraint
 * @constructor
 *
 * @param object_a {Mixed}
 * @param object_b {Mixed}
 * @param max_length {Number} Maximum length of the rope
 * @param restitution {Number} Restitution to apply when rope reaches its max length
 */
Goblin.RopeConstraint = function( object_a, object_b, max_length, restitution ) {
	/**
	 * @property object_a
	 * @type {Mixed}
	 */
	this.object_a = object_a;

	/**
	 * @property object_b
	 * @type {Mixed}
	 */
	this.object_b = object_b;

	/**
	 * @property max_length
	 * @type {Number}
	 */
	this.max_length = max_length;

	/**
	 * @property restitution
	 * @type {Number}
	 */
	this.restitution = restitution;

	/**
	 * @property world
	 * @type {Goblin.World}
	 */
	this.world = null;
};

/**
 * @method createContact
 * @param contact {Goblin.MassPointContact}
 * @param limit {Number}
 * @return {Goblin.MassPointContact}
 */
Goblin.RopeConstraint.prototype.createContact = function() {
	var _vec3 = _tmp_vec3_1,
		length,
		contact;

	vec3.subtract( this.object_a.position, this.object_b.position, _vec3 );
	length = vec3.length( _vec3 );

	// Check whether we’re overextended.
	if (length < this.max_length) {
		return null;
	}

	// Otherwise return the contact.
	contact = Goblin.ObjectPool.getObject( 'MassPointContact' );
	contact.object_a = this.object_a;
	contact.object_b = this.object_b;

	// Calculate the normal.
	vec3.subtract( this.object_b.position, this.object_a.position, contact.contact_normal );
	vec3.normalize( contact.contact_normal );

	contact.penetration = length - this.max_length;
	contact.restitution = this.restitution;

	return contact;
};

/**
 * @method apply
 */
Goblin.RopeConstraint.prototype.apply = function() {
	var contact = this.createContact();
	if ( contact !== null ) {
		this.world.contacts.push( contact );
	}
};