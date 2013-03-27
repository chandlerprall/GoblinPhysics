Goblin.Quaternion = function( x, y, z, w ) {
    this.components = new Float64Array( 4 );
    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
    this.components[3] = w;
};

Goblin.Quaternion.prototype.set = function( x, y, z, w ) {
    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
    this.components[3] = w;
};

Goblin.Quaternion.prototype.identity = function() {
    this.components[0] = 0;
    this.components[1] = 0;
    this.components[2] = 0;
    this.components[3] = 1;
};

Goblin.Quaternion.prototype.calculateW = function() {
    this.components[3] = -Math.sqrt( Math.abs( 1.0 - this.components[0] * this.components[0] - this.components[1] * this.components[1] - this.components[2] * this.components[2] ) );
};

Goblin.Quaternion.prototype.dot = function( quat ) {
    return this.components[0] * quat.components[0] + this.components[1] * quat.components[1] + this.components[2] * quat.components[2] + this.components[3] * quat.components[3];
};

Goblin.Quaternion.prototype.inverse = function() {
    var q0 = this.components[0], q1 = this.components[1], q2 = this.components[2], q3 = this.components[3],
        dot = q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3,
        invDot = dot ? 1.0 / dot : 0;

    this.components[0] *= -invDot;
    this.components[1] *= -invDot;
    this.components[2] *= -invDot;
    this.components[3] *= invDot;
};

Goblin.Quaternion.prototype.inverseResult = function( quat ) {
    var q0 = quat.components[0], q1 = quat.components[1], q2 = quat.components[2], q3 = quat.components[3],
        dot = q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3,
        invDot = dot ? 1.0 / dot : 0;

    this.components[0] *= -invDot;
    this.components[1] *= -invDot;
    this.components[2] *= -invDot;
    this.components[3] *= invDot;
};

Goblin.Quaternion.prototype.conjugate = function() {
    this.components[0] *= -1;
    this.components[1] *= -1;
    this.components[2] *= -1;
};

Goblin.Quaternion.prototype.conjugateResult = function( quat ) {
    this.components[0] = quat.components[0] * -1;
    this.components[1] = quat.components[1] * -1;
    this.components[2] = quat.components[2] * -1;
};

Goblin.Quaternion.prototype.length = function() {
    return Math.sqrt( this.components[0] * this.components[0] + this.components[1] * this.components[1] + this.components[2] * this.components[2] + this.components[3] * this.components[3] );
};

Goblin.Quaternion.prototype.normalize = function() {
    var x = this.components[0], y = this.components[1], z = this.components[2], w = this.components[3],
        len = Math.sqrt( x * x + y * y + z * z + w * w );
    if (len === 0) {
        this.components[0] = 0;
        this.components[1] = 0;
        this.components[2] = 0;
        this.components[3] = 0;
        return;
    }
    len = 1 / len;
    this.components[0] = x * len;
    this.components[1] = y * len;
    this.components[2] = z * len;
    this.components[3] = w * len;
};

Goblin.Quaternion.prototype.add = function( quat ) {
    this.components[0] += quat.components[0];
    this.components[1] += quat.components[1];
    this.components[2] += quat.components[2];
    this.components[3] += quat.components[3];
};

Goblin.Quaternion.prototype.addResult = function( quat1, quat2 ) {
    this.components[0] = quat1.components[0] + quat2.components[0];
    this.components[1] = quat1.components[1] + quat2.components[1];
    this.components[2] = quat1.components[2] + quat2.components[2];
    this.components[3] = quat1.components[3] + quat2.components[3];
};

