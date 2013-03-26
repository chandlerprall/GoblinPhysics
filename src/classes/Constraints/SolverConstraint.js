/**
 * Adapted from BulletPhysics's btSolverConstraint
 *
 * @class SolverConstraint
 * @constructor
 */
Goblin.SolverConstraint = function() {
	this['object_a'] = null;
	this['object_b'] = null;

	this['relpos1_crossnormal'] = vec3.create();
	this['relpos2_crossnormal'] = vec3.create();
	this['contact_normal'] = vec3.create();

	this['angular_component_a'] = vec3.create();
	this['angular_component_b'] = vec3.create();

	this['applied_push_impulse'] = 0;
	this['applied_impulse'] = 0;

	this['friction'] = 0;
	this['jac_diag_ab_inv'] = 0;
	this['rhs'] = 0;
	this['rhs_penetration'] = 0;
	this['cfm'] = 0;

	this['lower_limit'] = -Infinity;
	this['upper_limit'] = Infinity;

	this['contact_point'] = null;

	this['override_num_solver_interations'] = 0;
	this['friction_index'] = null;

	this['constraint_type'] = null;
};

/**
 * Enum of constraint types
 * @type {Object}
 */
Goblin.SolverConstraint.ConstraintType = {
	'CONTACT': 0,
	'FRICTION': 1
};

// mappings for closure compiler
Goblin['SolverConstraint'] = Goblin.SolverConstraint;
Goblin.SolverConstraint['ConstraintType'] = Goblin.SolverConstraint.ConstraintType;