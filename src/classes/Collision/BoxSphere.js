Goblin.BoxSphere = function( object_a, object_b ) {
	var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
		box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a,
		contact, distance;

	// Transform the center of the sphere into box coordinates
	mat4.multiplyVec3( box.transform_inverse, sphere.position, _tmp_vec3_1 );

	// Early out check to see if we can exclude the contact
	if ( Math.abs( _tmp_vec3_1[0] ) - sphere.shape.radius > box.shape.half_width ||
		Math.abs( _tmp_vec3_1[1] ) - sphere.shape.radius > box.shape.half_height ||
		Math.abs( _tmp_vec3_1[2] ) - sphere.shape.radius > box.shape.half_depth )
	{
		return;
	}

	// `_tmp_vec3_1` is the center of the sphere in relation to the box
	// `_tmp_vec3_2` will hold the point on the box closest to the sphere
	_tmp_vec3_2[0] = _tmp_vec3_2[1] = _tmp_vec3_2[2] = 0;

	// Clamp each coordinate to the box.
	distance = _tmp_vec3_1[0];
	if ( distance > box.shape.half_width ) {
		distance = box.shape.half_width;
	} else if (distance < -box.shape.half_width ) {
		distance = -box.shape.half_width;
	}
	_tmp_vec3_2[0] = distance;

	distance = _tmp_vec3_1[1];
	if ( distance > box.shape.half_height ) {
		distance = box.shape.half_height;
	} else if (distance < -box.shape.half_height ) {
		distance = -box.shape.half_height;
	}
	_tmp_vec3_2[1] = distance;

	distance = _tmp_vec3_1[2];
	if ( distance > box.shape.half_depth ) {
		distance = box.shape.half_depth;
	} else if (distance < -box.shape.half_depth ) {
		distance = -box.shape.half_depth;
	}
	_tmp_vec3_2[2] = distance;

	// Check we're in contact
	vec3.subtract( _tmp_vec3_2, _tmp_vec3_1, _tmp_vec3_3 );
	distance = vec3.squaredLength( _tmp_vec3_3 );
	if ( distance > sphere.shape.radius * sphere.shape.radius ) {
		return;
	}

	// Get a ContactDetails object populate it
	contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = sphere;
	contact.object_b = box;

	if ( distance === 0 ) {

		// The center of the sphere is contained within the box
		Goblin.BoxSphere.spherePenetration( box.shape, _tmp_vec3_1, _tmp_vec3_2, contact );

	} else {

		// Center of the sphere is outside of the box

		// Find contact normal and penetration depth
		vec3.subtract( _tmp_vec3_2, _tmp_vec3_1, contact.contact_normal );
		contact.penetration_depth = -vec3.length( contact.contact_normal );
		vec3.scale( contact.contact_normal, -1 / contact.penetration_depth );

		// Set contact point of `object_b` (the box)
		vec3.set( _tmp_vec3_2, contact.contact_point_in_b );

	}

	// Update penetration depth to include sphere's radius
	contact.penetration_depth += sphere.shape.radius;

	// Convert contact normal to world coordinates
	mat4.toRotationMat( box.transform, _tmp_mat4_1 );
	mat4.multiplyVec3( _tmp_mat4_1, contact.contact_normal );

	// Contact point in `object_a` (the sphere) is the normal * radius converted to the sphere's frame
	mat4.toRotationMat( sphere.transform_inverse, _tmp_mat4_1 );
	mat4.multiplyVec3( _tmp_mat4_1, contact.contact_normal, contact.contact_point_in_a );
	vec3.scale( contact.contact_point_in_a, sphere.shape.radius );

	// Find contact position
	vec3.scale( contact.contact_normal, sphere.shape.radius - contact.penetration_depth / 2, contact.contact_point );
	vec3.add( contact.contact_point, sphere.position );

	contact.restitution = ( sphere.restitution + box.restitution ) / 2;
	contact.friction = ( sphere.friction + box.friction ) / 2;

	return contact;
};

Goblin.BoxSphere.spherePenetration = function( box, sphere_center, box_point, contact ) {
	var min_distance, face_distance;

	if ( sphere_center[0] < 0 ) {
		min_distance = box.half_width + sphere_center[0];
		box_point[0] = -box.half_width;
		box_point[1] = box_point[2] = 0;
		contact.penetration_depth = min_distance;
	} else {
		min_distance = box.half_width - sphere_center[0];
		box_point[0] = box.half_width;
		box_point[1] = box_point[2] = 0;
		contact.penetration_depth = min_distance;
	}

	if ( sphere_center[1] < 0 ) {
		face_distance = box.half_height + sphere_center[1];
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point[1] = -box.half_height;
			box_point[0] = box_point[2] = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_height - sphere_center[1];
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point[1] = box.half_height;
			box_point[0] = box_point[2] = 0;
			contact.penetration_depth = min_distance;
		}
	}

	if ( sphere_center[2] < 0 ) {
		face_distance = box.half_depth + sphere_center[2];
		if ( face_distance < min_distance ) {
			box_point[2] = -box.half_depth;
			box_point[0] = box_point[1] = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_depth - sphere_center[2];
		if ( face_distance < min_distance ) {
			box_point[2] = box.half_depth;
			box_point[0] = box_point[1] = 0;
			contact.penetration_depth = min_distance;
		}
	}

	// Set contact point of `object_b` (the box)
	vec3.set( _tmp_vec3_2, contact.contact_point_in_b );
	vec3.scale( contact.contact_point_in_b, -1, contact.contact_normal );
	vec3.normalize( contact.contact_normal );
};