/**
* adds a drag force to associated objects
*
* @class DragForce
* @extends ForceGenerator
* @constructor
*/
Goblin['DragForce'] = function( drag_coefficient, squared_drag_coefficient ) {
	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this['drag_coefficient'] = drag_coefficient || 0;

	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this['squared_drag_coefficient'] = squared_drag_coefficient || 0;

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
Goblin['DragForce'].prototype['enable'] = Goblin['ForceGenerator'].prototype['enable'];
Goblin['DragForce'].prototype['disable'] = Goblin['ForceGenerator'].prototype['disable'];
Goblin['DragForce'].prototype['affect'] = Goblin['ForceGenerator'].prototype['affect'];
Goblin['DragForce'].prototype['unaffect'] = Goblin['ForceGenerator'].prototype['unaffect'];
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin['DragForce'].prototype['applyForce'] = function() {
	if ( !this['enabled'] ) {
		return;
	}

	var i, affected_count, object, drag,
		force = _tmp_vec3_1;

	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		object = this.affected[i];

		vec3.set( object['linear_velocity'], force );

		// Calculate the total drag coefficient.
		drag = vec3.length( force );
		drag = ( this['drag_coefficient'] * drag ) + ( this['squared_drag_coefficient'] * drag * drag );

		// Calculate the final force and apply it.
		vec3.normalize( force );
		vec3.scale( force, -drag );
		object['applyForce']( force );
	}
};