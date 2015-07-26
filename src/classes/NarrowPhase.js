/**
 * Takes possible contacts found by a broad phase and determines if they are legitimate contacts
 *
 * @class NarrowPhase
 * @constructor
 */
Goblin.NarrowPhase = function() {
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
Goblin.NarrowPhase.prototype.updateContactManifolds = function() {
	var current = this.contact_manifolds.first,
		prev = null;

	while ( current !== null ) {
		current.update();

		if ( current.points.length === 0 ) {
			Goblin.ObjectPool.freeObject( 'ContactManifold', current );
			if ( prev == null ) {
				this.contact_manifolds.first = current.next_manifold;
			} else {
				prev.next_manifold = current.next_manifold;
			}
			current = current.next_manifold;
		} else {
			prev = current;
			current = current.next_manifold;
		}
	}
};

Goblin.NarrowPhase.prototype.midPhase = function( object_a, object_b ) {
	var compound,
		other;

	if ( object_a.shape instanceof Goblin.CompoundShape ) {
		compound = object_a;
		other = object_b;
	} else {
		compound = object_b;
		other = object_a;
	}

	var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' ),
		child_shape, contact;
	for ( var i = 0; i < compound.shape.child_shapes.length; i++ ) {
		child_shape = compound.shape.child_shapes[i];
		proxy.setFrom( compound, child_shape );

		if ( proxy.shape instanceof Goblin.CompoundShape || other.shape instanceof Goblin.CompoundShape ) {
			this.midPhase( proxy, other );
		} else {
			contact = this.getContact( proxy, other );
			if ( contact != null ) {
				var parent_a, parent_b;
				if ( contact.object_a === proxy ) {
					contact.object_a = compound;
					parent_a = proxy;
					parent_b = other;
				} else {
					contact.object_b = compound;
					parent_a = other;
					parent_b = proxy;
				}

				if ( parent_a instanceof Goblin.RigidBodyProxy ) {
					while ( parent_a.parent ) {
						if ( parent_a instanceof Goblin.RigidBodyProxy ) {
							parent_a.shape_data.transform.transformVector3( contact.contact_point_in_a );
						}
						parent_a = parent_a.parent;
					}
				}

				if ( parent_b instanceof Goblin.RigidBodyProxy ) {
					while ( parent_b.parent ) {
						if ( parent_b instanceof Goblin.RigidBodyProxy ) {
							parent_b.shape_data.transform.transformVector3( contact.contact_point_in_b );
						}
						parent_b = parent_b.parent;
					}
				}

				contact.object_a = parent_a;
				contact.object_b = parent_b;
				this.addContact( parent_a, parent_b, contact );
			}
		}
	}
	Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );
};

