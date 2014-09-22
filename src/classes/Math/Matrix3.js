Goblin.Matrix3 = function( e00, e01, e02, e10, e11, e12, e20, e21, e22 ) {
	this.e00 = e00 || 0;
	this.e01 = e01 || 0;
	this.e02 = e02 || 0;

	this.e10 = e10 || 0;
	this.e11 = e11 || 0;
	this.e12 = e12 || 0;

	this.e20 = e20 || 0;
	this.e21 = e21 || 0;
	this.e22 = e22 || 0;
};

Goblin.Matrix3.prototype = {
	identity: function() {
		this.e00 = 1;
		this.e01 = 0;
		this.e02 = 0;

		this.e10 = 0;
		this.e11 = 1;
		this.e12 = 0;

		this.e20 = 0;
		this.e21 = 0;
		this.e22 = 1;
	},

	fromMatrix4: function( m ) {
		this.e00 = m.e00;
		this.e01 = m.e01;
		this.e02 = m.e02;

		this.e10 = m.e10;
		this.e11 = m.e11;
		this.e12 = m.e12;

		this.e20 = m.e20;
		this.e21 = m.e21;
		this.e22 = m.e22;
	},

	fromQuaternion: function( q ) {
		var x2 = q.x + q.x,
			y2 = q.y + q.y,
			z2 = q.z + q.z,

			xx = q.x * x2,
			xy = q.x * y2,
			xz = q.x * z2,
			yy = q.y * y2,
			yz = q.y * z2,
			zz = q.z * z2,
			wx = q.w * x2,
			wy = q.w * y2,
			wz = q.w * z2;

		this.e00 = 1 - (yy + zz);
		this.e10 = xy + wz;
		this.e20 = xz - wy;

		this.e01 = xy - wz;
		this.e11 = 1 - (xx + zz);
		this.e21 = yz + wx;

		this.e02 = xz + wy;
		this.e12 = yz - wx;
		this.e22 = 1 - (xx + yy);
	},

	transformVector3: function( v ) {
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z;
	},

	transformVector3Into: function( v, dest ) {
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z;
	},

	transposeInto: function( m ) {
		m.e00 = this.e00;
		m.e10 = this.e01;
		m.e20 = this.e02;
		m.e01 = this.e10;
		m.e11 = this.e11;
		m.e21 = this.e12;
		m.e02 = this.e20;
		m.e12 = this.e21;
		m.e22 = this.e22;
	},

	invert: function() {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b01 = a22 * a11 - a12 * a21,
			b11 = -a22 * a10 + a12 * a20,
			b21 = a21 * a10 - a11 * a20,

			d = a00 * b01 + a01 * b11 + a02 * b21,
			id;

		if ( !d ) {
			return true;
		}
		id = 1 / d;

		this.e00 = b01 * id;
		this.e01 = (-a22 * a01 + a02 * a21) * id;
		this.e02 = (a12 * a01 - a02 * a11) * id;
		this.e10 = b11 * id;
		this.e11 = (a22 * a00 - a02 * a20) * id;
		this.e12 = (-a12 * a00 + a02 * a10) * id;
		this.e20 = b21 * id;
		this.e21 = (-a21 * a00 + a01 * a20) * id;
		this.e22 = (a11 * a00 - a01 * a10) * id;

		return true;
	},

	invertInto: function( m ) {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b01 = a22 * a11 - a12 * a21,
			b11 = -a22 * a10 + a12 * a20,
			b21 = a21 * a10 - a11 * a20,

			d = a00 * b01 + a01 * b11 + a02 * b21,
			id;

		if ( !d ) {
			return false;
		}
		id = 1 / d;

		m.e00 = b01 * id;
		m.e01 = (-a22 * a01 + a02 * a21) * id;
		m.e02 = (a12 * a01 - a02 * a11) * id;
		m.e10 = b11 * id;
		m.e11 = (a22 * a00 - a02 * a20) * id;
		m.e12 = (-a12 * a00 + a02 * a10) * id;
		m.e20 = b21 * id;
		m.e21 = (-a21 * a00 + a01 * a20) * id;
		m.e22 = (a11 * a00 - a01 * a10) * id;

		return true;
	},

	multiply: function( m ) {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b00 = m.e00, b01 = m.e01, b02 = m.e02,
			b10 = m.e10, b11 = m.e11, b12 = m.e12,
			b20 = m.e20, b21 = m.e21, b22 = m.e22;

		this.e00 = b00 * a00 + b10 * a01 + b20 * a02;
		this.e10 = b00 * a10 + b10 * a11 + b20 * a12;
		this.e20 = b00 * a20 + b10 * a21 + b20 * a22;

		this.e01 = b01 * a00 + b11 * a01 + b21 * a02;
		this.e11 = b01 * a10 + b11 * a11 + b21 * a12;
		this.e21 = b01 * a20 + b11 * a21 + b21 * a22;

		this.e02 = b02 * a00 + b12 * a01 + b22 * a02;
		this.e12 = b02 * a10 + b12 * a11 + b22 * a12;
		this.e22 = b02 * a20 + b12 * a21 + b22 * a22;
	},

	multiplyFrom: function( a, b ) {
		var a00 = a.e00, a01 = a.e01, a02 = a.e02,
			a10 = a.e10, a11 = a.e11, a12 = a.e12,
			a20 = a.e20, a21 = a.e21, a22 = a.e22,

			b00 = b.e00, b01 = b.e01, b02 = b.e02,
			b10 = b.e10, b11 = b.e11, b12 = b.e12,
			b20 = b.e20, b21 = b.e21, b22 = b.e22;

		this.e00 = b00 * a00 + b10 * a01 + b20 * a02;
		this.e10 = b00 * a10 + b10 * a11 + b20 * a12;
		this.e20 = b00 * a20 + b10 * a21 + b20 * a22;

		this.e01 = b01 * a00 + b11 * a01 + b21 * a02;
		this.e11 = b01 * a10 + b11 * a11 + b21 * a12;
		this.e21 = b01 * a20 + b11 * a21 + b21 * a22;

		this.e02 = b02 * a00 + b12 * a01 + b22 * a02;
		this.e12 = b02 * a10 + b12 * a11 + b22 * a12;
		this.e22 = b02 * a20 + b12 * a21 + b22 * a22;
	}
};