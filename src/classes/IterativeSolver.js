/**
 * Adapted from BulletPhysics's btIterativeSolver
 *
 * @class IterativeSolver
 * @constructor
 */
Goblin.IterativeSolver = function() {
	/**
	 * Holds contact constraints generated from contact manifolds
	 *
	 * @property contact_constraints
	 * @type {Array}
	 */
	this.contact_constraints = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @property friction_constraints
	 * @type {Array}
	 */
	this.friction_constraints = [];

	/**
	 * array of all constraints being solved
	 * @property constraints
	 * @type {Array}
	 */
	this.constraints = [];

	/**
	 * maximum solver iterations per time step
	 * @property max_iterations
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * maximum solver iterations per time step to resolve contacts
	 * @property penetrations_max_iterations
	 * @type {number}
	 */
	this.penetrations_max_iterations = 5;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 * @property relaxation
	 * @type {Number}
	 * @default 0.5
	 */
	this.relaxation = 0.5;
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.IterativeSolver.prototype.processContactManifolds = function( contact_manifolds ) {
	var i, j,
		manifold,
		contacts_length,
		contact,
		constraint;

	this.contact_constraints.length = 0;
	this.friction_constraints.length = 0;

	manifold = contact_manifolds.first;

	i = 0;
	while( manifold ) {
		i++;
		contacts_length = manifold.points.length;

		for ( j = 0; j < contacts_length; j++ ) {
			contact = manifold.points[j];

			//if ( contact.penetration_depth >= -0.02 ) {
				// Build contact constraint
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				this.contact_constraints.push( constraint );

				// Build friction constraint
				constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
				constraint.buildFromContact( contact );
				this.friction_constraints.push( constraint );
			//}
		}

		manifold = manifold.next_manifold;
	}

	// @TODO just for now
	this.constraints = [];
	Array.prototype.push.apply( this.constraints, this.contact_constraints );
	Array.prototype.push.apply( this.constraints, this.friction_constraints );
};

Goblin.IterativeSolver.prototype.prepareConstraints = function( time_delta ) {
	var num_constraints = this.constraints.length,
		num_rows,
		constraint,
		row,
		i, j;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			row.multiplier = 0;
			row.computeB( constraint ); // Objects' inverted mass & inertia tensors & Jacobian
			row.computeD();
			row.computeEta( constraint, time_delta ); // Amount of work needed for the constraint
		}
	}
};

