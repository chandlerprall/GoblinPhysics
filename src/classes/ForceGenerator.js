/**
 * adds a constant force to associated objects
 *
 * @class ForceGenerator
 * @constructor
 * @param force {vec3} [optional] force the generator applies
*/
Goblin['ForceGenerator'] = function( force ) {
	/**
	* force which will be applied to affected objects
	*
	* @property force
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this['force'] = force || vec3.create();

	/**
	* whether or not the force generator is enabled
	*
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this['enabled'] = true;

	/**
	* array of objects affected by the generator
	*
	* @property affected
	* @type {Array}
	* @default []
	* @private
	*/
	this.affected = [];
};
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin['ForceGenerator'].prototype['applyForce'] = function() {
	if ( !this['enabled'] ) {
		return;
	}

	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		this.affected[i]['applyForce']( this['force'] );
	}
};
/**
* enables the force generator
*
* @method enable
*/
Goblin['ForceGenerator'].prototype['enable'] = function() {
	this['enabled'] = true;
};
/**
* disables the force generator
*
* @method disable
*/
Goblin['ForceGenerator'].prototype['disable'] = function() {
	this['enabled'] = false;
};
/**
* adds an object to be affected by the generator
*
* @method affect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin['ForceGenerator'].prototype['affect'] = function( object ) {
	var i, affected_count;
	// Make sure this object isn't already affected
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			return;
		}
	}

	this.affected.push( object );
};
/**
* removes an object from being affected by the generator
*
* @method unaffect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin['ForceGenerator'].prototype['unaffect'] = function( object ) {
	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			this.affected.splice( i, 1 );
			return;
		}
	}
};