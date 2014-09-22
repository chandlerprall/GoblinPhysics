/**
 * @class ConeShape
 * @param radius {Number} radius of the cylinder
 * @param half_height {Number} half height of the cylinder
 * @constructor
 */
Goblin.ConeShape = function( radius, half_height ) {
	/**
	 * radius of the cylinder
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the cylinder
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );

    /**
     * sin of the cone's angle
     *
     * @property _sinagle
     * @type {Number}
     * @private
     */
	this._sinangle = this.radius / Math.sqrt( this.radius * this.radius + Math.pow( 2 * this.half_height, 2 ) );

    /**
     * cos of the cone's angle
     *
     * @property _cosangle
     * @type {Number}
     * @private
     */
    this._cosangle = Math.cos( Math.asin( this._sinangle ) );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.ConeShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = aabb.min.z = -this.radius;
    aabb.min.y = -this.half_height;

    aabb.max.x = aabb.max.z = this.radius;
    aabb.max.y = this.half_height;
};

Goblin.ConeShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.1 * mass * Math.pow( this.half_height * 2, 2 ) + 0.15 * mass * this.radius * this.radius;

	return new Goblin.Matrix3(
		element, 0, 0,
		0, 0.3 * mass * this.radius * this.radius, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.ConeShape.prototype.findSupportPoint = function( direction, support_point ) {
	// Calculate the support point in the local frame
	//var w = direction - ( direction.y )
	var sigma = Math.sqrt( direction.x * direction.x + direction.z * direction.z );

	if ( direction.y > direction.length() * this._sinangle ) {
		support_point.x = support_point.z = 0;
		support_point.y = this.half_height;
	} else if ( sigma > 0 ) {
		var r_s = this.radius / sigma;
		support_point.x = r_s * direction.x;
		support_point.y = -this.half_height;
		support_point.z = r_s * direction.z;
	} else {
		support_point.x = support_point.z = 0;
		support_point.y = -this.half_height;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.ConeShape.prototype.rayIntersect = (function(){
    var direction = new Goblin.Vector3(),
        length,
        p1 = new Goblin.Vector3(),
        p2 = new Goblin.Vector3(),
		normal1 = new Goblin.Vector3(),
		normal2 = new Goblin.Vector3();

    return function( start, end ) {
        direction.subtractVectors( end, start );
        length = direction.length();
        direction.scale( 1 / length  ); // normalize direction

        var t1, t2;

        // Check for intersection with cone base
		p1.x = p1.y = p1.z = 0;
        t1 = this._rayIntersectBase( start, end, p1, normal1 );

        // Check for intersection with cone shape
		p2.x = p2.y = p2.z = 0;
        t2 = this._rayIntersectCone( start, direction, length, p2, normal2 );

        var intersection;

        if ( !t1 && !t2 ) {
            return null;
        } else if ( !t2 || ( t1 &&  t1 < t2 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t1;
            intersection.point.copy( p1 );
			intersection.normal.copy( normal1 );
            return intersection;
        } else if ( !t1 || ( t2 && t2 < t1 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t2;
            intersection.point.copy( p2 );
			intersection.normal.copy( normal2 );
            return intersection;
        }

        return null;
    };
})();

Goblin.ConeShape.prototype._rayIntersectBase = (function(){
    var _normal = new Goblin.Vector3( 0, -1, 0 ),
        ab = new Goblin.Vector3(),
        _start = new Goblin.Vector3(),
        _end = new Goblin.Vector3(),
        t;

    return function( start, end, point, normal ) {
        _start.x = start.x;
        _start.y = start.y + this.half_height;
        _start.z = start.z;

        _end.x = end.x;
        _end.y = end.y + this.half_height;
        _end.z = end.z;

        ab.subtractVectors( _end, _start );
        t = -_normal.dot( _start ) / _normal.dot( ab );

        if ( t < 0 || t > 1 ) {
            return null;
        }

        point.scaleVector( ab, t );
        point.add( start );

        if ( point.x * point.x + point.z * point.z > this.radius * this.radius ) {
            return null;
        }

		normal.x = normal.z = 0;
		normal.y = -1;

        return t * ab.length();
    };
})();

/**
 * Checks if a ray segment intersects with the cone definition
 *
 * @method _rayIntersectCone
 * @property start {vec3} start point of the segment
 * @property direction {vec3} normalized direction vector of the segment, from `start`
 * @property length {Number} segment length
 * @property point {vec3} (out) location of intersection
 * @private
 * @return {vec3|null} if the segment intersects, point where the segment intersects the cone, else `null`
 */
Goblin.ConeShape.prototype._rayIntersectCone = (function(){
    var _point = new Goblin.Vector3();

    return function( start, direction, length, point, normal ) {
        var A = new Goblin.Vector3( 0, -1, 0 );

        var AdD = A.dot( direction ),
            cosSqr = this._cosangle * this._cosangle;

        var E = new Goblin.Vector3();
        E.x = start.x;
        E.y = start.y - this.half_height;
        E.z = start.z;

        var AdE = A.dot( E ),
            DdE = direction.dot( E ),
            EdE = E.dot( E ),
            c2 = AdD * AdD - cosSqr,
            c1 = AdD * AdE - cosSqr * DdE,
            c0 = AdE * AdE - cosSqr * EdE,
            dot, t, tmin = null;

        if ( Math.abs( c2 ) >= Goblin.EPSILON ) {
            var discr = c1 * c1 - c0 * c2;
			if ( discr < -Goblin.EPSILON ) {
                return null;
            } else if ( discr > Goblin.EPSILON ) {
                var root = Math.sqrt( discr ),
                    invC2 = 1 / c2;

                t = ( -c1 - root ) * invC2;
                if ( t >= 0 && t <= length ) {
                    _point.scaleVector( direction, t );
                    _point.add( start );
                    E.y = _point.y - this.half_height;
                    dot = E.dot( A );
                    if ( dot >= 0 ) {
                        tmin = t;
                        point.copy( _point );
                    }
                }

                t = ( -c1 + root ) * invC2;
                if ( t >= 0 && t <= length ) {
                    if ( tmin == null || t < tmin ) {
                        _point.scaleVector( direction, t );
                        _point.add( start );
                        E.y = _point.y - this.half_height;
                        dot = E.dot( A );
                        if ( dot >= 0 ) {
                            tmin = t;
                            point.copy( _point );
                        }
                    }
                }

                if ( tmin == null ) {
                    return null;
                }
                tmin /= length;
            } else {
                t = -c1 / c2;
                _point.scaleVector( direction, t );
                _point.add( start );
                E.y = _point.y - this.half_height;
                dot = E.dot( A );
                if ( dot < 0 ) {
                    return null;
                }

                // Verify segment reaches _point
                _tmp_vec3_1.subtractVectors( _point, start );
                if ( _tmp_vec3_1.lengthSquared() > length * length ) {
                    return null;
                }

                tmin = t / length;
                point.copy( _point );
            }
        } else if ( Math.abs( c1 ) >= Goblin.EPSILON ) {
            t = 0.5 * c0 / c1;
            _point.scaleVector( direction, t );
            _point.add( start );
            E.y = _point.y - this.half_height;
            dot = E.dot( A );
            if ( dot < 0 ) {
                return null;
            }
            tmin = t;
            point.copy( _point );
        } else {
            return null;
        }

        if ( point.y < -this.half_height ) {
            return null;
        }

		// Compute normal
		normal.x = point.x;
		normal.y = 0;
		normal.z = point.z;
		normal.normalize();

		normal.x *= ( this.half_height * 2 ) / this.radius;
		normal.y = this.radius / ( this.half_height * 2 );
		normal.z *= ( this.half_height * 2 ) / this.radius;
		normal.normalize();

        return tmin * length;
    };
})();