Goblin.IterativeSolver.prototype.resolveContacts = function( time_delta ) {
	var iteration,
		constraint,
		jdot, row, i,
		delta_lambda,
		max_impulse = 0,
		invmass;

	// Solve penetrations
	for ( iteration = 0; iteration < this.penetrations_max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < this.contact_constraints.length; i++ ) {
			constraint = this.contact_constraints[i];
			row = constraint.rows[0];

			jdot = 0;
			if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
				jdot += (
					row.jacobian[0] * constraint.object_a.push_velocity[0] +
					row.jacobian[1] * constraint.object_a.push_velocity[1] +
					row.jacobian[2] * constraint.object_a.push_velocity[2] +
					row.jacobian[3] * constraint.object_a.turn_velocity[0] +
					row.jacobian[4] * constraint.object_a.turn_velocity[1] +
					row.jacobian[5] * constraint.object_a.turn_velocity[2]
				);
			}
			if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
				jdot += (
					row.jacobian[6] * constraint.object_b.push_velocity[0] +
					row.jacobian[7] * constraint.object_b.push_velocity[1] +
					row.jacobian[8] * constraint.object_b.push_velocity[2] +
					row.jacobian[9] * constraint.object_b.turn_velocity[0] +
					row.jacobian[10] * constraint.object_b.turn_velocity[1] +
					row.jacobian[11] * constraint.object_b.turn_velocity[2]
				);
			}

			delta_lambda = ( constraint.contact.penetration_depth - jdot ) / row.D;
			var cache = row.multiplier;
			row.multiplier = Math.max(
				row.lower_limit,
				Math.min(
					cache + delta_lambda,
					row.upper_limit
				)
			);
			delta_lambda = row.multiplier - cache;
			max_impulse = Math.max( max_impulse, delta_lambda );

			if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
				constraint.object_a.push_velocity[0] += delta_lambda * row.B[0];
				constraint.object_a.push_velocity[1] += delta_lambda * row.B[1];
				constraint.object_a.push_velocity[2] += delta_lambda * row.B[2];

				constraint.object_a.turn_velocity[0] += delta_lambda * row.B[3];
				constraint.object_a.turn_velocity[1] += delta_lambda * row.B[4];
				constraint.object_a.turn_velocity[2] += delta_lambda * row.B[5];
			}
			if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
				constraint.object_b.push_velocity[0] += delta_lambda * row.B[6];
				constraint.object_b.push_velocity[1] += delta_lambda * row.B[7];
				constraint.object_b.push_velocity[2] += delta_lambda * row.B[8];

				constraint.object_b.turn_velocity[0] += delta_lambda * row.B[9];
				constraint.object_b.turn_velocity[1] += delta_lambda * row.B[10];
				constraint.object_b.turn_velocity[2] += delta_lambda * row.B[11];
			}
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}

	// Apply position/rotation solver
	for ( i = 0; i < this.contact_constraints.length; i++ ) {
		constraint = this.contact_constraints[i];
		row = constraint.rows[0];

		if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
			invmass = 1 / constraint.object_a.mass;
			constraint.object_a.position[0] += invmass * row.jacobian[0] * row.multiplier * this.relaxation;
			constraint.object_a.position[1] += invmass * row.jacobian[1] * row.multiplier * this.relaxation;
			constraint.object_a.position[2] += invmass * row.jacobian[2] * row.multiplier * this.relaxation;

			_tmp_vec3_1[0] = row.jacobian[3] * row.multiplier * this.relaxation;
			_tmp_vec3_1[1] = row.jacobian[4] * row.multiplier * this.relaxation;
			_tmp_vec3_1[2] = row.jacobian[5] * row.multiplier * this.relaxation;
			mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );

			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_a.rotation );

			constraint.object_a.rotation[0] += 0.5 * _tmp_quat4_1[0];
			constraint.object_a.rotation[1] += 0.5 * _tmp_quat4_1[1];
			constraint.object_a.rotation[2] += 0.5 * _tmp_quat4_1[2];
			constraint.object_a.rotation[3] += 0.5 * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_a.rotation );
		}

		if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
			invmass = 1 / constraint.object_b.mass;
			constraint.object_b.position[0] += invmass * row.jacobian[6] * row.multiplier * this.relaxation;
			constraint.object_b.position[1] += invmass * row.jacobian[7] * row.multiplier * this.relaxation;
			constraint.object_b.position[2] += invmass * row.jacobian[8] * row.multiplier * this.relaxation;

			_tmp_vec3_1[0] = row.jacobian[9] * row.multiplier * this.relaxation;
			_tmp_vec3_1[1] = row.jacobian[10] * row.multiplier * this.relaxation;
			_tmp_vec3_1[2] = row.jacobian[11] * row.multiplier * this.relaxation;
			mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );

			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_b.rotation );

			constraint.object_b.rotation[0] += 0.5 * _tmp_quat4_1[0];
			constraint.object_b.rotation[1] += 0.5 * _tmp_quat4_1[1];
			constraint.object_b.rotation[2] += 0.5 * _tmp_quat4_1[2];
			constraint.object_b.rotation[3] += 0.5 * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_b.rotation );
		}
	}
};

