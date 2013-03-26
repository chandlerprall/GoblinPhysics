Goblin.Matrix4 = function() {
    this.components = new Float64Array( 16 );
    // Default to identity matrix
    this.components[0] = this.components[4] = this.components[8] = this.components[12] = 1.0;
};

Goblin.Matrix4.prototype.set = function( c00, c01, c02, c03, c10, c11, c12, c13, c20, c21, c22, c23, c30, c31, c32, c33 ) {
    this.components[0] = c00;
    this.components[1] = c01;
    this.components[2] = c02;
    this.components[3] = c03;
    this.components[4] = c10;
    this.components[5] = c11;
    this.components[6] = c12;
    this.components[7] = c13;
    this.components[8] = c20;
    this.components[9] = c21;
    this.components[10] = c22;
    this.components[11] = c23;
    this.components[12] = c30;
    this.components[13] = c31;
    this.components[14] = c32;
    this.components[15] = c33;
};

Goblin.Matrix4.prototype.identity = function( ) {
    this.components[0] = this.components[4] = this.components[8] = this.components[12] = 1.0;
    this.components[1] = this.components[2] = this.components[3] = this.components[5] = this.components[6] = this.components[7] = this.components[9] = this.components[10] = this.components[11] = this.components[13] = this.components[14] = this.components[15] = 0.0;
};

Goblin.Matrix4.prototype.transpose = function() {
    var c01 = this.components[1],
        c02 = this.components[2],
        c03 = this.components[3],
        c12 = this.components[6],
        c13 = this.components[7],
        c23 = this.components[11];

    this.components[1] = this.components[4];
    this.components[2] = this.components[8];
    this.components[3] = this.components[12];
    this.components[4] = c01;
    this.components[6] = this.components[9];
    this.components[7] = this.components[13];
    this.components[8] = c02;
    this.components[9] = c12;
    this.components[11] = this.components[14];
    this.components[12] = c03;
    this.components[13] = c13;
    this.components[14] = c23;
};

Goblin.Matrix4.prototype.determinant = function() {
    return (this.components[12] * this.components[9] * this.components[6] * this.components[3] - this.components[8] * this.components[13] * this.components[6] * this.components[3] - this.components[12] * this.components[5] * this.components[10] * this.components[3] + this.components[4] * this.components[13] * this.components[10] * this.components[3] +
        this.components[8] * this.components[5] * this.components[14] * this.components[3] - this.components[4] * this.components[9] * this.components[14] * this.components[3] - this.components[12] * this.components[9] * this.components[2] * this.components[7] + this.components[8] * this.components[13] * this.components[2] * this.components[7] +
        this.components[12] * this.components[1] * this.components[10] * this.components[7] - this.components[0] * this.components[13] * this.components[10] * this.components[7] - this.components[8] * this.components[1] * this.components[14] * this.components[7] + this.components[0] * this.components[9] * this.components[14] * this.components[7] +
        this.components[12] * this.components[5] * this.components[2] * this.components[11] - this.components[4] * this.components[13] * this.components[2] * this.components[11] - this.components[12] * this.components[1] * this.components[6] * this.components[11] + this.components[0] * this.components[13] * this.components[6] * this.components[11] +
        this.components[4] * this.components[1] * this.components[14] * this.components[11] - this.components[0] * this.components[5] * this.components[14] * this.components[11] - this.components[8] * this.components[5] * this.components[2] * this.components[15] + this.components[4] * this.components[9] * this.components[2] * this.components[15] +
        this.components[8] * this.components[1] * this.components[6] * this.components[15] - this.components[0] * this.components[9] * this.components[6] * this.components[15] - this.components[4] * this.components[1] * this.components[10] * this.components[15] + this.components[0] * this.components[5] * this.components[10] * this.components[15]);
};

