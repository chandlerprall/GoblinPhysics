/**
 * @module vec3
 * @type {Object}
 */
var vec3 = {};

/**
 * @param {vec3} vec
 * @return {vec3}
 */
vec3.create = function( vec ) {};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {vec3}
 */
vec3.createFrom = function( x, y, z ) {};

/**
 * @param {vec3} vec
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.set = function( vec, dest ) {};

/**
 * @param {vec3} a
 * @param {vec3} b
 * @return {Boolean}
 */
vec3.equal = function( a, b ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.add = function( vec, vec2, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.subtract = function( vec, vec2, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.multiply = function( vec, vec2, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.negate = function( vec, dest ) {};

/**
 * @param {vec3} vec
 * @param {number} val
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.scale = function( vec, val, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.normalize = function( vec, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.cross = function( vec, vec2, dest ) {};

/**
 * @param {vec3} vec
 * @return {number}
 */
vec3.length = function( vec ) {};

/**
 * @param {vec3} vec
 * @return {number}
 */
vec3.squaredLength = function( vec ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @return {number}
 */
vec3.dot = function( vec, vec2 ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.direction = function( vec, vec2, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @param {vec3} dest
 * @param {number} lerp
 * @return {vec3}
 */
vec3.lerp = function( vec, vec2, lerp, dest ) {};

/**
 * @param {vec3} vec
 * @param {vec3} vec2
 * @return {number}
 */
vec3.dist = function( vec, vec2 ) {};

/**
 *
 * @param {vec3} vec
 * @param {mat4} view
 * @param {mat4} proj
 * @param {vec4) viewport
 * @param {vec3} dest
 * @return {vec3}
 */
vec3.unproject = function( vec, view, proj, viewport, dest ) {};

/**
 * @param {vec3} a
 * @param {vec3} b
 * @param {quat4} dest
 * @return {quat4}
 */
vec3.rotationTo = function( a, b, dest ) {};

/**
 * @param {vec3} vec
 * @return string
 */
vec3.str = function( vec ) {};


/**
 * @module quat4
 */
var quat4 = {};

/**
 * @param {quat4} [quat] quat4 containing values to initialize with
 */
quat4.create = function( quat ) {};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {Number} w
 */
quat4.createFrom = function( x, y, z, w ) {};

/**
 * @param {quat4} quat
 * @param {quat4} [dest]
 */
quat4.set = function( quat, dest ) {};

/**
 * @param {quat4} a
 * @param {quat4} b
 */
quat4.equal = function( a, b ) {};

/**
 * @param {quat4} [dest]
 */
quat4.identity = function( dest ) {};

/**
 * @param {quat4} quat
 * @param {quat4} [dest]
 */
quat4.calculateW = function( quat, dest ) {};

/**
 * @param {quat4} quat
 * @param {quat4} quat2
 */
quat4.dot = function( quat, quat2 ) {};

/**
 * @param {quat4} quat
 * @param {quat4} [dest]
 */
quat4.inverse = function( quat, dest ) {};

/**
 * @param {quat4} quat
 * @param {quat4} [dest]
 */
quat4.conjugate = function( quat, dest ) {};

/**
 * @param {quat4} quat4
 */
quat4.length = function( quat4 ) {};

/**
 * @param {quat4} quat
 * @param {quat4} [dest]
 */
quat4.normalize = function( quat, dest ) {};

/**
 * @param {quat4} quat
 * @param {quat4} quat2
 * @param {quat4) [dest]
 */
quat4.add = function( quat, quat2, dest ) {};


/**
 * @param {quat4} quat
 * @param {quat4} quat2
 * @param {quat4) [dest]
 */
quat4.multiply = function( quat, quat2, dest ) {};

/**
 * @param {quat4} quat
 * @param {vec3} vec
 * @param {vec3} [dest]
 */
quat4.multiplyVec3 = function( quat, vec, dest ) {};

/**
 * @param {quat4} quat
 * @param {Number} val
 * @param {quat4) [dest]
 */
quat4.scale = function( quat, val, dest ) {};

/**
 * @param {quat4} quat
 * @param {mat3} [dest]
 */
quat4.toMat3 = function( quat, dest ) {};

/**
 * @param {quat4} quat
 * @param {mat4} [dest]
 */
quat4.toMat4 = function( quat, dest ) {};

/**
 * @param {quat4} quat
 * @param {quat4} quat2
 * @param {Number} slerp
 * @param {quat4} [dest]
 */
quat4.slerp = function( quat, quat2, slerp, dest ) {};

/**
 * @param {mat3} mat
 * @param {quat4} [dest]
 */
quat4.fromRotationMatrix = function( mat, dest ) {};

/**
 * @param {vec3} view
 * @param {vec3} up
 * @param {vec3} right
 * @param {quat4} [dest]
 */
quat4.fromAxes = function( view, up, right, dest ) {};

/**
 * @param {Number} angle
 * @param {vec3} axis
 * @param {quat4} [dest]
 */
quat4.fromAngleAxis = function( angle, axis, dest ) {};

/**
 * @param {quat4} src
 * @param {vec4} dest
 */
quat4.toAngleAxis = function( src, dest ) {};

/**
 * @param {quat4} quat
 */
quat4.str = function( quat ) {};


var mat4 = {};
mat4.create;
mat4.createFrom;
mat4.set;
mat4.equal;
mat4.identity;
mat4.transpose;
mat4.determinant;
mat4.inverse;
mat4.toRotationMat;
mat4.toMat3;
mat4.toInverseMat3;
mat4.multiply;
mat4.multiplyVec3;
mat4.multiplyVec4;
mat4.translate;
mat4.scale;
mat4.rotate;
mat4.rotateX;
mat4.rotateY;
mat4.rotateZ;
mat4.frustum;
mat4.perspective;
mat4.ortho;
mat4.lookAt;
mat4.fromRotationTranslation;
mat4.str;


var vec4 = {};
vec4.create;
vec4.createFrom;
vec4.add;
vec4.subtract;
vec4.multiply;
vec4.divide;
vec4.scale;
vec4.set;
vec4.equal;
vec4.negate;
vec4.length;
vec4.squaredLength;
vec4.lerp;
vec4.str;