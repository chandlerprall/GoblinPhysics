Goblin.BoxSphere = function( object_a, object_b ) {
	var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
		box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a,
		contact;

	// Transform the center of the sphere into box coordinates
	mat4.multiplyVec3( object_b.transform_inverse, sphere.position, _tmp_vec3_1 );

	// Early out check to see if we can exclude the contact
	if ( Math.abs( _tmp_vec3_1[0] ) - sphere.shape.radius > box.shape.half_width ||
		Math.abs( _tmp_vec3_1[1] ) - sphere.shape.radius > box.shape.half_height ||
		Math.abs( _tmp_vec3_1[2] ) - sphere.shape.radius > box.shape.half_depth )
	{
		return;
	}

	// `_tmp_vec3_2` will hold the closest point of the box to the sphere
	_tmp_vec3_2[0] = _tmp_vec3_2[1] = _tmp_vec3_2[2] = 0;

	// Clamp each coordinate to the box.
	var distance = _tmp_vec3_1[0];
	if (distance > box.shape.half_width) {
		distance = box.shape.half_width;
	} else if (distance < -box.shape.half_width) {
		distance = -box.shape.half_width;
	}
	_tmp_vec3_2[0] = distance;

	distance = _tmp_vec3_1[1];
	if (distance > box.shape.half_height) {
		distance = box.shape.half_height;
	} else if (distance < -box.shape.half_height) {
		distance = -box.shape.half_height;
	}
	_tmp_vec3_2[1] = distance;

	distance = _tmp_vec3_1[2];
	if (distance > box.shape.half_depth) {
		distance = box.shape.half_depth;
	} else if (distance < -box.shape.half_depth) {
		distance = -box.shape.half_depth;
	}
	_tmp_vec3_2[2] = distance;

	// Check we're in contact
	vec3.subtract( _tmp_vec3_2, _tmp_vec3_1, _tmp_vec3_3 );
	distance = vec3.squaredLength( _tmp_vec3_3 );
	if (distance > sphere.shape.radius * sphere.shape.radius ) {
		return;
	}

	if ( distance === 0 ) {
		// The center of the sphere is contained within the box
		// @TODO better resolution than just ignoring the contact
		return;
	}

	// Get a ContactDetails object and fill out it's information
	contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = sphere;
	contact.object_b = box;

	// Set contact point of `object_b` (the box)
	vec3.set( _tmp_vec3_2, contact.contact_point_in_b );

	// Move the closest point back to world coordinates
	mat4.multiplyVec3( box.transform, _tmp_vec3_2 );

	// Contact normal is the line between the sphere's position and the closest point
	vec3.subtract( sphere.position, _tmp_vec3_2, _tmp_vec3_3 );
	vec3.normalize( _tmp_vec3_3, contact.contact_normal );
	vec3.scale( contact.contact_normal, -1 );

	// Calculate contact position
	vec3.set( _tmp_vec3_2, contact.contact_point );

	// Find contact points in the objects
	// Convert contact_point into both object's local frames
	mat4.multiplyVec3( contact.object_a.transform_inverse, _tmp_vec3_2, contact.contact_point_in_a );
	mat4.multiplyVec3( contact.object_b.transform_inverse, _tmp_vec3_2, contact.contact_point_in_b );

	// Calculate penetration depth
	contact.penetration_depth = sphere.shape.radius - Math.sqrt( distance );

	contact.restitution = ( sphere.restitution + box.restitution ) / 2;
	contact.friction = ( sphere.friction + box.friction ) / 2;

	return contact;
};