Goblin.IterativeSolver.prototype.solveConstraints = function() {
	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j;

	var iteration,
		delta_lambda,
		max_impulse = 0, // Track the largest impulse per iteration; if the impulse is <= EPSILON then early out
		jdot;

	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.constraints[i];
			num_rows = constraint.rows.length;

			for ( j = 0; j < num_rows; j++ ) {
				row = constraint.rows[j];

				jdot = 0;
				if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
					jdot += (
						row.jacobian[0] * constraint.object_a.solver_impulse[0] +
						row.jacobian[1] * constraint.object_a.solver_impulse[1] +
						row.jacobian[2] * constraint.object_a.solver_impulse[2] +
						row.jacobian[3] * constraint.object_a.solver_impulse[3] +
						row.jacobian[4] * constraint.object_a.solver_impulse[4] +
						row.jacobian[5] * constraint.object_a.solver_impulse[5]
						);
				}
				if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
					jdot += (
						row.jacobian[6] * constraint.object_b.solver_impulse[0] +
						row.jacobian[7] * constraint.object_b.solver_impulse[1] +
						row.jacobian[8] * constraint.object_b.solver_impulse[2] +
						row.jacobian[9] * constraint.object_b.solver_impulse[3] +
						row.jacobian[10] * constraint.object_b.solver_impulse[4] +
						row.jacobian[11] * constraint.object_b.solver_impulse[5]
					);
				}

				delta_lambda = ( row.eta - jdot ) / row.D;
				var cache = row.multiplier;
				row.multiplier = Math.max(
					row.lower_limit,
					Math.min(
						cache + delta_lambda,
						row.upper_limit
					)
				);
				delta_lambda = row.multiplier - cache;
				max_impulse = Math.max( max_impulse, delta_lambda );

				if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
					constraint.object_a.solver_impulse[0] += delta_lambda * row.B[0];
					constraint.object_a.solver_impulse[1] += delta_lambda * row.B[1];
					constraint.object_a.solver_impulse[2] += delta_lambda * row.B[2];

					constraint.object_a.solver_impulse[3] += delta_lambda * row.B[3];
					constraint.object_a.solver_impulse[4] += delta_lambda * row.B[4];
					constraint.object_a.solver_impulse[5] += delta_lambda * row.B[5];
				}
				if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
					constraint.object_b.solver_impulse[0] += delta_lambda * row.B[6];
					constraint.object_b.solver_impulse[1] += delta_lambda * row.B[7];
					constraint.object_b.solver_impulse[2] += delta_lambda * row.B[8];

					constraint.object_b.solver_impulse[3] += delta_lambda * row.B[9];
					constraint.object_b.solver_impulse[4] += delta_lambda * row.B[10];
					constraint.object_b.solver_impulse[5] += delta_lambda * row.B[11];
				}
			}
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}
};

Goblin.IterativeSolver.prototype.applyConstraints = function( time_delta ) {
	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j,
		invmass;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];

			if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
				invmass = 1 / constraint.object_a.mass;
				constraint.object_a.linear_velocity[0] += invmass * time_delta * row.jacobian[0] * row.multiplier;
				constraint.object_a.linear_velocity[1] += invmass * time_delta * row.jacobian[1] * row.multiplier;
				constraint.object_a.linear_velocity[2] += invmass * time_delta * row.jacobian[2] * row.multiplier;

				_tmp_vec3_1[0] = time_delta * row.jacobian[3] * row.multiplier;
				_tmp_vec3_1[1] = time_delta * row.jacobian[4] * row.multiplier;
				_tmp_vec3_1[2] = time_delta * row.jacobian[5] * row.multiplier;
				mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				constraint.object_a.angular_velocity[0] += _tmp_vec3_1[0];
				constraint.object_a.angular_velocity[1] += _tmp_vec3_1[1];
				constraint.object_a.angular_velocity[2] += _tmp_vec3_1[2];
			}

			if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
				invmass = 1 / constraint.object_b.mass;
				constraint.object_b.linear_velocity[0] += invmass * time_delta * row.jacobian[6] * row.multiplier;
				constraint.object_b.linear_velocity[1] += invmass * time_delta * row.jacobian[7] * row.multiplier;
				constraint.object_b.linear_velocity[2] += invmass * time_delta * row.jacobian[8] * row.multiplier;

				_tmp_vec3_1[0] = time_delta * row.jacobian[9] * row.multiplier;
				_tmp_vec3_1[1] = time_delta * row.jacobian[10] * row.multiplier;
				_tmp_vec3_1[2] = time_delta * row.jacobian[11] * row.multiplier;
				mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				constraint.object_b.angular_velocity[0] += _tmp_vec3_1[0];
				constraint.object_b.angular_velocity[1] += _tmp_vec3_1[1];
				constraint.object_b.angular_velocity[2] += _tmp_vec3_1[2];
			}
		}
	}
};