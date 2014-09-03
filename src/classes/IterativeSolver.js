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
	 *
	 * @property all_constraints
	 * @type {Array}
	 */
	this.all_constraints = [];

	/**
	 * array of constraints on the system, excluding contact & friction
	 *
	 * @property constraints
	 * @type {Array}
	 */
	this.constraints = [];

	/**
	 * maximum solver iterations per time step
	 *
	 * @property max_iterations
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * maximum solver iterations per time step to resolve contacts
	 *
	 * @property penetrations_max_iterations
	 * @type {number}
	 */
	this.penetrations_max_iterations = 5;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 *
	 * @property relaxation
	 * @type {Number}
	 * @default 0.1
	 */
	this.relaxation = 0.1;

	/**
	 * weighting used in the Gauss-Seidel successive over-relaxation solver
	 *
	 * @property sor_weight
	 * @type {Number}
	 */
	this.sor_weight = 0.85;

	this.warmstarting_factor = 0.95;
};

/**
 * adds a constraint to the solver
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.IterativeSolver.prototype.addConstraint = function( constraint ) {
	if ( this.constraints.indexOf( constraint ) === -1 ) {
		this.constraints.push( constraint );
	}
};

/**
 * removes a constraint from the solver
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.IterativeSolver.prototype.removeConstraint = function( constraint ) {
	var idx = this.constraints.indexOf( constraint );
	if ( idx !== -1 ) {
		this.constraints.splice( idx, 1 );
	}
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
		constraint,
		contact_constraints = this.contact_constraints,
		friction_constraints = this.friction_constraints;

	manifold = contact_manifolds.first;

	var onContactDeactivate = function() {
			this.removeListener( 'deactivate', onContactDeactivate );

			var idx = contact_constraints.indexOf( this );
			contact_constraints.splice( idx, 1 );
		},
		onFrictionDeactivate = function() {
			this.removeListener( 'deactivate', onFrictionDeactivate );

			var idx = friction_constraints.indexOf( this );
			friction_constraints.splice( idx, 1 );
		};

	while( manifold ) {
		contacts_length = manifold.points.length;

		for ( i = 0; i < contacts_length; i++ ) {
			contact = manifold.points[i];

			/** Contact Constraints **/
			var existing_constraint = null;
			for ( j = 0; j < contact_constraints.length; j++ ) {
				if ( contact_constraints[j].contact === contact ) {
					existing_constraint = contact_constraints[j];
					break;
				}
			}

			// Build contact constraint
			if ( !existing_constraint ) {
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				contact_constraints.push( constraint );
				constraint.addListener( 'deactivate', onContactDeactivate );
			} else {
				existing_constraint.update();
			}


			/** Friction Constraints **/
			existing_constraint = null;
			for ( j = 0; j < friction_constraints.length; j++ ) {
				if ( friction_constraints[j].contact === contact ) {
					existing_constraint = friction_constraints[j];
					break;
				}
			}

			// Build friction constraint
			if ( !existing_constraint ) {
				constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
				constraint.buildFromContact( contact );
				friction_constraints.push( constraint );
				constraint.addListener( 'deactivate', onFrictionDeactivate );
			} else {
				existing_constraint.update();
			}
		}

		manifold = manifold.next_manifold;
	}

	// @TODO just for now
	this.all_constraints.length = 0;
	Array.prototype.push.apply( this.all_constraints, this.friction_constraints );
	Array.prototype.push.apply( this.all_constraints, this.constraints );
	Array.prototype.push.apply( this.all_constraints, this.contact_constraints );
};

Goblin.IterativeSolver.prototype.prepareConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		num_rows,
		constraint,
		row,
		i, j;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}
		num_rows = constraint.rows.length;

		constraint.update( time_delta );
		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			row.multiplier = 0;
			row.computeB( constraint ); // Objects' inverted mass & inertia tensors & Jacobian
			row.computeD();
			row.computeEta( constraint, time_delta ); // Amount of work needed for the constraint
		}
	}
};

Goblin.IterativeSolver.prototype.resolveContacts = function() {
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

		row.multiplier = 0;
	}
};

