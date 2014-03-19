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

	/**
	 * sin of the cone's angle
	 *
	 * @property _sinagle
	 * @type {Number}
	 * @private
	 */
	this._sinangle = this.radius / Math.sqrt( this.radius * this.radius + Math.pow( 2 * this.half_height, 2 ) );
};

Goblin.ConeShape.prototype.getBoundingRadius = function() {
	return Math.max( this.radius, this.half_height );
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