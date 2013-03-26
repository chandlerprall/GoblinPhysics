Goblin.ConstraintRow = function() {
	this['jacobian'] = new Float64Array( 12 );
	this['B'] = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this['D'] = 0; // Diagonal of JB

	this['lower_limit'] = -Infinity;
	this['upper_limit'] = Infinity;

	this['bias'] = 0;
	this['multiplier'] = 0;
	this['multiplier_cache'] = 0;
	this['eta'] = 0; // The amount of work required of the constraint (penetration resolution, motors, etc)

	this['applied_push_impulse'] = 0;
};