Goblin.IterativeSolver.prototype.solveConstraints = function() {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		warmth,
		i, j;

	var iteration,
		delta_lambda,
		max_impulse = 0, // Track the largest impulse per iteration; if the impulse is <= EPSILON then early out
		jdot;

	// Warm starting
	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}

		for ( j = 0; j < constraint.rows.length; j++ ) {
			row = constraint.rows[j];
			warmth = row.multiplier_cached * this.warmstarting_factor;
			row.multiplier = warmth;

			if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
				constraint.object_a.solver_impulse[0] += warmth * row.B[0];
				constraint.object_a.solver_impulse[1] += warmth * row.B[1];
				constraint.object_a.solver_impulse[2] += warmth * row.B[2];

				constraint.object_a.solver_impulse[3] += warmth * row.B[3];
				constraint.object_a.solver_impulse[4] += warmth * row.B[4];
				constraint.object_a.solver_impulse[5] += warmth * row.B[5];
			}
			if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
				constraint.object_b.solver_impulse[0] += warmth * row.B[6];
				constraint.object_b.solver_impulse[1] += warmth * row.B[7];
				constraint.object_b.solver_impulse[2] += warmth * row.B[8];

				constraint.object_b.solver_impulse[3] += warmth * row.B[9];
				constraint.object_b.solver_impulse[4] += warmth * row.B[10];
				constraint.object_b.solver_impulse[5] += warmth * row.B[11];
			}
		}
	}

	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.all_constraints[i];
			if ( constraint.active === false ) {
				continue;
			}
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

				delta_lambda = ( row.eta - jdot ) / row.D * constraint.factor;
				var cache = row.multiplier,
					multiplier_target = cache + delta_lambda;


				// successive over-relaxation
				multiplier_target = this.sor_weight * multiplier_target + ( 1 - this.sor_weight ) * cache;

				// Clamp to row constraints
				row.multiplier = Math.max(
					row.lower_limit,
					Math.min(
						multiplier_target,
						row.upper_limit
					)
				);

				// Find final `delta_lambda`
				delta_lambda = row.multiplier - cache;

				var total_mass = ( constraint.object_a && constraint.object_a.mass !== Infinity ? constraint.object_a.mass : 0 ) +
					( constraint.object_b && constraint.object_b.mass !== Infinity ? constraint.object_b.mass : 0 );
				max_impulse = Math.max( max_impulse, Math.abs( delta_lambda ) / total_mass );

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

		if ( max_impulse <= 0.1 ) {
			break;
		}
	}
};

Goblin.IterativeSolver.prototype.applyConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		i, j,
		invmass;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}
		num_rows = constraint.rows.length;

		constraint.last_impulse[0] = constraint.last_impulse[1] = constraint.last_impulse[2] = 0;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			row.multiplier_cached = row.multiplier;

			if ( constraint.object_a != null && constraint.object_a.mass !== Infinity ) {
				invmass = 1 / constraint.object_a.mass;
				_tmp_vec3_2[0] = invmass * time_delta * row.jacobian[0] * row.multiplier;
				_tmp_vec3_2[1] = invmass * time_delta * row.jacobian[1] * row.multiplier;
				_tmp_vec3_2[2] = invmass * time_delta * row.jacobian[2] * row.multiplier;
				constraint.object_a.linear_velocity[0] += _tmp_vec3_2[0];
				constraint.object_a.linear_velocity[1] += _tmp_vec3_2[1];
				constraint.object_a.linear_velocity[2] += _tmp_vec3_2[2];

				vec3.add( constraint.last_impulse, _tmp_vec3_2 );

				_tmp_vec3_1[0] = time_delta * row.jacobian[3] * row.multiplier;
				_tmp_vec3_1[1] = time_delta * row.jacobian[4] * row.multiplier;
				_tmp_vec3_1[2] = time_delta * row.jacobian[5] * row.multiplier;
				mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				constraint.object_a.angular_velocity[0] += _tmp_vec3_1[0];
				constraint.object_a.angular_velocity[1] += _tmp_vec3_1[1];
				constraint.object_a.angular_velocity[2] += _tmp_vec3_1[2];

				vec3.add( constraint.last_impulse, _tmp_vec3_1 );
			}

			if ( constraint.object_b != null && constraint.object_b.mass !== Infinity ) {
				invmass = 1 / constraint.object_b.mass;
				_tmp_vec3_2[0] = invmass * time_delta * row.jacobian[6] * row.multiplier;
				_tmp_vec3_2[1] = invmass * time_delta * row.jacobian[7] * row.multiplier;
				_tmp_vec3_2[2] = invmass * time_delta * row.jacobian[8] * row.multiplier;
				constraint.object_b.linear_velocity[0] += _tmp_vec3_2[0];
				constraint.object_b.linear_velocity[1] += _tmp_vec3_2[1];
				constraint.object_b.linear_velocity[2] += _tmp_vec3_2[2];

				vec3.add( constraint.last_impulse, _tmp_vec3_2 );

				_tmp_vec3_1[0] = time_delta * row.jacobian[9] * row.multiplier;
				_tmp_vec3_1[1] = time_delta * row.jacobian[10] * row.multiplier;
				_tmp_vec3_1[2] = time_delta * row.jacobian[11] * row.multiplier;
				mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				constraint.object_b.angular_velocity[0] += _tmp_vec3_1[0];
				constraint.object_b.angular_velocity[1] += _tmp_vec3_1[1];
				constraint.object_b.angular_velocity[2] += _tmp_vec3_1[2];

				vec3.add( constraint.last_impulse, _tmp_vec3_1 );
			}
		}

		if ( constraint.breaking_threshold > 0 ) {
			if ( vec3.squaredLength( constraint.last_impulse ) >= constraint.breaking_threshold * constraint.breaking_threshold ) {
				constraint.active = false;
			}
		}
	}
};