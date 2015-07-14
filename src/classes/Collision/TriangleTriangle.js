/**
 * Performs an intersection test between two triangles
 *
 * @method TriangleTriangle
 * @param tri_a {TriangleShape}
 * @param tri_b {TriangleShape}
 */
Goblin.TriangleTriangle = function( tri_a, tri_b ) {
	var dv1_0 = tri_b.classifyVertex( tri_a.a ),
		dv1_1 = tri_b.classifyVertex( tri_a.b ),
		dv1_2 = tri_b.classifyVertex( tri_a.c );

	if (
		(dv1_0 > 0 && dv1_1 > 0 && dv1_2 > 0 ) ||
		(dv1_0 < 0 && dv1_1 < 0 && dv1_2 < 0 )
	)
	{
		// All vertices of tri_a are on the same side of tri_b, no intersection possible
		return null;
	}

	var dv2_0 = tri_a.classifyVertex( tri_b.a ),
		dv2_1 = tri_a.classifyVertex( tri_b.b ),
		dv2_2 = tri_a.classifyVertex( tri_b.c );
	if (
		( dv2_0 > 0 && dv2_1 > 0 && dv2_2 > 0 ) ||
		( dv2_0 < 0 && dv2_1 < 0 && dv2_2 < 0 )
		)
	{
		// All vertices of tri_b are on the same side of tri_a, no intersection possible
		return null;
	}

	var d = new Goblin.Vector3();
	d.crossVectors( tri_a.normal, tri_b.normal );
	d.normalize();

	var pv1_0 = d.dot( tri_a.a ),
		pv1_1 = d.dot( tri_a.b ),
		pv1_2 = d.dot( tri_a.c ),
		pv2_0 = d.dot( tri_b.a ),
		pv2_1 = d.dot( tri_b.b ),
		pv2_2 = d.dot( tri_b.c );

	var aa = tri_a.a,
		ab = tri_a.b,
		ac = tri_a.c,
		ba = tri_b.a,
		bb = tri_b.b,
		bc = tri_b.c;

	var tmp;
	if ( Math.sign( dv1_0 ) === Math.sign( dv1_1 ) ) {
		tmp = dv1_0;
		dv1_0 = dv1_2;
		dv1_2 = tmp;

		tmp = pv1_0;
		pv1_0 = pv1_2;
		pv1_2 = tmp;

		tmp = aa;
		aa = ac;
		ac = tmp;
	} else if ( Math.sign( dv1_0 ) === Math.sign( dv1_2 ) ) {
		tmp = dv1_0;
		dv1_0 = dv1_1;
		dv1_1 = tmp;

		tmp = pv1_0;
		pv1_0 = pv1_1;
		pv1_1 = tmp;

		tmp = aa;
		aa = ab;
		ab = tmp;
	}

	if ( Math.sign( dv2_0 ) === Math.sign( dv2_1 ) ) {
		tmp = dv2_0;
		dv2_0 = dv2_2;
		dv2_2 = tmp;

		tmp = pv2_0;
		pv2_0 = pv2_2;
		pv2_2 = tmp;

		tmp = ba;
		ba = bc;
		bc = tmp;
	} else if ( Math.sign( dv2_0 ) === Math.sign( dv2_2 ) ) {
		tmp = dv2_0;
		dv2_0 = dv2_1;
		dv2_1 = tmp;

		tmp = pv2_0;
		pv2_0 = pv2_1;
		pv2_1 = tmp;

		tmp = ba;
		ba = bb;
		bb = tmp;
	}

	var a_t1 = pv1_0 + ( pv1_1 - pv1_0 ) * ( dv1_0 / ( dv1_0 - dv1_1 ) ),
		a_t2 = pv1_0 + ( pv1_2 - pv1_0 ) * ( dv1_0 / ( dv1_0 - dv1_2 ) ),
		b_t1 = pv2_0 + ( pv2_1 - pv2_0 ) * ( dv2_0 / ( dv2_0 - dv2_1 ) ),
		b_t2 = pv2_0 + ( pv2_2 - pv2_0 ) * ( dv2_0 / ( dv2_0 - dv2_2 ) );

	if ( a_t1 > a_t2 ) {
		tmp = a_t1;
		a_t1 = a_t2;
		a_t2 = tmp;

		tmp = pv1_1;
		pv1_1 = pv1_2;
		pv1_2 = tmp;

		tmp = ab;
		ab = ac;
		ac = tmp;
	}
	if ( b_t1 > b_t2 ) {
		tmp = b_t1;
		b_t1 = b_t2;
		b_t2 = tmp;

		tmp = pv2_1;
		pv2_1 = pv2_2;
		pv2_2 = tmp;

		tmp = bb;
		bb = bc;
		bc = tmp;
	}

	if (
		( a_t1 >= b_t1 && a_t1 <= b_t2 ) ||
		( a_t2 >= b_t1 && a_t2 <= b_t2 ) ||
		( b_t1 >= a_t1 && b_t1 <= a_t2 ) ||
		( b_t2 >= a_t1 && b_t2 <= a_t2 )
	) {
		//console.log( 'contact' );

		var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );

		contact.object_a = tri_a;
		contact.object_b = tri_b;

        //debugger;

        var best_a_a = new Goblin.Vector3(),
            best_a_b = new Goblin.Vector3(),
            best_a_n = new Goblin.Vector3(),
            best_b_a = new Goblin.Vector3(),
            best_b_b = new Goblin.Vector3(),
            best_b_n = new Goblin.Vector3(),
            has_a = false,
            has_b = false;

        if ( tri_b.classifyVertex( aa ) <= 0 ) {
            // aa is penetrating tri_b
            has_a = true;
            Goblin.GeometryMethods.findClosestPointInTriangle( aa, ba, bb, bc, best_a_b );
            best_a_a.copy( aa );
            best_a_n.copy( tri_b.normal );
            best_a_n.scale( -1 );
        } else {
            if ( a_t1 >= b_t1 && a_t1 <= b_t2 ) {
                // ab is penetrating tri_b
                has_a = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( ab, ba, bb, bc, best_a_b );
                best_a_a.copy( ab );
                best_a_n.copy( tri_b.normal );
                best_a_n.scale( -1 );
            } else if ( a_t2 >= b_t1 && a_t2 <= b_t2 ) {
                // ac is penetration tri_b
                has_a = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( ac, ba, bb, bc, best_a_b );
                best_a_a.copy( ac );
                best_a_n.copy( tri_b.normal );
                best_a_n.scale( -1 );
            }
        }

        if ( tri_a.classifyVertex( ba ) <= 0 ) {
            // ba is penetrating tri_a
            has_b = true;
            Goblin.GeometryMethods.findClosestPointInTriangle( ba, aa, ab, ac, best_b_a );
            best_b_b.copy( ba );
            best_b_n.copy( tri_a.normal );
        } else {
            if ( b_t1 >= a_t1 && b_t1 <= a_t2 ) {
                // bb is penetrating tri_a
                has_b = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( bb, aa, ab, ac, best_b_a );
                best_b_b.copy( bb );
                best_b_n.copy( tri_a.normal );
            } else if ( b_t2 >= a_t1 && b_t2 <= a_t2 ) {
                // bc is penetration tri_a
                has_b = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( bc, aa, ab, ac, best_b_a );
                best_b_b.copy( bc );
                best_b_n.copy( tri_a.normal );
            }
        }

        _tmp_vec3_1.subtractVectors( best_a_a, best_a_b );
        _tmp_vec3_2.subtractVectors( best_b_a, best_b_b );
        if ( !has_b || ( has_a && _tmp_vec3_1.lengthSquared() < _tmp_vec3_2.lengthSquared() ) ) {
            contact.contact_point_in_a.copy( best_a_a );
            contact.contact_point_in_b.copy( best_a_b );
            contact.contact_normal.copy( best_a_n );
        } else {
            contact.contact_point_in_a.copy( best_b_a );
            contact.contact_point_in_b.copy( best_b_b );
            contact.contact_normal.copy( best_b_n );
        }
        _tmp_vec3_1.subtractVectors( contact.contact_point_in_a, contact.contact_point_in_b );
        contact.penetration_depth = _tmp_vec3_1.length();
        //console.log( 'depth', contact.penetration_depth );
        //console.log( contact.contact_normal );
		//if (contact.penetration_depth > 1) debugger;



		contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
		contact.contact_point.scale( 0.5 );

		/*m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xFF0000 }) );
		m.position.copy( contact.contact_point_in_a );
		exampleUtils.scene.add( m );

        m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0x0000FF }) );
        m.position.copy( contact.contact_point_in_b );
        exampleUtils.scene.add( m );

        m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0x00FF00 }) );
        m.position.copy( contact.contact_point );
        exampleUtils.scene.add( m );*/

		return contact;
	}

	/*var m;
	_tmp_vec3_1.scaleVector( d, a_t1 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xDDAAAA }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, a_t2 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xDDAAAA }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, b_t1 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xAAAADD }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, b_t2 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xAAAADD }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );*/

	return null;
};
