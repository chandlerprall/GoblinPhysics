Goblin.Vector3 = function( x, y, z ) {
    this.components = new Float64Array( 3 );
    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
};

Goblin.Vector3.prototype.set = function( x, y, z ) {
    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
};

Goblin.Vector3.prototype.copy = function( vec ) {
    this.components[0] = vec.components[0];
    this.components[1] = vec.components[1];
    this.components[2] = vec.components[2];
};

Goblin.Vector3.prototype.equals = function( vec ) {
    if (
        Math.abs( this.components[0] - vec.components[0] ) > Goblin.EPSILON ||
            Math.abs( this.components[1] - vec.components[1] ) > Goblin.EPSILON ||
            Math.abs( this.components[2] - vec.components[2] ) > Goblin.EPSILON
        ) {
        return false;
    }
    return true;
};

Goblin.Vector3.prototype.add = function( vec ) {
    this.components[0] += vec.components[0];
    this.components[1] += vec.components[1];
    this.components[2] += vec.components[2];
};

Goblin.Vector3.prototype.addScaled = function( vec, scale ) {
    this.components[0] += vec.components[0] * scale;
    this.components[1] += vec.components[1] * scale;
    this.components[2] += vec.components[2] * scale;
};

Goblin.Vector3.prototype.multiplyScalar = function( s ) {
    this.components[0] *= s;
    this.components[1] *= s;
    this.components[2] *= s;
};

Goblin.Vector3.prototype.multiply = function( vec ) {
    this.components[0] *= vec.components[0];
    this.components[1] *= vec.components[1];
    this.components[2] *= vec.components[2];
};

Goblin.Vector3.prototype.negate = function() {
    this.components[0] *= -1;
    this.components[1] *= -1;
    this.components[2] *= -1;
};

Goblin.Vector3.prototype.normalize = function() {
    var length = Math.sqrt( this.components[0] * this.components[0] + this.components[1] * this.components[1] + this.components[2] * this.components[2] ),
        length_inv;

    if ( length === 1 ) {
        return;
    }

    length_inv = 1 / length;
    this.components[0] *= length_inv;
    this.components[1] *= length_inv;
    this.components[2] *= length_inv;
};

Goblin.Vector3.prototype.length = function() {
    return Math.sqrt( this.components[0] * this.components[0] + this.components[1] * this.components[1] + this.components[2] * this.components[2] );
};

Goblin.Vector3.prototype.lengthSquared = function() {
    return this.components[0] * this.components[0] + this.components[1] * this.components[1] + this.components[2] * this.components[2];
};

Goblin.Vector3.prototype.cross = function( vec ) {
    var x = this.components[0],
        y = this.components[1],
        z = this.components[2],
        x2 = vec.components[0],
        y2 = vec.components[1],
        z2 = vec.components[2];
    this.components[0] = y * z2 - z * y2;
    this.components[1] = z * x2 - x * z2;
    this.components[2] = x * y2 - y * x2;
};
Goblin.Vector3.prototype.crossResult = function( vec_a, vec_b ) {
    var x = vec_a.components[0],
        y = vec_a.components[1],
        z = vec_a.components[2],
        x2 = vec_b.components[0],
        y2 = vec_b.components[1],
        z2 = vec_b.components[2];
    this.components[0] = y * z2 - z * y2;
    this.components[1] = z * x2 - x * z2;
    this.components[2] = x * y2 - y * x2;
};

Goblin.Vector3.prototype.dot = function( vec ) {
    return this.components[0] * vec.components[0] + this.components[1] * vec.components[1] + this.components[2] * vec.components[2];
};

Goblin.Vector3.prototype.matrix4Transform = function( mat ) {
    var x = this.components[0],
        y = this.components[1],
        z = this.components[2];

    this.components[0] = mat.components[0] * x + mat.components[4] * y + mat.components[8] * z + mat.components[12];
    this.components[1] = mat.components[1] * x + mat.components[5] * y + mat.components[9] * z + mat.components[13];
    this.components[2] = mat.components[2] * x + mat.components[6] * y + mat.components[10] * z + mat.components[14];
};

Goblin.Vector3.prototype.matrix4TransformResult = function( mat, vec ) {
    var x = vec.components[0],
        y = vec.components[1],
        z = vec.components[2];

    this.components[0] = mat.components[0] * x + mat.components[4] * y + mat.components[8] * z + mat.components[12];
    this.components[1] = mat.components[1] * x + mat.components[5] * y + mat.components[9] * z + mat.components[13];
    this.components[2] = mat.components[2] * x + mat.components[6] * y + mat.components[10] * z + mat.components[14];
};

Goblin.Vector3.prototype.quaternionTransform = function( quat ) {
    var x = this.components[0], y = this.components[1], z = this.components[2],
        qx = quat.components[0], qy = quat.components[1], qz = quat.components[2], qw = quat.components[3],

    // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.components[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.components[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.components[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
};

Goblin.Vector3.prototype.quaternionTransformResult = function( quat, vec ) {
    var x = vec.components[0], y = vec.components[1], z = vec.components[2],
        qx = quat.components[0], qy = quat.components[1], qz = quat.components[2], qw = quat.components[3],

    // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.components[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.components[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.components[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
};

Goblin['Vector3'] = Goblin.Vector3;
Goblin['Vector3'].prototype['set'] = Goblin['Vector3'].prototype.set;
Goblin['Vector3'].prototype['copy'] = Goblin['Vector3'].prototype.copy;
Goblin['Vector3'].prototype['equals'] = Goblin['Vector3'].prototype.equals;
Goblin['Vector3'].prototype['add'] = Goblin['Vector3'].prototype.add;
Goblin['Vector3'].prototype['addScaled'] = Goblin['Vector3'].prototype.addScaled;
Goblin['Vector3'].prototype['multiplyScalar'] = Goblin['Vector3'].prototype.multiplyScalar;
Goblin['Vector3'].prototype['multiply'] = Goblin['Vector3'].prototype.multiply;
Goblin['Vector3'].prototype['negate'] = Goblin['Vector3'].prototype.negate;
Goblin['Vector3'].prototype['normalize'] = Goblin['Vector3'].prototype.normalize;
Goblin['Vector3'].prototype['length'] = Goblin['Vector3'].prototype.length;
Goblin['Vector3'].prototype['lengthSquared'] = Goblin['Vector3'].prototype.lengthSquared;
Goblin['Vector3'].prototype['cross'] = Goblin['Vector3'].prototype.cross;
Goblin['Vector3'].prototype['crossResult'] = Goblin['Vector3'].prototype.crossResult;
Goblin['Vector3'].prototype['dot'] = Goblin['Vector3'].prototype.dot;
Goblin['Vector3'].prototype['matrix4Transform'] = Goblin['Vector3'].prototype.matrix4Transform;
Goblin['Vector3'].prototype['matrix4TransformResult'] = Goblin['Vector3'].prototype.matrix4TransformResult;
Goblin['Vector3'].prototype['quaternionTransform'] = Goblin['Vector3'].prototype.quaternionTransform;
Goblin['Vector3'].prototype['quaternionTransformResult'] = Goblin['Vector3'].prototype.quaternionTransformResult;