Goblin.Matrix4.prototype.inverse = function( ) {
    var a00 = this.components[0], a01 = this.components[1], a02 = this.components[2], a03 = this.components[3],
        a10 = this.components[4], a11 = this.components[5], a12 = this.components[6], a13 = this.components[7],
        a20 = this.components[8], a21 = this.components[9], a22 = this.components[10], a23 = this.components[11],
        a30 = this.components[12], a31 = this.components[13], a32 = this.components[14], a33 = this.components[15],

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

        d = ( b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06 ),
        invDet;

    // Calculate the determinant
    if ( !d ) { return; }
    invDet = 1 / d;

    this.components[0] = ( a11 * b11 - a12 * b10 + a13 * b09 ) * invDet;
    this.components[1] = ( -a01 * b11 + a02 * b10 - a03 * b09 ) * invDet;
    this.components[2] = ( a31 * b05 - a32 * b04 + a33 * b03 ) * invDet;
    this.components[3] = ( -a21 * b05 + a22 * b04 - a23 * b03 ) * invDet;
    this.components[4] = ( -a10 * b11 + a12 * b08 - a13 * b07 ) * invDet;
    this.components[5] = ( a00 * b11 - a02 * b08 + a03 * b07 ) * invDet;
    this.components[6] = ( -a30 * b05 + a32 * b02 - a33 * b01 ) * invDet;
    this.components[7] = ( a20 * b05 - a22 * b02 + a23 * b01 ) * invDet;
    this.components[8] = ( a10 * b10 - a11 * b08 + a13 * b06 ) * invDet;
    this.components[9] = ( -a00 * b10 + a01 * b08 - a03 * b06 ) * invDet;
    this.components[10] = ( a30 * b04 - a31 * b02 + a33 * b00 ) * invDet;
    this.components[11] = ( -a20 * b04 + a21 * b02 - a23 * b00 ) * invDet;
    this.components[12] = ( -a10 * b09 + a11 * b07 - a12 * b06 ) * invDet;
    this.components[13] = ( a00 * b09 - a01 * b07 + a02 * b06 ) * invDet;
    this.components[14] = ( -a30 * b03 + a31 * b01 - a32 * b00 ) * invDet;
    this.components[15] = ( a20 * b03 - a21 * b01 + a22 * b00 ) * invDet;
};

