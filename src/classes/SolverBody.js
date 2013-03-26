/**
 * Interface for a rigid body which is used during solving
 *
 * @class SolverBody
 * @constructor
 */
Goblin.SolverBody = function() {
	this['body'] = null;

	this['delta_linear_velocity'] = vec3.create();
	this['delta_angular_velocity'] = vec3.create();
	this['push_velocity'] = vec3.create();
	this['turn_velocity'] = vec3.create();
};

Goblin.SolverBody.prototype.internalApplyImpulse = function( linear_component, angular_component, impulse_magnitude ) {
	vec3.multiply( linear_component, this['body']['linear_damping'], _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, impulse_magnitude );
	vec3.add( this['delta_linear_velocity'], _tmp_vec3_1 );

	vec3.multiply( angular_component, this['body']['angular_damping'], _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, impulse_magnitude );
	vec3.add( this['delta_angular_velocity'], _tmp_vec3_1 );
};

Goblin.SolverBody.prototype.internalApplyPushImpulse = function( linear_component, angular_component, impulse_magnitude ) {
	vec3.multiply( linear_component, this['body']['linear_damping'], _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, impulse_magnitude );
	vec3.add( this['push_velocity'], _tmp_vec3_1 );

	vec3.multiply( angular_component, this['body']['angular_damping'], _tmp_vec3_1 );
	vec3.scale( _tmp_vec3_1, impulse_magnitude );
	vec3.add( this['turn_velocity'], _tmp_vec3_1 );
};

Goblin.SolverBody.prototype.writebackVelocityAndTransform = function( time_delta, split_impulse_turn_erp ) {
	vec3.add( this['body']['linear_velocity'], this['delta_linear_velocity'] );
	vec3.add( this['body']['angular_velocity'], this['delta_angular_velocity'] );
	// @TODO correct the position/orientation based on push/turn recovery
};

// mappings for closure compiler
Goblin['SolverBody'] = Goblin.SolverBody;
Goblin.SolverBody.prototype['internalApplyImpulse'] = Goblin.SolverBody.prototype.internalApplyImpulse;
Goblin.SolverBody.prototype['internalApplyPushImpulse'] = Goblin.SolverBody.prototype.internalApplyPushImpulse;
Goblin.SolverBody.prototype['writebackVelocityAndTransform'] = Goblin.SolverBody.prototype.writebackVelocityAndTransform;