/**
 * Extensions to gl-matrix quat4
 */
(function() {
	var _quat = quat4.create(),
		_vec = vec3.create();

	/**
	 * @method rotateByVector
	 * @param quat {quat4} quat4 to rotate
	 * @param vec {vec3} vec3 to rotate quat4 by
	 * @param [dest] {quat4} quat4 receiving the rotated values. If not specified result is written to quat.
	 */
	quat4.rotateByVector = function( quat, vec, dest ) {
		if (!dest) { dest = quat; }

		_quat[0] = vec[0];
		_quat[1] = vec[1];
		_quat[2] = vec[2];
		_quat[3] = 0;

		quat4.multiply( _quat, quat );

		return dest;
	};

	/**
	 * @method addScaledVector
	 * @param quat {quat4} quat4 to add rotation to
	 * @param vec {vec3} vec3 to rotate quat4 by
	 * @param scale {Number} amount to scale `vec` by
	 * @param [dest] {quat4} quat4 receiving the rotated values. If not specified result is written to quat.
	 */
	quat4.addScaledVector = function( quat, vec, scale, dest ) {
		if (!dest) { dest = quat; }

		var c1 = Math.cos( vec[0] * scale / 2 ),
			c2 = Math.cos( vec[1] * scale / 2 ),
			c3 = Math.cos( vec[2] * scale / 2 ),
			s1 = Math.sin( vec[0] * scale / 2 ),
			s2 = Math.sin( vec[1] * scale / 2 ),
			s3 = Math.sin( vec[2] * scale / 2 );

		_quat[0] = s1 * c2 * c3 + c1 * s2 * s3;
		_quat[1] = c1 * s2 * c3 - s1 * c2 * s3;
		_quat[2] = c1 * c2 * s3 + s1 * s2 * c3;
		_quat[3] = c1 * c2 * c3 - s1 * s2 * s3;

		quat4.multiply( quat, _quat );

		/*vec3.scale( vec, scale, _vec );
		vec3.scale( _vec, 0.5 );

		var thetaMagSq = vec3.squaredLength( _vec ),
			thetaMag,
			s;

		if ( thetaMagSq * thetaMagSq / 24 < Goblin.EPSILON ) {
			_quat[3] = 1 - thetaMagSq / 2;
			s = 1 - thetaMagSq / 6;
		} else {
			thetaMag = Math.sqrt( thetaMagSq );
			_quat[3] = Math.cos( thetaMag );
			s = Math.sin( thetaMag ) / thetaMag;
		}

		_quat[0] = _vec[0] * s;
		_quat[1] = _vec[1] * s;
		_quat[2] = _vec[2] * s;

		quat4.multiply( _quat, quat, dest );*/

		return dest;
	}
})();

/**
* Goblin physics module
*
* @module Goblin
*/
window.Goblin = (function() {
	'use strict';

	var Goblin = {},
		_tmp_vec3_1 = vec3.create(),
		_tmp_vec3_2 = vec3.create(),
		_tmp_vec3_3 = vec3.create(),

		_tmp_quat4_1 = quat4.create(),

		_tmp_mat3_1 = mat3.create(),
		_tmp_mat3_2 = mat3.create();

    Goblin.EPSILON = 0.000001;