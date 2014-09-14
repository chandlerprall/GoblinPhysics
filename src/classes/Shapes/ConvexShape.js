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
	this.center_of_mass = vec3.create();

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

		if ( min_point == null || min_point[0] > vertex[0] ) {
			min_point = vertex;
		}
		if ( max_point == null || max_point[0] > vertex[0] ) {
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
	vec3.subtract( point_b, point_a, _tmp_vec3_1 );
	vec3.subtract( point_c, point_a, _tmp_vec3_2 );
	vec3.cross( _tmp_vec3_1, _tmp_vec3_2 ); // _tmp_vec3_1 is the normal of the 2-simplex

	distance = -Infinity;
	furthest_idx = null;

	for ( i = 0; i < candidates.length; i++ ) {
		candidate = candidates[i];
		candidate_distance = Math.abs( vec3.dot( _tmp_vec3_1, candidate ) );
		if ( candidate_distance > distance ) {
			distance = candidate_distance;
			furthest_idx = i;
		}
	}
	var point_d = candidates[furthest_idx];
	candidates.splice( furthest_idx, 1 );

	// If `point_d` is on the front side of `abc` then flip to `cba`
	if ( vec3.dot( _tmp_vec3_1, point_d ) > 0 ) {
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
	aabb.min[0] = aabb.min[1] = aabb.min[2] = 0;
	aabb.max[0] = aabb.max[1] = aabb.max[2] = 0;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		aabb.min[0] = Math.min( aabb.min[0], this.vertices[i][0] );
		aabb.min[1] = Math.min( aabb.min[1], this.vertices[i][1] );
		aabb.min[2] = Math.min( aabb.min[2], this.vertices[i][2] );

		aabb.max[0] = Math.max( aabb.max[0], this.vertices[i][0] );
		aabb.max[1] = Math.max( aabb.max[1], this.vertices[i][1] );
		aabb.max[2] = Math.max( aabb.max[2], this.vertices[i][2] );
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

			var a1 = v1[0] - v0[0],
				b1 = v1[1] - v0[1],
				c1 = v1[2] - v0[2],
				a2 = v2[0] - v0[0],
				b2 = v2[1] - v0[1],
				c2 = v2[2] - v0[2],
				d0 = b1 * c2 - b2 * c1,
				d1 = a2 * c1 - a1 * c2,
				d2 = a1 * b2 - a2 * b1;

			macro( v0[0], v1[0], v2[0] );
			var f1x = output[0],
				f2x = output[1],
				f3x = output[2],
				g0x = output[3],
				g1x = output[4],
				g2x = output[5];

			macro( v0[1], v1[1], v2[1] );
			var f1y = output[0],
				f2y = output[1],
				f3y = output[2],
				g0y = output[3],
				g1y = output[4],
				g2y = output[5];

			macro( v0[2], v1[2], v2[2] );
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
			this._integral[7] += d0 * ( v0[1] * g0x + v1[1] * g1x + v2[1] * g2x );
			this._integral[8] += d1 * ( v0[2] * g0y + v1[2] * g1y + v2[2] * g2y );
			this._integral[9] += d2 * ( v0[0] * g0z + v1[0] * g1z + v2[0] * g2z );
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

		this.center_of_mass[0] = this._integral[1] / this.volume;
		this.center_of_mass[1] = this._integral[2] / this.volume;
		this.center_of_mass[2] = this._integral[3] / this.volume;
	};
})();

Goblin.ConvexShape.prototype.getInertiaTensor = (function(){
	return function( mass ) {
		var	inertia_tensor = mat3.create();

		inertia_tensor[0] = ( this._integral[5] + this._integral[6] ) * mass;
		inertia_tensor[4] = ( this._integral[4] + this._integral[6] ) * mass;
		inertia_tensor[8] = ( this._integral[4] + this._integral[5] ) * mass;
		inertia_tensor[1] = inertia_tensor[3] = -this._integral[7] * mass; //xy
		inertia_tensor[5] = inertia_tensor[7] = -this._integral[8] * mass; //yz
		inertia_tensor[2] = inertia_tensor[6] = -this._integral[9] * mass; //xz

		inertia_tensor[0] -= mass * ( this.center_of_mass[1] * this.center_of_mass[1] + this.center_of_mass[2] * this.center_of_mass[2] );
		inertia_tensor[4] -= mass * ( this.center_of_mass[0] * this.center_of_mass[0] + this.center_of_mass[2] * this.center_of_mass[2] );
		inertia_tensor[8] -= mass * ( this.center_of_mass[0] * this.center_of_mass[0] + this.center_of_mass[1] * this.center_of_mass[1] );

		inertia_tensor[1] += mass * this.center_of_mass[0] * this.center_of_mass[1];
		inertia_tensor[3] += mass * this.center_of_mass[0] * this.center_of_mass[1];

		inertia_tensor[5] += mass * this.center_of_mass[1] * this.center_of_mass[2];
		inertia_tensor[7] += mass * this.center_of_mass[1] * this.center_of_mass[2];

		inertia_tensor[2] += mass * this.center_of_mass[0] * this.center_of_mass[2];
		inertia_tensor[6] += mass * this.center_of_mass[0] * this.center_of_mass[2];

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
		dot = vec3.dot( this.vertices[i], direction );
		if ( dot > best_dot ) {
			best_dot = dot;
			best = i;
		}
	}

	vec3.set( this.vertices[best], support_point );
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
	var direction = vec3.create(),
		ab = vec3.create(),
		ac = vec3.create(),
		q = vec3.create(),
		s = vec3.create(),
		r = vec3.create(),
		b = vec3.create(),
		u = vec3.create(),
		tmin, tmax;

	return function( start, end ) {
		tmin = 0;

		vec3.subtract( end, start, direction );
		tmax = vec3.length( direction );
		vec3.scale( direction, 1 / tmax ); // normalize direction

		for ( var i = 0; i < this.faces.length; i++ ) {
			var face = this.faces[i];

			vec3.subtract( face.b.point, face.a.point, ab );
			vec3.subtract( face.c.point, face.a.point, ac );
			vec3.cross( direction, ac, q );
			var a = vec3.dot( ab, q );

			if ( a < Goblin.EPSILON ) {
				// Ray does not point at face
				continue;
			}

			var f = 1 / a;
			vec3.subtract( start, face.a.point, s );

			var u = f * vec3.dot( s, q );
			if ( u < 0 ) {
				// Ray does not intersect face
				continue;
			}

			vec3.cross( s, ab, r );
			var v = f * vec3.dot( direction, r );
			if ( v < 0 || u + v > 1 ) {
				// Ray does not intersect face
				continue;
			}

			var t = f * vec3.dot( ac, r );
			if ( t < tmin || t > tmax ) {
				// ray segment does not intersect face
				continue;
			}

			// Segment intersects the face, find from `t`
			var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
			intersection.object = this;
			intersection.t = t;
			vec3.scale( direction, t, intersection.point );
			vec3.add( intersection.point, start );
			vec3.set( face.normal, intersection.normal );

			// A convex object can have only one intersection with a line, we're done
			return intersection;
		}

		// No intersection found
		return null;
	};
})();