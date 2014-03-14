/**
 * Adapted from BulletPhysics's btSequentialImpulseSolver
 *
 * @class SequentialImpulseSolver
 * @constructor
 */
Goblin.SequentialImpulseSolver = function() {
	/**
	 * Holds contact constraints generated from contact manifolds
	 *
	 * @param contact_constraints
	 * @type {Array}
	 */
	this.contact_constraints = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @param friction_constraints
	 * @type {Array}
	 */
	this.friction_constraints = [];

	/**
	 * array of all constraints being solved
	 * @type {Array}
	 */
	this.constraints = [];

	// Maximum solver iterations per time step
	/**
	 * maximum solver iterations to perforrm
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 * @type {Number}
	 */
	this.relaxation = 1;
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.SequentialImpulseSolver.prototype.processContactManifolds = function( contact_manifolds ) {
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

Goblin.SequentialImpulseSolver.prototype.prepareConstraints = function() {
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

			row.computeB( constraint ); // Jacobian * objects' inverted mass & inertia tensors
			row.computeD( constraint ); // Length of Jacobian
			row.computeEta( constraint ); // Amount of work needed to be done by this constraint
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.resolveContacts = function( time_step ) {
	var iteration, constraint, row,
		i, delta_impulse, max_impulse = 0;

	// Solve penetrations
	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < this.contact_constraints.length; i++ ) {
			constraint = this.contact_constraints[i];
			row = constraint.rows[0];

			var push_dot_n_a =
				row.jacobian[0] * constraint.object_a.push_velocity[0] +
				row.jacobian[1] * constraint.object_a.push_velocity[1] +
				row.jacobian[2] * constraint.object_a.push_velocity[2] +
				row.jacobian[4] * constraint.object_a.turn_velocity[1] +
				row.jacobian[3] * constraint.object_a.turn_velocity[0] +
				row.jacobian[5] * constraint.object_a.turn_velocity[2];

			var push_dot_n_b =
				row.jacobian[6] * constraint.object_b.push_velocity[0] +
				row.jacobian[7] * constraint.object_b.push_velocity[1] +
				row.jacobian[8] * constraint.object_b.push_velocity[2] +
				row.jacobian[9] * constraint.object_b.turn_velocity[0] +
				row.jacobian[10] * constraint.object_b.turn_velocity[1] +
				row.jacobian[11] * constraint.object_b.turn_velocity[2];

			delta_impulse = ( constraint.contact.penetration_depth - ( push_dot_n_a + push_dot_n_b ) ) / row.D;

			var cache = row.applied_push_impulse;
			row.applied_push_impulse = Math.max(
				row.lower_limit,
				Math.min(
					cache + delta_impulse,
					row.upper_limit
				)
			);
			delta_impulse = row.applied_push_impulse - cache;
			max_impulse = Math.max( max_impulse, delta_impulse );

			constraint.object_a.push_velocity[0] += row.B[0] * delta_impulse;
			constraint.object_a.push_velocity[1] += row.B[1] * delta_impulse;
			constraint.object_a.push_velocity[2] += row.B[2] * delta_impulse;
			constraint.object_a.turn_velocity[0] += row.B[3] * delta_impulse;
			constraint.object_a.turn_velocity[1] += row.B[4] * delta_impulse;
			constraint.object_a.turn_velocity[2] += row.B[5] * delta_impulse;

			constraint.object_b.push_velocity[0] += row.B[6] * delta_impulse;
			constraint.object_b.push_velocity[1] += row.B[7] * delta_impulse;
			constraint.object_b.push_velocity[2] += row.B[8] * delta_impulse;
			constraint.object_b.turn_velocity[0] += row.B[9] * delta_impulse;
			constraint.object_b.turn_velocity[1] += row.B[10] * delta_impulse;
			constraint.object_b.turn_velocity[2] += row.B[11] * delta_impulse;
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}

	// Apply position/rotation solver
	var half_dt = time_step * 0.5;
	for ( i = 0; i < this.contact_constraints.length; i++ ) {
		constraint = this.contact_constraints[i];
		row = constraint.rows[0];

		var multiplier = row.applied_push_impulse;

		if ( constraint.object_a.mass !== Infinity ) {
			_tmp_vec3_1[0] = row.B[0] * multiplier;
			_tmp_vec3_1[1] = row.B[1] * multiplier;
			_tmp_vec3_1[2] = row.B[2] * multiplier;
			vec3.add( constraint.object_a.linear_velocity, _tmp_vec3_1 );
			vec3.scale( _tmp_vec3_1, this.relaxation );
			vec3.add( constraint.object_a.position, _tmp_vec3_1 );

			_tmp_vec3_1[0] = row.B[3] * multiplier;
			_tmp_vec3_1[1] = row.B[4] * multiplier;
			_tmp_vec3_1[2] = row.B[5] * multiplier;
			//vec3.add( constraint.object_a.angular_velocity, _tmp_vec3_1 );

			// Update rotation
			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_a.rotation );

			constraint.object_a.rotation[0] += half_dt * _tmp_quat4_1[0];
			constraint.object_a.rotation[1] += half_dt * _tmp_quat4_1[1];
			constraint.object_a.rotation[2] += half_dt * _tmp_quat4_1[2];
			constraint.object_a.rotation[3] += half_dt * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_a.rotation );
		}

		if ( constraint.object_b.mass !== Infinity ) {
			_tmp_vec3_1[0] = row.B[6] * multiplier;
			_tmp_vec3_1[1] = row.B[7] * multiplier;
			_tmp_vec3_1[2] = row.B[8] * multiplier;
			vec3.add( constraint.object_b.linear_velocity, _tmp_vec3_1 );
			vec3.scale( _tmp_vec3_1, this.relaxation );
			vec3.add( constraint.object_b.position, _tmp_vec3_1 );

			_tmp_vec3_1[0] = row.B[9] * multiplier;
			_tmp_vec3_1[1] = row.B[10] * multiplier;
			_tmp_vec3_1[2] = row.B[11] * multiplier;
			//vec3.add( constraint.object_b.angular_velocity, _tmp_vec3_1 );

			// Update rotation
			_tmp_quat4_1[0] = _tmp_vec3_1[0];
			_tmp_quat4_1[1] = _tmp_vec3_1[1];
			_tmp_quat4_1[2] = _tmp_vec3_1[2];
			_tmp_quat4_1[3] = 0;
			quat4.multiply( _tmp_quat4_1, constraint.object_b.rotation );

			constraint.object_b.rotation[0] += half_dt * _tmp_quat4_1[0];
			constraint.object_b.rotation[1] += half_dt * _tmp_quat4_1[1];
			constraint.object_b.rotation[2] += half_dt * _tmp_quat4_1[2];
			constraint.object_b.rotation[3] += half_dt * _tmp_quat4_1[3];
			quat4.normalize( constraint.object_b.rotation );
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.solveConstraints = function() {
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

				// How much does the current solver impulse match this constraint
				jdot = 0;
				if ( constraint.object_a && constraint.object_a.mass !== Infinity ) {
					jdot +=
						row.jacobian[0] * constraint.object_a.solver_impulse[0] +
						row.jacobian[1] * constraint.object_a.solver_impulse[1] +
						row.jacobian[2] * constraint.object_a.solver_impulse[2] +
						row.jacobian[3] * constraint.object_a.solver_impulse[3] +
						row.jacobian[4] * constraint.object_a.solver_impulse[4] +
						row.jacobian[5] * constraint.object_a.solver_impulse[5];
				}
				if ( constraint.object_b && constraint.object_b.mass !== Infinity ) {
					jdot +=
						row.jacobian[6] * constraint.object_b.solver_impulse[0] +
						row.jacobian[7] * constraint.object_b.solver_impulse[1] +
						row.jacobian[8] * constraint.object_b.solver_impulse[2] +
						row.jacobian[9] * constraint.object_b.solver_impulse[3] +
						row.jacobian[10] * constraint.object_b.solver_impulse[4] +
						row.jacobian[11] * constraint.object_b.solver_impulse[5];
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

Goblin.SequentialImpulseSolver.prototype.applyConstraints = function() {
	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j,
		multiplier;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];
			multiplier = row.multiplier;

			if ( constraint.object_a.mass !== Infinity ) {
				_tmp_vec3_1[0] = row.B[0] * multiplier;
				_tmp_vec3_1[1] = row.B[1] * multiplier;
				_tmp_vec3_1[2] = row.B[2] * multiplier;
				vec3.add( constraint.object_a.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row.B[3] * multiplier;
				_tmp_vec3_1[1] = row.B[4] * multiplier;
				_tmp_vec3_1[2] = row.B[5] * multiplier;
				vec3.add( constraint.object_a.angular_velocity, _tmp_vec3_1 );
			}

			if ( constraint.object_b.mass !== Infinity ) {
				_tmp_vec3_1[0] = row.B[6] * multiplier;
				_tmp_vec3_1[1] = row.B[7] * multiplier;
				_tmp_vec3_1[2] = row.B[8] * multiplier;
				vec3.add( constraint.object_b.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row.B[9] * multiplier;
				_tmp_vec3_1[1] = row.B[10] * multiplier;
				_tmp_vec3_1[2] = row.B[11] * multiplier;
				vec3.add( constraint.object_b.angular_velocity, _tmp_vec3_1 );
			}
		}
	}
};