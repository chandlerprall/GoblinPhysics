Goblin.Matrix4 = function() {
	this.e00 = 0;
	this.e01 = 0;
	this.e02 = 0;
	this.e03 = 0;

	this.e10 = 0;
	this.e11 = 0;
	this.e12 = 0;
	this.e13 = 0;

	this.e20 = 0;
	this.e21 = 0;
	this.e22 = 0;
	this.e23 = 0;

	this.e30 = 0;
	this.e31 = 0;
	this.e32 = 0;
	this.e33 = 0;
};

Goblin.Matrix4.prototype = {
	identity: function() {
		this.e00 = 1;
		this.e01 = 0;
		this.e02 = 0;
		this.e03 = 0;

		this.e10 = 0;
		this.e11 = 1;
		this.e12 = 0;
		this.e13 = 0;

		this.e20 = 0;
		this.e21 = 0;
		this.e22 = 1;
		this.e23 = 0;

		this.e30 = 0;
		this.e31 = 0;
		this.e32 = 0;
		this.e33 = 1;
	},

	copy: function( m ) {
		this.e00 = m.e00;
		this.e01 = m.e01;
		this.e02 = m.e02;
		this.e03 = m.e03;

		this.e10 = m.e10;
		this.e11 = m.e11;
		this.e12 = m.e12;
		this.e13 = m.e13;

		this.e20 = m.e20;
		this.e21 = m.e21;
		this.e22 = m.e22;
		this.e23 = m.e23;

		this.e30 = m.e30;
		this.e31 = m.e31;
		this.e32 = m.e32;
		this.e33 = m.e33;
	},

	makeTransform: function( rotation, translation ) {
		// Setup rotation
		var x2 = rotation.x + rotation.x,
			y2 = rotation.y + rotation.y,
			z2 = rotation.z + rotation.z,
			xx = rotation.x * x2,
			xy = rotation.x * y2,
			xz = rotation.x * z2,
			yy = rotation.y * y2,
			yz = rotation.y * z2,
			zz = rotation.z * z2,
			wx = rotation.w * x2,
			wy = rotation.w * y2,
			wz = rotation.w * z2;

		this.e00 = 1 - ( yy + zz );
		this.e10 = xy + wz;
		this.e20 = xz - wy;
		this.e30 = 0;
		this.e01 = xy - wz;
		this.e11 = 1 - (xx + zz);
		this.e21 = yz + wx;
		this.e31 = 0;
		this.e02 = xz + wy;
		this.e12 = yz - wx;
		this.e22 = 1 - (xx + yy);
		this.e32 = 0;

		// Translation
		this.e03 = translation.x;
		this.e13 = translation.y;
		this.e23 = translation.z;
		this.e33 = 1;
	},

	transformVector3: function( v ) {
		// Technically this should compute the `w` term and divide the resulting vector
		// components by `w` to homogenize but we don't scale so `w` is just `1`
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z + this.e03;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z + this.e13;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z + this.e23;
	},

	transformVector3Into: function( v, dest ) {
		// Technically this should compute the `w` term and divide the resulting vector
		// components by `w` to homogenize but we don't scale so `w` is just `1`
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z + this.e03;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z + this.e13;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z + this.e23;
	},

	rotateVector3: function( v ) {
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z;
	},

	rotateVector3Into: function( v, dest ) {
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z;
	},

	invert: function() {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02, a03 = this.e03,
			a10 = this.e10, a11 = this.e11, a12 = this.e12, a13 = this.e13,
			a20 = this.e20, a21 = this.e21, a22 = this.e22, a23 = this.e23,
			a30 = this.e30, a31 = this.e31, a32 = this.e32, a33 = this.e33,

			b00 = a00 * a11 - a01 * a10,
			b01 = a00 * a12 - a02 * a10,
			b02 = a00 * a13 - a03 * a10,
			b03 = a01 * a12 - a02 * a11,
			b04 = a01 * a13 - a03 * a11,
			b05 = a02 * a13 - a03 * a12,
			b06 = a20 * a31 - a21 * a30,
			b07 = a20 * a32 - a22 * a30,
			b08 = a20 * a33 - a23 * a30,
			b09 = a21 * a32 - a22 * a31,
			b10 = a21 * a33 - a23 * a31,
			b11 = a22 * a33 - a23 * a32,

			d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
			invDet;

		// Calculate the determinant
		if ( !d ) {
			return false;
		}
		invDet = 1 / d;

		this.e00 = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
		this.e01 = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
		this.e02 = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
		this.e03 = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
		this.e10 = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
		this.e11 = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
		this.e12 = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
		this.e13 = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
		this.e20 = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
		this.e21 = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
		this.e22 = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
		this.e23 = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
		this.e30 = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
		this.e31 = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
		this.e32 = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
		this.e33 = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

		return true;
	},

	invertInto: function( m ) {
		var a00 = this.e00, a01 = this.e10, a02 = this.e20, a03 = this.e30,
			a10 = this.e01, a11 = this.e11, a12 = this.e21, a13 = this.e31,
			a20 = this.e02, a21 = this.e12, a22 = this.e22, a23 = this.e32,
			a30 = this.e03, a31 = this.e13, a32 = this.e23, a33 = this.e33,

			b00 = a00 * a11 - a01 * a10,
			b01 = a00 * a12 - a02 * a10,
			b02 = a00 * a13 - a03 * a10,
			b03 = a01 * a12 - a02 * a11,
			b04 = a01 * a13 - a03 * a11,
			b05 = a02 * a13 - a03 * a12,
			b06 = a20 * a31 - a21 * a30,
			b07 = a20 * a32 - a22 * a30,
			b08 = a20 * a33 - a23 * a30,
			b09 = a21 * a32 - a22 * a31,
			b10 = a21 * a33 - a23 * a31,
			b11 = a22 * a33 - a23 * a32,

			d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
			invDet;

		// Calculate the determinant
		if ( !d ) {
			return false;
		}
		invDet = 1 / d;

		m.e00 = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
		m.e10 = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
		m.e20 = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
		m.e30 = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
		m.e01 = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
		m.e11 = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
		m.e21 = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
		m.e31 = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
		m.e02 = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
		m.e12 = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
		m.e22 = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
		m.e32 = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
		m.e03 = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
		m.e13 = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
		m.e23 = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
		m.e33 = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
	},

	multiply: function( m ) {
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = this.e00, a01 = this.e10, a02 = this.e20, a03 = this.e30;
		var a10 = this.e01, a11 = this.e11, a12 = this.e21, a13 = this.e31;
		var a20 = this.e02, a21 = this.e12, a22 = this.e22, a23 = this.e32;
		var a30 = this.e03, a31 = this.e13, a32 = this.e23, a33 = this.e33;

		// Cache only the current line of the second matrix
		var b0  = m.e00, b1 = m.e10, b2 = m.e20, b3 = m.e30;
		this.e00 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e10 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e20 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e30 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e01;
		b1 = m.e11;
		b2 = m.e21;
		b3 = m.e31;
		this.e01 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e11 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e21 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e31 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e02;
		b1 = m.e12;
		b2 = m.e22;
		b3 = m.e32;
		this.e02 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e12 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e22 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e32 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e03;
		b1 = m.e13;
		b2 = m.e23;
		b3 = m.e33;
		this.e03 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e13 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e23 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e33 = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	}
};