Goblin.Matrix4.prototype.multiply = function( mat ) {
    var a00 = this.components[ 0], a01 = this.components[ 1], a02 = this.components[ 2], a03 = this.components[3],
        a10 = this.components[ 4], a11 = this.components[ 5], a12 = this.components[ 6], a13 = this.components[7],
        a20 = this.components[ 8], a21 = this.components[ 9], a22 = this.components[10], a23 = this.components[11],
        a30 = this.components[12], a31 = this.components[13], a32 = this.components[14], a33 = this.components[15];

    // Cache only the current line of the second matrix
    var b0  = mat.components[0], b1 = mat.components[1], b2 = mat.components[2], b3 = mat.components[3];
    this.components[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat.components[4];
    b1 = mat.components[5];
    b2 = mat.components[6];
    b3 = mat.components[7];
    this.components[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat.components[8];
    b1 = mat.components[9];
    b2 = mat.components[10];
    b3 = mat.components[11];
    this.components[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat.components[12];
    b1 = mat.components[13];
    b2 = mat.components[14];
    b3 = mat.components[15];
    this.components[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
};

Goblin.Matrix4.prototype.multiplyResult = function( mat1, mat2 ) {
    var a00 = mat1.components[ 0], a01 = mat1.components[ 1], a02 = mat1.components[ 2], a03 = mat1.components[3],
        a10 = mat1.components[ 4], a11 = mat1.components[ 5], a12 = mat1.components[ 6], a13 = mat1.components[7],
        a20 = mat1.components[ 8], a21 = mat1.components[ 9], a22 = mat1.components[10], a23 = mat1.components[11],
        a30 = mat1.components[12], a31 = mat1.components[13], a32 = mat1.components[14], a33 = mat1.components[15];

    // Cache only the current line of the second mat2rix
    var b0  = mat2.components[0], b1 = mat2.components[1], b2 = mat2.components[2], b3 = mat2.components[3];
    this.components[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat2.components[4];
    b1 = mat2.components[5];
    b2 = mat2.components[6];
    b3 = mat2.components[7];
    this.components[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat2.components[8];
    b1 = mat2.components[9];
    b2 = mat2.components[10];
    b3 = mat2.components[11];
    this.components[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = mat2.components[12];
    b1 = mat2.components[13];
    b2 = mat2.components[14];
    b3 = mat2.components[15];
    this.components[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    this.components[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    this.components[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    this.components[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
};

Goblin.Matrix4.prototype.translate = function( vec ) {
    var x = vec.components[0], y = vec.components[1], z = vec.components[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    this.components[12] = this.components[0] * x + this.components[4] * y + this.components[8] * z + this.components[12];
    this.components[13] = this.components[1] * x + this.components[5] * y + this.components[9] * z + this.components[13];
    this.components[14] = this.components[2] * x + this.components[6] * y + this.components[10] * z + this.components[14];
    this.components[15] = this.components[3] * x + this.components[7] * y + this.components[11] * z + this.components[15];
};

Goblin.Matrix4.prototype.fromRotationTranslation = function( quat, vec ) {
    var x = quat.components[0], y = quat.components[1], z = quat.components[2], w = quat.components[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    this.components[0] = 1 - (yy + zz);
    this.components[1] = xy + wz;
    this.components[2] = xz - wy;
    this.components[3] = 0;
    this.components[4] = xy - wz;
    this.components[5] = 1 - (xx + zz);
    this.components[6] = yz + wx;
    this.components[7] = 0;
    this.components[8] = xz + wy;
    this.components[9] = yz - wx;
    this.components[10] = 1 - (xx + yy);
    this.components[11] = 0;
    this.components[12] = vec.components[0];
    this.components[13] = vec.components[1];
    this.components[14] = vec.components[2];
    this.components[15] = 1;
};

Goblin.Matrix4.prototype.fromQuaternion = function( quat ) {
    var x = quat.components[0], y = quat.components[1], z = quat.components[2], w = quat.components[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    this.components[0] = 1 - (yy + zz);
    this.components[1] = xy + wz;
    this.components[2] = xz - wy;
    this.components[3] = 0;

    this.components[4] = xy - wz;
    this.components[5] = 1 - (xx + zz);
    this.components[6] = yz + wx;
    this.components[7] = 0;

    this.components[8] = xz + wy;
    this.components[9] = yz - wx;
    this.components[10] = 1 - (xx + yy);
    this.components[11] = 0;

    this.components[12] = 0;
    this.components[13] = 0;
    this.components[14] = 0;
    this.components[15] = 1;
};

Goblin['Matrix4'] = Goblin.Matrix4;
Goblin['Matrix4'].prototype['set'] = Goblin['Matrix4'].prototype.set;
Goblin['Matrix4'].prototype['identity'] = Goblin['Matrix4'].prototype.identity;
Goblin['Matrix4'].prototype['transpose'] = Goblin['Matrix4'].prototype.transpose;
Goblin['Matrix4'].prototype['determinant'] = Goblin['Matrix4'].prototype.determinant;
Goblin['Matrix4'].prototype['inverse'] = Goblin['Matrix4'].prototype.inverse;
Goblin['Matrix4'].prototype['multiply'] = Goblin['Matrix4'].prototype.multiply;
Goblin['Matrix4'].prototype['multiplyResult'] = Goblin['Matrix4'].prototype.multiplyResult;
Goblin['Matrix4'].prototype['translate'] = Goblin['Matrix4'].prototype.translate;
Goblin['Matrix4'].prototype['fromRotationTranslate'] = Goblin['Matrix4'].prototype.fromRotationTranslate;
Goblin['Matrix4'].prototype['fromQuaternion'] = Goblin['Matrix4'].prototype.fromQuaternio;