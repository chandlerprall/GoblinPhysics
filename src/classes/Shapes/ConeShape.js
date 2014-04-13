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
    aabb.min[0] = aabb.min[2] = -this.radius;
    aabb.min[1] = -this.half_height;

    aabb.max[0] = aabb.max[2] = this.radius;
    aabb.max[1] = this.half_height;
};

Goblin.ConeShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.1 * mass * Math.pow( this.half_height * 2, 2 ) + 0.15 * mass * this.radius * this.radius;

	return mat3.createFrom(
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
	/*
	 support_point = [

	 ]
	 */

	// Calculate the support point in the local frame
	//var w = direction - ( direction[1] )
	var sigma = Math.sqrt( direction[0] * direction[0] + direction[2] * direction[2] );

	if ( direction[1] > vec3.length( direction ) * this._sinangle ) {
		support_point[0] = support_point[2] = 0;
		support_point[1] = this.half_height;
	} else if ( sigma > 0 ) {
		var r_s = this.radius / sigma;
		support_point[0] = r_s * direction[0];
		support_point[1] = -this.half_height;
		support_point[2] = r_s * direction[2];
	} else {
		support_point[0] = support_point[2] = 0;
		support_point[1] = -this.half_height;
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
    var direction = vec3.create(),
        length,
        p1 = vec3.create(),
        p2 = vec3.create();

    return function( start, end ) {
        vec3.subtract( end, start, direction );
        length = vec3.length( direction );
        vec3.scale( direction, 1 / length ); // normalize direction

        var t1, t2;

        // Check for intersection with cone base
		p1[0] = p1[1] = p1[2] = 0;
        t1 = this._rayIntersectBase( start, end, p1 );

        // Check for intersection with cone shape
		p2[0] = p2[1] = p2[2] = 0;
        t2 = this._rayIntersectCone( start, direction, length, p2 );

        var intersection;

        if ( !t1 && !t2 ) {
            return null;
        } else if ( !t2 || ( t1 &&  t1 < t2 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t1;
            vec3.set( p1, intersection.point );
            return intersection;
        } else if ( !t1 || ( t2 && t2 < t1 ) ) {
            intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
            intersection.object = this;
			intersection.t = t2;
            vec3.set( p2, intersection.point );
            return intersection;
        }

        return null;
    };
})();

Goblin.ConeShape.prototype._rayIntersectBase = (function(){
    var normal = vec3.createFrom( 0, -1, 0 ),
        ab = vec3.create(),
        _start = vec3.create(),
        _end = vec3.create(),
        t;

    return function( start, end, point ) {
        _start[0] = start[0];
        _start[1] = start[1] + this.half_height;
        _start[2] = start[2];

        _end[0] = end[0];
        _end[1] = end[1] + this.half_height;
        _end[2] = end[2];

        vec3.subtract( _end, _start, ab );
        t = -vec3.dot( normal, _start ) / vec3.dot( normal, ab );

        if ( t < 0 || t > 1 ) {
            return null;
        }

        vec3.scale( ab, t, point );
        vec3.add( point, start );

        if ( point[0] * point[0] + point[2] * point[2] > this.radius * this.radius ) {
            return null;
        }

        return t;
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
    var _point = vec3.create();

    return function( start, direction, length, point ) {
        var A = vec3.createFrom( 0, -1, 0 );

        var AdD = vec3.dot( A, direction ),
            cosSqr = this._cosangle * this._cosangle;

        var E = vec3.create();
        E[0] = start[0];
        E[1] = start[1] - this.half_height;
        E[2] = start[2];

        var AdE = vec3.dot( A, E ),
            DdE = vec3.dot( direction, E ),
            EdE = vec3.dot( E, E ),
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
                    vec3.scale( direction, t, _point );
                    vec3.add( _point, start );
                    E[1] = _point[1] - this.half_height;
                    dot = vec3.dot( E, A );
                    if ( dot >= 0 ) {
                        tmin = t;
                        vec3.set( _point, point );
                    }
                }

                t = ( -c1 + root ) * invC2;
                if ( t >= 0 && t <= length ) {
                    if ( tmin == null || t < tmin ) {
                        vec3.scale( direction, t, _point );
                        vec3.add( _point, start );
                        E[1] = _point[1] - this.half_height;
                        dot = vec3.dot( E, A );
                        if ( dot >= 0 ) {
                            tmin = t;
                            vec3.set( _point, point );
                        }
                    }
                }

                if ( tmin == null ) {
                    return null;
                }
                tmin /= length;
            } else {
                t = -c1 / c2;
                vec3.scale( direction, t, _point );
                vec3.add( _point, start );
                E[1] = _point[1] - this.half_height;
                dot = vec3.dot( E, A );
                if ( dot < 0 ) {
                    return null;
                }

                // Verify segment reaches _point
                vec3.subtract( _point, start, _tmp_vec3_1 );
                if ( vec3.squaredLength( _tmp_vec3_1 ) > length * length ) {
                    return null;
                }

                tmin = t / length;
                vec3.set( _point, point );
            }
        } else if ( Math.abs( c1 ) >= Goblin.EPSILON ) {
            t = 0.5 * c0 / c1;
            vec3.scale( direction, t, _point );
            vec3.add( _point, start );
            E[1] = _point[1] - this.half_height;
            dot = vec3.dot( E, A );
            if ( dot < 0 ) {
                return null;
            }
            tmin = t;
            vec3.set( _point, point );
        } else {
            return null;
        }

        if ( point[1] < -this.half_height ) {
            return null;
        }

        return tmin;
    };
})();