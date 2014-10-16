Goblin.Quaternion = function( x, y, z, w ) {
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.z = z != null ? z : 0;
	this.w = w != null ? w : 1;
	this.normalize();
};

Goblin.Quaternion.prototype = {
	set: function( x, y, z, w ) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	},

	multiply: function( q ) {
		var x = this.x, y = this.y, z = this.z, w = this.w,
			qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		this.x = x * qw + w * qx + y * qz - z * qy;
		this.y = y * qw + w * qy + z * qx - x * qz;
		this.z = z * qw + w * qz + x * qy - y * qx;
		this.w = w * qw - x * qx - y * qy - z * qz;
	},

	multiplyQuaternions: function( a, b ) {
		this.x = a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y;
		this.y = a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z;
		this.z = a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x;
		this.w = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
	},

	normalize: function() {
		var x = this.x, y = this.y, z = this.z, w = this.w,
			length = Math.sqrt( x * x + y * y + z * z + w * w );

		if ( length === 0) {
			this.x = this.y = this.z = this.w = 0;
		} else {
			length = 1 / length;
			this.x *= length;
			this.y *= length;
			this.z *= length;
			this.w *= length;
		}
	},

	invertQuaternion: function( q ) {
		var x = q.x, y = q.y, z = q.z, w = q.w,
			dot = x * x + y * y + z * z + w * w;

		if ( dot === 0 ) {
			this.x = this.y = this.z = this.w = 0;
		} else {
			var inv_dot = -1 / dot;
			this.x = q.x * inv_dot;
			this.y = q.y *  inv_dot;
			this.z = q.z *  inv_dot;
			this.w = q.w *  -inv_dot;
		}
	},

	transformVector3: function( v ) {
		var x = v.x, y = v.y, z = v.z,
			qx = this.x, qy = this.y, qz = this.z, qw = this.w,

		// calculate quat * vec
			ix = qw * x + qy * z - qz * y,
			iy = qw * y + qz * x - qx * z,
			iz = qw * z + qx * y - qy * x,
			iw = -qx * x - qy * y - qz * z;

		// calculate result * inverse quat
		v.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		v.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		v.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	},

	transformVector3Into: function( v, dest ) {
		var x = v.x, y = v.y, z = v.z,
			qx = this.x, qy = this.y, qz = this.z, qw = this.w,

		// calculate quat * vec
			ix = qw * x + qy * z - qz * y,
			iy = qw * y + qz * x - qx * z,
			iz = qw * z + qx * y - qy * x,
			iw = -qx * x - qy * y - qz * z;

		// calculate result * inverse quat
		dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	}
};