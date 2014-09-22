/**
 * @class ConvexShape
 * @param vertices {Array<vec3>} array of vertices composing the convex hull
 * @constructor
 */
Goblin.ConvexShape = function( vertices ) {
	/**
	 * vertices composing the convex hull
	 *
	 * @property vertices
	 * @type {Array<vec3>}
	 */
	this.vertices = [];

	/**
	 * faces composing the convex hull
	 * @type {Array}
	 */
	this.faces = [];

	/**
	 * the convex hull's volume
	 * @property volume
	 * @type {number}
	 */
	this.volume = 0;

	/**
	 * coordinates of the hull's COM
	 * @property center_of_mass
	 * @type {vec3}
	 */
	this.center_of_mass = new Goblin.Vector3();

	/**
	 * used in computing the convex hull's center of mass & volume
	 * @property _intergral
	 * @type {Float32Array}
	 * @private
	 */
	this._integral = new Float32Array( 10 );

	this.process( vertices );

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

Goblin.ConvexShape.prototype.process = function( vertices ) {
	// Find two points furthest apart on X axis
	var candidates = vertices.slice(),
		min_point = null,
		max_point = null;

	for ( var i = 0; i < candidates.length; i++ ) {
		var vertex = candidates[i];

		if ( min_point == null || min_point.x > vertex.x ) {
			min_point = vertex;
		}
		if ( max_point == null || max_point.x > vertex.x ) {
			max_point = vertex;
		}
	}
	if ( min_point === max_point ) {
		max_point = vertices[0] === min_point ? vertices[1] : vertices[0];
	}

	// Initial 1-simplex
	var point_a = min_point,
		point_b = max_point;
	candidates.splice( candidates.indexOf( point_a ), 1 );
	candidates.splice( candidates.indexOf( point_b ), 1 );

	// Find the point most distant from the line to construct the 2-simplex
	var distance = -Infinity,
		furthest_idx = null,
		candidate, candidate_distance;

	for ( i = 0; i < candidates.length; i++ ) {
		candidate = candidates[i];
		candidate_distance = Goblin.GeometryMethods.findSquaredDistanceFromSegment( candidate, point_a, point_b );
		if ( candidate_distance > distance ) {
			distance = candidate_distance;
			furthest_idx = i;
		}
	}
	var point_c = candidates[furthest_idx];
	candidates.splice( furthest_idx, 1 );

	// Fourth point of the 3-simplex is the one furthest away from the 2-simplex
	_tmp_vec3_1.subtractVectors( point_b, point_a );
	_tmp_vec3_2.subtractVectors( point_c, point_a );
	_tmp_vec3_1.cross( _tmp_vec3_2 ); // _tmp_vec3_1 is the normal of the 2-simplex

	distance = -Infinity;
	furthest_idx = null;

	for ( i = 0; i < candidates.length; i++ ) {
		candidate = candidates[i];
		candidate_distance = Math.abs( _tmp_vec3_1.dot( candidate ) );
		if ( candidate_distance > distance ) {
			distance = candidate_distance;
			furthest_idx = i;
		}
	}
	var point_d = candidates[furthest_idx];
	candidates.splice( furthest_idx, 1 );

	// If `point_d` is on the front side of `abc` then flip to `cba`
	if ( _tmp_vec3_1.dot( point_d ) > 0 ) {
		var tmp_point = point_a;
		point_a = point_c;
		point_c = tmp_point;
	}

	// We have our starting tetrahedron, rejoice
	// Now turn that into a polyhedron
	var polyhedron = new Goblin.GjkEpa2.Polyhedron({ points:[
		{ point: point_c }, { point: point_b }, { point: point_a }, { point: point_d }
	]});

	// Add the rest of the points
	for ( i = 0; i < candidates.length; i++ ) {
		// We are going to lie and tell the polyhedron that its closest face is any of the faces which can see the candidate
		polyhedron.closest_face = null;
		for ( var j = 0; j < polyhedron.faces.length; j++ ) {
			if ( polyhedron.faces[j].active === true && polyhedron.faces[j].classifyVertex( { point: candidates[i] } ) > 0 ) {
				polyhedron.closest_face = j;
				break;
			}
		}
		if ( polyhedron.closest_face == null ) {
			// This vertex is already contained by the existing hull, ignore
			continue;
		}
		polyhedron.addVertex( { point: candidates[i] } );
	}

	this.faces = polyhedron.faces.filter(function( face ){
		return face.active;
	});

	// find all the vertices & edges which make up the convex hull
	var convexshape = this;
	
	this.faces.forEach(function( face ){
		// If we haven't already seen these vertices then include them
		var a = face.a.point,
			b = face.b.point,
			c = face.c.point,
			ai = convexshape.vertices.indexOf( a ),
			bi = convexshape.vertices.indexOf( b ),
			ci = convexshape.vertices.indexOf( c );

		// Include vertices if they are new
		if ( ai === -1 ) {
			convexshape.vertices.push( a );
		}
		if ( bi === -1 ) {
			convexshape.vertices.push( b );
		}
		if ( ci === -1 ) {
			convexshape.vertices.push( c );
		}
	});

	this.computeVolume();
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.ConvexShape.prototype.calculateLocalAABB = function( aabb ) {
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

Goblin.ConvexShape.prototype.computeVolume = (function(){
	var output = new Float32Array( 6 ),
		macro = function( a, b, c ) {
			var temp0 = a + b,
				temp1 = a * a,
				temp2 = temp1 + b * temp0;

			output[0] = temp0 + c;
			output[1] = temp2 + c * output[0];
			output[2] = a * temp1 + b * temp2 + c * output[1];
			output[3] = output[1] + a * ( output[0] + a );
			output[4] = output[1] + b * ( output[0] + b );
			output[5] = output[1] + c * ( output[0] + c );
		};

	return function() {
		for ( var i = 0; i < this.faces.length; i++ ) {
			var face = this.faces[i],
				v0 = face.a.point,
				v1 = face.b.point,
				v2 = face.c.point;

			var a1 = v1.x - v0.x,
				b1 = v1.y - v0.y,
				c1 = v1.z - v0.z,
				a2 = v2.x - v0.x,
				b2 = v2.y - v0.y,
				c2 = v2.z - v0.z,
				d0 = b1 * c2 - b2 * c1,
				d1 = a2 * c1 - a1 * c2,
				d2 = a1 * b2 - a2 * b1;

			macro( v0.x, v1.x, v2.x );
			var f1x = output[0],
				f2x = output[1],
				f3x = output[2],
				g0x = output[3],
				g1x = output[4],
				g2x = output[5];

			macro( v0.y, v1.y, v2.y );
			var f1y = output[0],
				f2y = output[1],
				f3y = output[2],
				g0y = output[3],
				g1y = output[4],
				g2y = output[5];

			macro( v0.z, v1.z, v2.z );
			var f1z = output[0],
				f2z = output[1],
				f3z = output[2],
				g0z = output[3],
				g1z = output[4],
				g2z = output[5];

			this._integral[0] += d0 * f1x;
			this._integral[1] += d0 * f2x;
			this._integral[2] += d1 * f2y;
			this._integral[3] += d2 * f2z;
			this._integral[4] += d0 * f3x;
			this._integral[5] += d1 * f3y;
			this._integral[6] += d2 * f3z;
			this._integral[7] += d0 * ( v0.y * g0x + v1.y * g1x + v2.y * g2x );
			this._integral[8] += d1 * ( v0.z * g0y + v1.z * g1y + v2.z * g2y );
			this._integral[9] += d2 * ( v0.x * g0z + v1.x * g1z + v2.x * g2z );
		}

		this._integral[0] *= 1 / 6;
		this._integral[1] *= 1 / 24;
		this._integral[2] *= 1 / 24;
		this._integral[3] *= 1 / 24;
		this._integral[4] *= 1 / 60;
		this._integral[5] *= 1 / 60;
		this._integral[6] *= 1 / 60;
		this._integral[7] *= 1 / 120;
		this._integral[8] *= 1 / 120;
		this._integral[9] *= 1 / 120;

		this.volume = this._integral[0];

		this.center_of_mass.x = this._integral[1] / this.volume;
		this.center_of_mass.y = this._integral[2] / this.volume;
		this.center_of_mass.z = this._integral[3] / this.volume;
	};
})();

Goblin.ConvexShape.prototype.getInertiaTensor = (function(){
	return function( mass ) {
		var	inertia_tensor = new Goblin.Matrix3();

		inertia_tensor.e00 = ( this._integral[5] + this._integral[6] ) * mass;
		inertia_tensor.e11 = ( this._integral[4] + this._integral[6] ) * mass;
		inertia_tensor.e22 = ( this._integral[4] + this._integral[5] ) * mass;
		inertia_tensor.e10 = inertia_tensor.e01 = -this._integral[7] * mass; //xy
		inertia_tensor.e21 = inertia_tensor.e12 = -this._integral[8] * mass; //yz
		inertia_tensor.e20 = inertia_tensor.e02 = -this._integral[9] * mass; //xz

		inertia_tensor.e00 -= mass * ( this.center_of_mass.y * this.center_of_mass.y + this.center_of_mass.z * this.center_of_mass.z );
		inertia_tensor.e11 -= mass * ( this.center_of_mass.x * this.center_of_mass.x + this.center_of_mass.z * this.center_of_mass.z );
		inertia_tensor.e22 -= mass * ( this.center_of_mass.x * this.center_of_mass.x + this.center_of_mass.y * this.center_of_mass.y );

		inertia_tensor.e10 += mass * this.center_of_mass.x * this.center_of_mass.y;
		inertia_tensor.e01 += mass * this.center_of_mass.x * this.center_of_mass.y;

		inertia_tensor.e21 += mass * this.center_of_mass.y * this.center_of_mass.z;
		inertia_tensor.e12 += mass * this.center_of_mass.y * this.center_of_mass.z;

		inertia_tensor.e20 += mass * this.center_of_mass.x * this.center_of_mass.z;
		inertia_tensor.e02 += mass * this.center_of_mass.x * this.center_of_mass.z;

		return inertia_tensor;
	};
})();

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.ConvexShape.prototype.findSupportPoint = function( direction, support_point ) {
	var best,
		best_dot = -Infinity,
		dot;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		dot = this.vertices[i].dot( direction );
		if ( dot > best_dot ) {
			best_dot = dot;
			best = i;
		}
	}

	support_point.copy( this.vertices[best] );
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.ConvexShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		ab = new Goblin.Vector3(),
		ac = new Goblin.Vector3(),
		q = new Goblin.Vector3(),
		s = new Goblin.Vector3(),
		r = new Goblin.Vector3(),
		b = new Goblin.Vector3(),
		u = new Goblin.Vector3(),
		tmin, tmax;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		for ( var i = 0; i < this.faces.length; i++  ) {
			var face = this.faces[i];

			ab.subtractVectors( face.b.point, face.a.point );
			ac.subtractVectors( face.c.point, face.a.point );
			q.crossVectors( direction, ac );
			var a = ab.dot( q );

			if ( a < Goblin.EPSILON ) {
				// Ray does not point at face
				continue;
			}

			var f = 1 / a;
			s.subtractVectors( start, face.a.point );

			var u = f * s.dot( q );
			if ( u < 0 ) {
				// Ray does not intersect face
				continue;
			}

			r.crossVectors( s, ab );
			var v = f * direction.dot( r );
			if ( v < 0 || u + v > 1 ) {
				// Ray does not intersect face
				continue;
			}

			var t = f * ac.dot( r );
			if ( t < tmin || t > tmax ) {
				// ray segment does not intersect face
				continue;
			}

			// Segment intersects the face, find from `t`
			var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
			intersection.object = this;
			intersection.t = t;
			intersection.point.scaleVector( direction, t );
			intersection.point.add( start );
			intersection.normal.copy( face.normal );

			// A convex object can have only one intersection with a line, we're done
			return intersection;
		}

		// No intersection found
		return null;
	};
})();