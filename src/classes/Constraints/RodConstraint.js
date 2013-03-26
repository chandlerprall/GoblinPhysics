/**
 * Rods link a pair of particles, generating a contact if they stray too far apart or too close.
 *
 * @class RodConstraint
 * @constructor
 * @param object_a {Mixed}
 * @param object_b {Mixed}
 * @param length {Number} Length of the rod
 */
Goblin.RodConstraint = function( object_a, object_b, length ) {
	/**
	 * @property object_a
	 * @type {Mixed}
	 */
	this['object_a'] = object_a;

	/**
	 * @property object_b
	 * @type {Mixed}
	 */
	this['object_b'] = object_b;

	/**
	 * @property max_length
	 * @type {Number}
	 */
	this['length'] = length;

	/**
	 * @property world
	 * @type {Goblin.World}
	 */
	this['world'] = null;
};

/**
 * @method createContact
 * @param contact {Goblin.MassPointContact}
 * @param limit {Number}
 * @return {Goblin.MassPointContact}
 */
Goblin.RodConstraint.prototype.createContact = function() {
	var _vec3 = _tmp_vec3_1,
		current_length,
		contact;

	vec3.subtract( this['object_a']['position'], this['object_b']['position'], _vec3 );
	current_length = vec3.length( _vec3 );

	// Otherwise return the contact.
	contact = Goblin.ObjectPool.getObject( 'MassPointContact' );
	contact['object_a'] = this['object_a'];
	contact['object_b'] = this['object_b'];

	// Calculate the normal.
	vec3.subtract( this['object_b']['position'], this['object_a']['position'], contact['contact_normal'] );
	vec3.normalize( contact['contact_normal'] );

	// The contact normal depends on whether we’re extending or compressing.
	if ( current_length > this['length'] ) {
		contact['penetration'] = current_length - this['length'];
	} else {
		vec3.scale( contact['contact_normal'], -1 );
		contact['penetration'] = this['length'] - current_length;
	}

	// Always use zero restitution (no bounciness).
	contact['restitution'] = 0;

	return contact;
};

/**
 * @method apply
 */
Goblin.RodConstraint.prototype.apply = function() {
	var contact = this.createContact();
	if ( contact !== null ) {
		this['world']['contacts'].push( contact );
	}
};

// mappings for closure compiler
Goblin['RodConstraint'] = Goblin.RodConstraint;
Goblin.RodConstraint['createContact'] = Goblin.RodConstraint.prototype.createContact;
Goblin.RodConstraint['apply'] = Goblin.RodConstraint.prototype.apply;