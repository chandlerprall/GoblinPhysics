/**
 * Takes possible contacts found by a broad phase and determines if they are legitimate contacts
 *
 * @class NearPhase
 * @constructor
 */
Goblin.NearPhase = function() {
	/**
	 * holds all contacts which currently exist in the scene
	 *
	 * @property contact_manifolds
	 * @type Goblin.ContactManifoldList
	 */
	this.contact_manifolds = new Goblin.ContactManifoldList();
};

/**
 * Iterates over all contact manifolds, updating penetration depth & contact locations
 *
 * @method updateContactManifolds
 */
Goblin.NearPhase.prototype.updateContactManifolds = function() {
	var current = this.contact_manifolds.first,
		prev = null;

	while ( current !== null ) {
		current.update();

		// @TODO if a manifold has 0 points, remove it

		prev = current;
		current = current.next_manifold;
	}
};

/**
 * Loops over the passed array of object pairs which may be in contact
 * valid contacts are put in this object's `contacts` property
 *
 * @param possible_contacts {Array}
 */
Goblin.NearPhase.prototype.generateContacts = function( possible_contacts ) {
	var i,
		possible_contacts_length = possible_contacts.length,
		object_a,
		object_b,
		contact;

	// Make sure all of the manifolds are up to date
	this.updateContactManifolds();

	for ( i = 0; i < possible_contacts_length; i++ ) {
		object_a = possible_contacts[i][0];
		object_b = possible_contacts[i][1];

		if ( object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.SphereShape ) {
			// Sphere - Sphere contact check
			contact = Goblin.SphereSphere( object_a, object_b );
			if ( contact != null ) {
				this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
			}
		} else if (
				object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.BoxShape ||
				object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.SphereShape
			) {
			// Sphere - Box contact check
			contact = Goblin.BoxSphere( object_a, object_b );
			if ( contact != null ) {
				this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
			}
		} else {
			// contact check based on GJK
            /*if ( (contact = Goblin.GjkEpa.GJK( object_a, object_b )) !== false ) {
                this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
            }*/
			if ( (contact = Goblin.GjkEpa2.GJK( object_a, object_b )) != null ) {
				contact = Goblin.GjkEpa2.EPA( contact );
				if ( contact != null ) {
					this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
				}
			}
		}
	}
};