Goblin.Quaternion.prototype.multiply = function( quat ) {
    var qax = this.components[0], qay = this.components[1], qaz = this.components[2], qaw = this.components[3],
        qbx = quat.components[0], qby = quat.components[1], qbz = quat.components[2], qbw = quat.components[3];

    this.components[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.components[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.components[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.components[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
};

Goblin.Quaternion.prototype.multiplyResult = function( quat1, quat2 ) {
    var qax = quat1.components[0], qay = quat1.components[1], qaz = quat1.components[2], qaw = quat1.components[3],
        qbx = quat2.components[0], qby = quat2.components[1], qbz = quat2.components[2], qbw = quat2.components[3];

    this.components[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.components[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.components[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.components[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
};

Goblin.Quaternion.prototype.slerp = function( quat, slerp ) {
    var cosHalfTheta = this.components[0] * quat.components[0] + this.components[1] * quat.components[1] + this.components[2] * quat.components[2] + this.components[3] * quat.components[3],
        halfTheta,
        sinHalfTheta,
        ratioA,
        ratioB;

    if ( Math.abs( cosHalfTheta ) >= 1.0 ) {
        return;
    }

    halfTheta = Math.acos( cosHalfTheta );
    sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
        this.components[0] = ( this.components[0] * 0.5 + quat.components[0] * 0.5 );
        this.components[1] = ( this.components[1] * 0.5 + quat.components[1] * 0.5 );
        this.components[2] = ( this.components[2] * 0.5 + quat.components[2] * 0.5 );
        this.components[3] = ( this.components[3] * 0.5 + quat.components[3] * 0.5 );
        return;
    }

    ratioA = Math.sin( ( 1 - slerp ) * halfTheta ) / sinHalfTheta;
    ratioB = Math.sin( slerp * halfTheta ) / sinHalfTheta;

    this.components[0] = ( this.components[0] * ratioA + quat.components[0] * ratioB );
    this.components[1] = ( this.components[1] * ratioA + quat.components[1] * ratioB );
    this.components[2] = ( this.components[2] * ratioA + quat.components[2] * ratioB );
    this.components[3] = ( this.components[3] * ratioA + quat.components[3] * ratioB );
};

Goblin.Quaternion.prototype.fromAngleAxis = function( angle, axis ) {
    var half = angle * 0.5,
        s = Math.sin( half );

    this.components[0] = s * axis.components[0];
    this.components[1] = s * axis.components[1];
    this.components[2] = s * axis.components[2];
    this.components[3] = Math.cos( half );
};

Goblin.Quaternion = Goblin.Quaternion;
Goblin.Quaternion.prototype.set = Goblin.Quaternion.prototype.set;
Goblin.Quaternion.prototype.identity = Goblin.Quaternion.prototype.identity;
Goblin.Quaternion.prototype.calculateW = Goblin.Quaternion.prototype.calculateW;
Goblin.Quaternion.prototype.dot = Goblin.Quaternion.prototype.dot;
Goblin.Quaternion.prototype.inverse = Goblin.Quaternion.prototype.inverse;
Goblin.Quaternion.prototype.inverseResult = Goblin.Quaternion.prototype.inverseResult;
Goblin.Quaternion.prototype.conjugate = Goblin.Quaternion.prototype.conjugate;
Goblin.Quaternion.prototype.conjugateResult = Goblin.Quaternion.prototype.conjugateResult;
Goblin.Quaternion.prototype.length = Goblin.Quaternion.prototype.length;
Goblin.Quaternion.prototype.normalize = Goblin.Quaternion.prototype.normalize;
Goblin.Quaternion.prototype.add = Goblin.Quaternion.prototype.add;
Goblin.Quaternion.prototype.addResult = Goblin.Quaternion.prototype.addResult;
Goblin.Quaternion.prototype.multiply = Goblin.Quaternion.prototype.multiply;
Goblin.Quaternion.prototype.multiplyResult = Goblin.Quaternion.prototype.multiplyResult;
Goblin.Quaternion.prototype.slerp = Goblin.Quaternion.prototype.slerp;
Goblin.Quaternion.prototype.fromAngleAxis = Goblin.Quaternion.prototype.fromAngleAxis;