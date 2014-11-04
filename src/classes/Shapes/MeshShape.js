/**
 * @class MeshShape
 * @param vertices {Array<Vector3>} vertices comprising the mesh
 * @param faces {Array<Number>} array of indices indicating which vertices compose a face; faces[0..2] represent the first face, faces[3..5] are the second, etc
 * @constructor
 */
Goblin.MeshShape = function( vertices, faces ) {
	this.vertices = vertices;

	this.triangles = [];
	for ( var i = 0; i < faces.length; i += 3 ) {
		this.triangles.push( new Goblin.TriangleShape( vertices[faces[i]], vertices[faces[i+1]], vertices[faces[i+2]] ) );
	}

	/**
	 * the convex mesh's volume
	 * @property volume
	 * @type {number}
	 */
	this.volume = 0;

	/**
	 * coordinates of the mesh's COM
	 * @property center_of_mass
	 * @type {vec3}
	 */
	this.center_of_mass = new Goblin.Vector3();

	/**
	 * used in computing the mesh's center of mass & volume
	 * @property _intergral
	 * @type {Float32Array}
	 * @private
	 */
	this._integral = new Float32Array( 10 );

	this.hierarchy = new Goblin.BVH( this.triangles ).tree;

	var polygon_faces = this.triangles.map(
		function( triangle ) {
			return new Goblin.GjkEpa.Face(
				null,
				{ point: triangle.a },
				{ point: triangle.b },
				{ point: triangle.c }
			);
		}
	);

	Goblin.ConvexShape.prototype.computeVolume.call( this, polygon_faces );

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.MeshShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = 0;
	aabb.max.x = aabb.max.y = aabb.max.z = 0;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		aabb.min.x = Math.min( aabb.min.x, this.vertices[i].x );
		aabb.min.y = Math.min( aabb.min.y, this.vertices[i].y );
		aabb.min.z = Math.min( aabb.min.z, this.vertices[i].z );

		aabb.max.x = Math.max( aabb.max.x, this.vertices[i].x );
		aabb.max.y = Math.max( aabb.max.y, this.vertices[i].y );
		aabb.max.z = Math.max( aabb.max.z, this.vertices[i].z );
	}
};

Goblin.MeshShape.prototype.getInertiaTensor = function( mass ) {
	return Goblin.ConvexShape.prototype.getInertiaTensor.call( this, mass );
};

/**
 * noop
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.MeshShape.prototype.findSupportPoint = function( direction, support_point ) {
	return; // MeshShape isn't convex so it cannot be used directly in GJK
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.MeshShape.prototype.rayIntersect = (function(){
	var intersections = [],
		tSort = function( a, b ) {
			if ( a.t < b.t ) {
				return -1;
			} else if ( a.t > b.t ) {
				return 1;
			} else {
				return 0;
			}
		};

	return function( start, end ) {
		// Traverse the BVH and return the closest point of contact, if any
		var nodes = [ this.hierarchy ],
			node;
		intersections.length = 0;

		var count = 0;
		while ( nodes.length > 0 ) {
			count++;
			node = nodes.shift();

			if ( node.aabb.testRayIntersect( start, end ) ) {
				// Ray intersects this node's AABB
				if ( node.isLeaf() ) {
					var intersection = node.object.rayIntersect( start, end );
					if ( intersection != null ) {
						intersections.push( intersection );
					}
				} else {
					nodes.push( node.left, node.right );
				}
			}
		}

		intersections.sort( tSort );
		return intersections[0] || null;
	};
})();