Goblin.SphereSphere = function( object_a, object_b ) {
	// Cache positions of the spheres
	var position_a = object_a.position,
		position_b = object_b.position;

	// Get the vector between the two objects
	_tmp_vec3_1.subtractVectors( position_b, position_a );
	var distance = _tmp_vec3_1.length();

	// If the distance between the objects is greater than their combined radii
	// then they are not touching, continue processing the other possible contacts
	if ( distance > object_a.shape.radius + object_b.shape.radius ) {
		return;
	}

	// Get a ContactDetails object and fill out it's information
	var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = object_a;
	contact.object_b = object_b;

	// Because we already have the distance (vector magnitude), don't normalize
	// instead we will calculate this value manually
	contact.contact_normal.scaleVector( _tmp_vec3_1, 1 / distance );

	// Calculate contact position
	_tmp_vec3_1.scale( -0.5  );
	contact.contact_point.addVectors( _tmp_vec3_1, position_a );

	// Calculate penetration depth
	contact.penetration_depth = object_a.shape.radius + object_b.shape.radius - distance;

	// Contact points in both objects - in world coordinates at first
	contact.contact_point_in_a.scaleVector( contact.contact_normal, contact.object_a.shape.radius );
	contact.contact_point_in_a.add( contact.object_a.position );
	contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.object_b.shape.radius );
	contact.contact_point_in_b.add( contact.object_b.position );

	// Find actual contact point
	contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
	contact.contact_point.scale( 0.5 );

	// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
	contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
	contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

	contact.restitution = ( object_a.restitution + object_b.restitution ) / 2;
	contact.friction = ( object_a.friction + object_b.friction ) / 2;

	return contact;
};