Goblin.NarrowPhase.prototype.meshCollision = (function(){
	var b_to_a = new Goblin.Matrix4(),
		tri_b = new Goblin.TriangleShape( new Goblin.Vector3(), new Goblin.Vector3(), new Goblin.Vector3() ),
		b_aabb = new Goblin.AABB(),
		b_right_aabb = new Goblin.AABB(),
		b_left_aabb = new Goblin.AABB();

	function meshMesh( object_a, object_b, addContact ) {
		// get matrix which converts from object_b's space to object_a
		b_to_a.copy( object_a.transform_inverse );
		b_to_a.multiply( object_b.transform );

		// traverse both objects' AABBs while they overlap, if two overlapping leaves are found then perform Triangle/Triangle intersection test
		var nodes = [ object_a.shape.hierarchy, object_b.shape.hierarchy ];
		//debugger;
		while ( nodes.length ) {
			var a_node = nodes.shift(),
				b_node = nodes.shift();

			if ( a_node.isLeaf() && b_node.isLeaf() ) {
				// Both sides are triangles, do intersection test
                // convert node_b's triangle into node_a's frame
                b_to_a.transformVector3Into( b_node.object.a, tri_b.a );
                b_to_a.transformVector3Into( b_node.object.b, tri_b.b );
                b_to_a.transformVector3Into( b_node.object.c, tri_b.c );
                _tmp_vec3_1.subtractVectors( tri_b.b, tri_b.a );
                _tmp_vec3_2.subtractVectors( tri_b.c, tri_b.a );
                tri_b.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
                tri_b.normal.normalize();

				var contact = Goblin.TriangleTriangle( a_node.object, tri_b );
                if ( contact != null ) {
					object_a.transform.rotateVector3( contact.contact_normal );

                    object_a.transform.transformVector3( contact.contact_point );

                    object_a.transform.transformVector3( contact.contact_point_in_b );
                    object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

                    contact.object_a = object_a;
                    contact.object_b = object_b;

                    contact.restitution = ( object_a.restitution + object_b.restitution ) / 2;
                    contact.friction = ( object_a.friction + object_b.friction ) / 2;
                    /*console.log( contact );
                    debugger;*/

                    addContact( object_a, object_b, contact );
                }
			} else if ( a_node.isLeaf() ) {
				// just a_node is a leaf
				b_left_aabb.transform( b_node.left.aabb, b_to_a );
				if ( a_node.aabb.intersects( b_left_aabb ) ) {
					nodes.push( a_node, b_node.left );
				}
				b_right_aabb.transform( b_node.right.aabb, b_to_a );
				if ( a_node.aabb.intersects( b_right_aabb ) ) {
					nodes.push( a_node, b_node.right );
				}
			} else if ( b_node.isLeaf() ) {
				// just b_node is a leaf
				b_aabb.transform( b_node.aabb, b_to_a );
				if ( b_aabb.intersects( a_node.left.aabb ) ) {
					nodes.push( a_node.left, b_node );
				}
				if ( b_aabb.intersects( a_node.right.aabb ) ) {
					nodes.push( a_node.right, b_node );
				}
			} else {
				// neither node is a branch
				b_left_aabb.transform( b_node.left.aabb, b_to_a );
				b_right_aabb.transform( b_node.right.aabb, b_to_a );
				if ( a_node.left.aabb.intersects( b_left_aabb ) ) {
					nodes.push( a_node.left, b_node.left );
				}
				if ( a_node.left.aabb.intersects( b_right_aabb ) ) {
					nodes.push( a_node.left, b_node.right );
				}
				if ( a_node.right.aabb.intersects( b_left_aabb ) ) {
					nodes.push( a_node.right, b_node.left );
				}
				if ( a_node.right.aabb.intersects( b_right_aabb ) ) {
					nodes.push( a_node.right, b_node.right );
				}
			}
		}
	}

	function triangleConvex( triangle, mesh, convex ) {
		// Create proxy to convert convex into mesh's space
		var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' );

		var child_shape = new Goblin.CompoundShapeChild( triangle, new Goblin.Vector3(), new Goblin.Quaternion() );
		proxy.setFrom( mesh, child_shape );

		var simplex = Goblin.GjkEpa.GJK( proxy, convex ),
			contact;
		if ( Goblin.GjkEpa.result != null ) {
			contact = Goblin.GjkEpa.result;
		} else if ( simplex != null ) {
			contact = Goblin.GjkEpa.EPA( simplex );
		}

		Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );

		return contact;
	}

	var meshConvex = (function(){
		var convex_to_mesh = new Goblin.Matrix4(),
			convex_aabb_in_mesh = new Goblin.AABB();

		return function meshConvex( mesh, convex, addContact ) {
			// Find matrix that converts convex into mesh space
			convex_to_mesh.copy( convex.transform );
			convex_to_mesh.multiply( mesh.transform_inverse );

			convex_aabb_in_mesh.transform( convex.aabb, mesh.transform_inverse );

			// Traverse the BHV in mesh
			var pending_nodes = [ mesh.shape.hierarchy ],
				node;
			while ( ( node = pending_nodes.shift() ) ) {
				if ( node.aabb.intersects( convex_aabb_in_mesh ) ) {
					if ( node.isLeaf() ) {
						// Check node for collision
						var contact = triangleConvex( node.object, mesh, convex );
						if ( contact != null ) {
							var _mesh = mesh;
							while ( _mesh.parent != null ) {
								_mesh = _mesh.parent;
							}
							contact.object_a = _mesh;
							addContact( _mesh, convex, contact );
						}
					} else {
						pending_nodes.push( node.left, node.right );
					}
				}
			}
		};
	})();

	return function meshCollision( object_a, object_b ) {
		var a_is_mesh = object_a.shape instanceof Goblin.MeshShape,
			b_is_mesh = object_b.shape instanceof Goblin.MeshShape;

		if ( a_is_mesh && b_is_mesh ) {
			meshMesh( object_a, object_b, this.addContact.bind( this ) );
		} else {
			if ( a_is_mesh ) {
				meshConvex( object_a, object_b, this.addContact.bind( this ) );
			} else {
				meshConvex( object_b, object_a, this.addContact.bind( this ) );
			}
		}
	};
})();

/**
 * Tests two objects for contact
 *
 * @method getContact
 * @param {RigidBody} object_a
 * @param {RigidBody} object_b
 */
Goblin.NarrowPhase.prototype.getContact = function( object_a, object_b ) {
	if ( object_a.shape instanceof Goblin.CompoundShape || object_b.shape instanceof Goblin.CompoundShape ) {
		this.midPhase( object_a, object_b );
		return;
	}

	if ( object_a.shape instanceof Goblin.MeshShape || object_b.shape instanceof Goblin.MeshShape ) {
		this.meshCollision( object_a, object_b );
		return;
	}

	var contact;

	if ( object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.SphereShape ) {
		// Sphere - Sphere contact check
		contact = Goblin.SphereSphere( object_a, object_b );
	} else if (
		object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.BoxShape ||
		object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.SphereShape
	) {
		// Sphere - Box contact check
		contact = Goblin.BoxSphere( object_a, object_b );
	} else {
		// contact check based on GJK
		var simplex = Goblin.GjkEpa.GJK( object_a, object_b );
		if ( Goblin.GjkEpa.result != null ) {
			contact = Goblin.GjkEpa.result;
		} else if ( simplex != null ) {
			contact = Goblin.GjkEpa.EPA( simplex );
		}
	}

	return contact;
};

Goblin.NarrowPhase.prototype.addContact = function( object_a, object_b, contact ) {
	this.contact_manifolds.getManifoldForObjects( object_a, object_b ).addContact( contact );
};

/**
 * Loops over the passed array of object pairs which may be in contact
 * valid contacts are put in this object's `contacts` property
 *
 * @param possible_contacts {Array}
 */
Goblin.NarrowPhase.prototype.generateContacts = function( possible_contacts ) {
	var i,
		contact,
		possible_contacts_length = possible_contacts.length;

	// Make sure all of the manifolds are up to date
	this.updateContactManifolds();

	for ( i = 0; i < possible_contacts_length; i++ ) {
		contact = this.getContact( possible_contacts[i][0], possible_contacts[i][1] );
		if ( contact != null ) {
			this.addContact( possible_contacts[i][0], possible_contacts[i][1], contact );
		}
	}
};