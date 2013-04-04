/**
 * Takes possible contacts found by a broad phase and determines if they are legitimate contacts
 *
 * @class NearPhase
 * @constructor
 */
Goblin.NearPhase = function() {
	/**
	 * Holds all contacts which currently exist in the scene
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
	var _vec3_1 = _tmp_vec3_1,
		_vec3_2 = _tmp_vec3_2,
		_vec3_3 = _tmp_vec3_3,
		i,
		possible_contacts_length = possible_contacts.length,
		//existing_contacts_length = this.contacts.length,
		object_a,
		object_b,
		position_a,
		position_b,
		distance,
		contact;

	// Free any contacts previously created
	/*for ( i = 0; i < existing_contacts_length; i++ ) {
		Goblin.ObjectPool.freeObject( 'ContactDetails', this.contacts.pop() );
	}*/

	// Make sure all of the manifolds are up to date
	this.updateContactManifolds();

	for ( i = 0; i < possible_contacts_length; i++ ) {
		object_a = possible_contacts[i][0];
		object_b = possible_contacts[i][1];

		if ( object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.SphereShape ) {
			// Sphere - Sphere contact check

			// Cache positions of the sphere
			position_a = object_a.position;
			position_b = object_b.position;

			// Get the vector between the two objects
			vec3.subtract( position_b, position_a, _vec3_1 );
			distance = vec3.length( _vec3_1 );

			// If the distance between the objects is greater than their combined radii
			// then they are not touching, continue processing the other possible contacts
			if ( distance > object_a.bounding_radius + object_b.bounding_radius ) {
				continue;
			}

			// Get a ContactDetails object and fill out it's information
			contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
			contact.object_a = object_a;
			contact.object_b = object_b;

			// Because we already have the distance (vector magnitude), don't call vec3.normalize
			// instead we will calculate this value manually
			vec3.scale( _vec3_1, 1 / distance, contact.contact_normal );

			// Calculate contact position
			vec3.scale( _vec3_1, -0.5 );
			vec3.add( _vec3_1, position_a, contact.contact_point );

			// Calculate penetration depth
			contact.penetration_depth = object_a.bounding_radius + object_b.bounding_radius - distance;

			// Contact points in both objects - in world coordinates at first
			vec3.scale( contact.contact_normal, contact.object_a.bounding_radius, contact.contact_point_in_a );
			vec3.add( contact.contact_point_in_a, contact.object_a.position );
			vec3.scale( contact.contact_normal, -contact.object_b.bounding_radius, contact.contact_point_in_b );
			vec3.add( contact.contact_point_in_b, contact.object_b.position );

			// Find actual contact point
			vec3.add( contact.contact_point_in_a, contact.contact_point_in_b, contact.contact_point );
			vec3.scale( contact.contact_point, 0.5 );

			// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
			mat4.multiplyVec3( contact.object_a.transform_inverse, contact.contact_point_in_a );
			mat4.multiplyVec3( contact.object_b.transform_inverse, contact.contact_point_in_b );

			contact.restitution = ( object_a.restitution + object_b.restitution ) / 2;
			contact.friction = ( object_a.friction + object_b.friction ) / 2;

			this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );

		} else if (
				object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.BoxShape ||
				object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.SphereShape
			) {

			// Sphere - Box contact check

			var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
				box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a;

			// Transform the center of the sphere into box coordinates
			mat4.multiplyVec3( object_b.transform_inverse, sphere.position, _vec3_1 );

			// Early out check to see if we can exclude the contact
			if ( Math.abs( _vec3_1[0] ) - sphere.bounding_radius > box.shape.half_width ||
				Math.abs( _vec3_1[1] ) - sphere.bounding_radius > box.shape.half_height ||
				Math.abs( _vec3_1[2] ) - sphere.bounding_radius > box.shape.half_depth )
			{
				continue;
			}

			// `_vec3_2` will hold the closest point of the box to the sphere
			_vec3_2[0] = _vec3_2[1] = _vec3_2[2] = 0;

			// Clamp each coordinate to the box.
			distance = _vec3_1[0];
			if (distance > box.shape.half_width) {
				distance = box.shape.half_width;
			} else if (distance < -box.shape.half_width) {
				distance = -box.shape.half_width;
			}
			_vec3_2[0] = distance;

			distance = _vec3_1[1];
			if (distance > box.shape.half_height) {
				distance = box.shape.half_height;
			} else if (distance < -box.shape.half_height) {
				distance = -box.shape.half_height;
			}
			_vec3_2[1] = distance;

			distance = _vec3_1[2];
			if (distance > box.shape.half_depth) {
				distance = box.shape.half_depth;
			} else if (distance < -box.shape.half_depth) {
				distance = -box.shape.half_depth;
			}
			_vec3_2[2] = distance;

			// Check we're in contact
			vec3.subtract( _vec3_2, _vec3_1, _vec3_3 );
			distance = vec3.squaredLength( _vec3_3 );
			if (distance > sphere.bounding_radius * sphere.bounding_radius ) {
				continue;
			}

			// Get a ContactDetails object and fill out it's information
			contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
			contact.object_a = sphere;
			contact.object_b = box;

			// Set contact point of `object_b` (the box)
			vec3.set( _vec3_2, contact.contact_point_in_b );

			// Move the closest point back to world coordinates
			mat4.multiplyVec3( box.transform, _vec3_2 );

			// Contact normal is the line between the sphere's position and the closest point
			vec3.subtract( sphere.position, _vec3_2, _vec3_3 );
			vec3.normalize( _vec3_3, contact.contact_normal );
			vec3.scale( contact.contact_normal, -1 );

			// Calculate contact position
			vec3.set( _vec3_2, contact.contact_point );

			// Find contact points in the objects
			// Convert contact_point into both object's local frames
			mat4.multiplyVec3( contact.object_a.transform_inverse, _vec3_2, contact.contact_point_in_a );
			mat4.multiplyVec3( contact.object_b.transform_inverse, _vec3_2, contact.contact_point_in_b );

			// Calculate penetration depth
			contact.penetration_depth = sphere.bounding_radius - Math.sqrt( distance );

			contact.restitution = ( sphere.restitution + box.restitution ) / 2;
			contact.friction = ( sphere.friction + box.friction ) / 2;

			this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );

		//} else if ( object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.BoxShape ) {
		} else {

			// contact check based on GJK
			if ( (contact = Goblin.GjkEpa.GJK( object_a, object_b )) !== false ) {
				this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
			}

		}

		//this.updateContactManifolds();
	}
};