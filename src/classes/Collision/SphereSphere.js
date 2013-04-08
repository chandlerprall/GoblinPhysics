Goblin.SphereSphere = function( object_a, object_b ) {
	// Cache positions of the spheres
	var position_a = object_a.position,
		position_b = object_b.position;

	// Get the vector between the two objects
	vec3.subtract( position_b, position_a, _tmp_vec3_1 );
	var distance = vec3.length( _tmp_vec3_1 );

	// If the distance between the objects is greater than their combined radii
	// then they are not touching, continue processing the other possible contacts
	if ( distance > object_a.bounding_radius + object_b.bounding_radius ) {
		return;
	}

	// Get a ContactDetails object and fill out it's information
	var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = object_a;
	contact.object_b = object_b;

	// Because we already have the distance (vector magnitude), don't call vec3.normalize
	// instead we will calculate this value manually
	vec3.scale( _tmp_vec3_1, 1 / distance, contact.contact_normal );

	// Calculate contact position
	vec3.scale( _tmp_vec3_1, -0.5 );
	vec3.add( _tmp_vec3_1, position_a, contact.contact_point );

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

	return contact;
};