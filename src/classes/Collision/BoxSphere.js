Goblin.BoxSphere = function( object_a, object_b ) {
	var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
		box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a,
		contact, distance;

	// Transform the center of the sphere into box coordinates
	box.transform_inverse.transformVector3Into( sphere.position, _tmp_vec3_1 );

	// Early out check to see if we can exclude the contact
	if ( Math.abs( _tmp_vec3_1.x ) - sphere.shape.radius > box.shape.half_width ||
		Math.abs( _tmp_vec3_1.y ) - sphere.shape.radius > box.shape.half_height ||
		Math.abs( _tmp_vec3_1.z ) - sphere.shape.radius > box.shape.half_depth )
	{
		return;
	}

	// `_tmp_vec3_1` is the center of the sphere in relation to the box
	// `_tmp_vec3_2` will hold the point on the box closest to the sphere
	_tmp_vec3_2.x = _tmp_vec3_2.y = _tmp_vec3_2.z = 0;

	// Clamp each coordinate to the box.
	distance = _tmp_vec3_1.x;
	if ( distance > box.shape.half_width ) {
		distance = box.shape.half_width;
	} else if (distance < -box.shape.half_width ) {
		distance = -box.shape.half_width;
	}
	_tmp_vec3_2.x = distance;

	distance = _tmp_vec3_1.y;
	if ( distance > box.shape.half_height ) {
		distance = box.shape.half_height;
	} else if (distance < -box.shape.half_height ) {
		distance = -box.shape.half_height;
	}
	_tmp_vec3_2.y = distance;

	distance = _tmp_vec3_1.z;
	if ( distance > box.shape.half_depth ) {
		distance = box.shape.half_depth;
	} else if (distance < -box.shape.half_depth ) {
		distance = -box.shape.half_depth;
	}
	_tmp_vec3_2.z = distance;

	// Check we're in contact
	_tmp_vec3_3.subtractVectors( _tmp_vec3_2, _tmp_vec3_1 );
	distance = _tmp_vec3_3.lengthSquared();
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
		contact.contact_normal.subtractVectors( _tmp_vec3_2, _tmp_vec3_1 );
		contact.penetration_depth = -contact.contact_normal.length();
		contact.contact_normal.scale( -1 / contact.penetration_depth );

		// Set contact point of `object_b` (the box )
		contact.contact_point_in_b.copy( _tmp_vec3_2 );

	}

	// Update penetration depth to include sphere's radius
	contact.penetration_depth += sphere.shape.radius;

	// Convert contact normal to world coordinates
	box.transform.rotateVector3( contact.contact_normal );

	// Contact point in `object_a` (the sphere) is the normal * radius converted to the sphere's frame
	sphere.transform_inverse.rotateVector3Into( contact.contact_normal, contact.contact_point_in_a );
	contact.contact_point_in_a.scale( sphere.shape.radius );

	// Find contact position
	contact.contact_point.scaleVector( contact.contact_normal, sphere.shape.radius - contact.penetration_depth / 2 );
	contact.contact_point.add( sphere.position );

	contact.restitution = ( sphere.restitution + box.restitution ) / 2;
	contact.friction = ( sphere.friction + box.friction ) / 2;

	return contact;
};

Goblin.BoxSphere.spherePenetration = function( box, sphere_center, box_point, contact ) {
	var min_distance, face_distance;

	if ( sphere_center.x < 0 ) {
		min_distance = box.half_width + sphere_center.x;
		box_point.x = -box.half_width;
		box_point.y = box_point.z = 0;
		contact.penetration_depth = min_distance;
	} else {
		min_distance = box.half_width - sphere_center.x;
		box_point.x = box.half_width;
		box_point.y = box_point.z = 0;
		contact.penetration_depth = min_distance;
	}

	if ( sphere_center.y < 0 ) {
		face_distance = box.half_height + sphere_center.y;
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point.y = -box.half_height;
			box_point.x = box_point.z = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_height - sphere_center.y;
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point.y = box.half_height;
			box_point.x = box_point.z = 0;
			contact.penetration_depth = min_distance;
		}
	}

	if ( sphere_center.z < 0 ) {
		face_distance = box.half_depth + sphere_center.z;
		if ( face_distance < min_distance ) {
			box_point.z = -box.half_depth;
			box_point.x = box_point.y = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_depth - sphere_center.z;
		if ( face_distance < min_distance ) {
			box_point.z = box.half_depth;
			box_point.x = box_point.y = 0;
			contact.penetration_depth = min_distance;
		}
	}

	// Set contact point of `object_b` (the box)
	contact.contact_point_in_b.copy( _tmp_vec3_2 );
	contact.contact_normal.scaleVector( contact.contact_point_in_b, -1 );
	contact.contact_normal.normalize();
};