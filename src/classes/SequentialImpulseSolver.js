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
	this['contact_constraints'] = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @param friction_constraints
	 * @type {Array}
	 */
	this['friction_constraints'] = [];

	// All constraints being processed
	this.constraints = [];

	// Velocity constraints
	this.C = [];

	// Constraint forces
	this.Fc = [];

	/**
	 * Configuration dictionary
	 *
	 * @submodule SequentialImpulseSolverConfig
	 * @static
	 */
	this['config'] = {

	};
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.SequentialImpulseSolver.prototype.processContactManifolds = function( contact_manifolds, time_step ) {
	var i, j,
		manifold,
		contacts_length,
		contact,
		constraint;

	this['contact_constraints'].length = 0;
	this['friction_constraints'].length = 0;

	manifold = contact_manifolds.first;

	i = 0;
	while( manifold ) {
		i++;
		//if ( i >= 1 ) window.stop = true;
		contacts_length = manifold['points'].length;

		for ( j = 0; j < contacts_length; j++ ) {
			contact = manifold['points'][j];

			if ( contact['penetration_depth'] >= 0 ) {
				// Build contact constraint
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				this['contact_constraints'].push( constraint );

				// Build friction constraint
				constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
				constraint.buildFromContact( contact );
				this['friction_constraints'].push( constraint );
			}
		}

		manifold = manifold.next_manifold;
	}
};

Goblin.SequentialImpulseSolver.prototype.solve = function( time_delta ) {
	// @TODO just for now
	this.constraints = [];
	Array.prototype.push.apply( this.constraints, this['contact_constraints'] );
	Array.prototype.push.apply( this.constraints, this['friction_constraints'] );

	var num_constraints = this.constraints.length,
		constraint,
		num_rows,
		row,
		i, j,
		invmass;

	// Prepare the constraints
	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.constraints[i];
		num_rows = constraint.rows.length;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];

			row['multiplier'] = 0;
			row['applied_push_impulse'] = 0;

			// Compute inverse terms
			if ( constraint['object_a'] != null && constraint.object_a.mass !== Infinity ) {
				invmass = 1 / constraint['object_a']['mass'];
				row['B'][0] = invmass * row['jacobian'][0];
				row['B'][1] = invmass * row['jacobian'][1];
				row['B'][2] = invmass * row['jacobian'][2];

				_tmp_vec3_1[0] = row.jacobian[3];
				_tmp_vec3_1[1] = row.jacobian[4];
				_tmp_vec3_1[2] = row.jacobian[5];
				mat3.multiplyVec3( constraint.object_a.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				row.B[3] = _tmp_vec3_1[0];
				row.B[4] = _tmp_vec3_1[1];
				row.B[5] = _tmp_vec3_1[2];
			} else {
				row['B'][0] = row['B'][1] = row['B'][2] = 0;
				row['B'][3] = row['B'][4] = row['B'][5] = 0;
			}

			if ( constraint['object_b'] != null && constraint.object_b.mass !== Infinity ) {
				invmass = 1 / constraint['object_b']['mass'];
				row['B'][6] = invmass * row['jacobian'][6];
				row['B'][7] = invmass * row['jacobian'][7];
				row['B'][8] = invmass * row['jacobian'][8];

				_tmp_vec3_1[0] = row.jacobian[9];
				_tmp_vec3_1[1] = row.jacobian[10];
				_tmp_vec3_1[2] = row.jacobian[11];
				mat3.multiplyVec3( constraint.object_b.inverseInertiaTensorWorldFrame, _tmp_vec3_1 );
				row.B[9] = _tmp_vec3_1[0];
				row.B[10] = _tmp_vec3_1[1];
				row.B[11] = _tmp_vec3_1[2];
			} else {
				row['B'][6] = row['B'][7] = row['B'][8] = 0;
				row['B'][9] = row['B'][10] = row['B'][11] = 0;
			}

			// Compute `D`
			row['D'] = 0;
			if ( constraint['object_a'] != null ) {
				row['D'] += row['jacobian'][0] * row['B'][0] +
								   row['jacobian'][1] * row['B'][1] +
								   row['jacobian'][2] * row['B'][2] +
								   row['jacobian'][3] * row['B'][3] +
								   row['jacobian'][4] * row['B'][4] +
								   row['jacobian'][5] * row['B'][5];
			}
			if ( constraint['object_b'] != null ) {
				row['D'] += row['jacobian'][6] * row['B'][6] +
								   row['jacobian'][7] * row['B'][7] +
								   row['jacobian'][8] * row['B'][8] +
								   row['jacobian'][9] * row['B'][9] +
								   row['jacobian'][10] * row['B'][10] +
								   row['jacobian'][11] * row['B'][11];
			}
			if ( row['D'] === 0 ) {
				// @TODO this really shouldn't be possible, and introduces NaNs
				row['D'] = 1;
			}

			// Compute `eta` - the amount of work needed this tick
			var invdelta = 1 / time_delta,
				tick_bias = row['bias'],
				eta_row = new Float64Array( 12 );
			if ( constraint['object_a'] != null ) {
				// Compute linear distance traveling this tick
				invmass = 1 / constraint['object_a']['mass'];
				eta_row[0] = ( constraint.object_a.linear_velocity[0] + ( invmass * constraint.object_a.accumulated_force[0] ) );
				eta_row[1] = ( constraint.object_a.linear_velocity[1] + ( invmass * constraint.object_a.accumulated_force[1] ) );
				eta_row[2] = ( constraint.object_a.linear_velocity[2] + ( invmass * constraint.object_a.accumulated_force[2] ) );

				// Compute angular distance traveling this tick
				_tmp_vec3_1[0] = constraint['object_a'].accumulated_torque[0];
				_tmp_vec3_1[1] = constraint['object_a'].accumulated_torque[1];
				_tmp_vec3_1[2] = constraint['object_a'].accumulated_torque[2];
				mat3.multiplyVec3( constraint['object_a']['inverseInertiaTensorWorldFrame'], _tmp_vec3_1 );
				eta_row[3] = ( constraint.object_a.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
				eta_row[4] = ( constraint.object_a.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
				eta_row[5] = ( constraint.object_a.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
			} else {
				eta_row[0] = eta_row[1] = eta_row[2] = eta_row[3] = eta_row[4] = eta_row[5] = 0;
			}
			if ( constraint['object_b'] != null ) {
				invmass = 1 / constraint['object_b']['mass'];
				eta_row[6] = ( constraint.object_b.linear_velocity[0] + ( invmass * constraint.object_b.accumulated_force[0] ) );
				eta_row[7] = ( constraint.object_b.linear_velocity[1] + ( invmass * constraint.object_b.accumulated_force[1] ) );
				eta_row[8] = ( constraint.object_b.linear_velocity[2] + ( invmass * constraint.object_b.accumulated_force[2] ) );

				// Compute angular distance traveling this tick
				_tmp_vec3_1[0] = constraint['object_b'].accumulated_torque[0];
				_tmp_vec3_1[1] = constraint['object_b'].accumulated_torque[1];
				_tmp_vec3_1[2] = constraint['object_b'].accumulated_torque[2];
				mat3.multiplyVec3( constraint['object_b']['inverseInertiaTensorWorldFrame'], _tmp_vec3_1 );
				eta_row[9] = ( constraint.object_b.angular_velocity[0] + ( _tmp_vec3_1[0] ) );
				eta_row[10] = ( constraint.object_b.angular_velocity[1] + ( _tmp_vec3_1[1] ) );
				eta_row[11] = ( constraint.object_b.angular_velocity[2] + ( _tmp_vec3_1[2] ) );
			} else {
				eta_row[6] = eta_row[7] = eta_row[8] = eta_row[9] = eta_row[10] = eta_row[11] = 0;
			}

			var jdotv = row['jacobian'][0] * eta_row[0] +
						row['jacobian'][1] * eta_row[1] +
						row['jacobian'][2] * eta_row[2] +
						row['jacobian'][3] * eta_row[3] +
						row['jacobian'][4] * eta_row[4] +
						row['jacobian'][5] * eta_row[5] +
						row['jacobian'][6] * eta_row[6] +
						row['jacobian'][7] * eta_row[7] +
						row['jacobian'][8] * eta_row[8] +
						row['jacobian'][9] * eta_row[9] +
						row['jacobian'][10] * eta_row[10] +
						row['jacobian'][11] * eta_row[11];
			row['eta'] = ( tick_bias - jdotv );

			//@TODO precompute a=BL
			row['multiplier'] = row['multiplier_cache'] = 0;
		}
	}

	var max_iterations = 10,
		iteration = 0,
		delta_lambda;

	// Solve penetrations
	for ( iteration = 0; iteration < max_iterations; iteration++ ) {
		for ( i = 0; i < this['contact_constraints'].length; i++ ) {
			constraint = this['contact_constraints'][i];
			row = constraint.rows[0];

			var delta_impulse = constraint['contact']['penetration_depth'] - row['applied_push_impulse'];


			_tmp_vec3_1[0] = row['jacobian'][0];
			_tmp_vec3_1[1] = row['jacobian'][1];
			_tmp_vec3_1[2] = row['jacobian'][2];
			_tmp_vec3_2[0] = row['jacobian'][3];
			_tmp_vec3_2[1] = row['jacobian'][4];
			_tmp_vec3_2[2] = row['jacobian'][5];
			var delta_vel1_dot_n = vec3.dot( _tmp_vec3_1, constraint['object_a'].push_velocity ) +
								   vec3.dot( _tmp_vec3_2, constraint['object_a'].turn_velocity );

			_tmp_vec3_1[0] = row['jacobian'][6];
			_tmp_vec3_1[1] = row['jacobian'][7];
			_tmp_vec3_1[2] = row['jacobian'][8];
			_tmp_vec3_2[0] = row['jacobian'][9];
			_tmp_vec3_2[1] = row['jacobian'][10];
			_tmp_vec3_2[2] = row['jacobian'][11];
			var delta_vel2_dot_n = vec3.dot( _tmp_vec3_1, constraint['object_b'].push_velocity ) +
								   vec3.dot( _tmp_vec3_2, constraint['object_b'].turn_velocity );

			//console.debug( delta_vel1_dot_n, delta_vel2_dot_n );

			delta_impulse -= delta_vel1_dot_n;
			delta_impulse -= delta_vel2_dot_n;
			delta_impulse /= row.D;

			//console.debug( delta_impulse );

			var sum = row['applied_push_impulse'] + delta_impulse;
			if (sum < row['lower_limit']) {
				delta_impulse = row['lower_limit'] - row['applied_push_impulse'];
				row['applied_push_impulse'] = row['lower_limit'];
			} else {
				row['applied_push_impulse'] = sum;
			}

			constraint['object_a']['push_velocity'][0] += row['B'][0] * delta_impulse * constraint['object_a']['linear_damping'][0];
			constraint['object_a']['push_velocity'][1] += row['B'][1] * delta_impulse * constraint['object_a']['linear_damping'][0];
			constraint['object_a']['push_velocity'][2] += row['B'][2] * delta_impulse * constraint['object_a']['linear_damping'][0];
			constraint['object_a']['turn_velocity'][0] += row['B'][3] * delta_impulse * constraint['object_a']['angular_damping'][0];
			constraint['object_a']['turn_velocity'][1] += row['B'][4] * delta_impulse * constraint['object_a']['angular_damping'][0];
			constraint['object_a']['turn_velocity'][2] += row['B'][5] * delta_impulse * constraint['object_a']['angular_damping'][0];


			constraint['object_b']['push_velocity'][0] += row['B'][6] * delta_impulse * constraint['object_b']['linear_damping'][0];
			constraint['object_b']['push_velocity'][1] += row['B'][7] * delta_impulse * constraint['object_b']['linear_damping'][0];
			constraint['object_b']['push_velocity'][2] += row['B'][8] * delta_impulse * constraint['object_b']['linear_damping'][0];
			constraint['object_b']['turn_velocity'][0] += row['B'][9] * delta_impulse * constraint['object_b']['angular_damping'][0];
			constraint['object_b']['turn_velocity'][1] += row['B'][10] * delta_impulse * constraint['object_b']['angular_damping'][0];
			constraint['object_b']['turn_velocity'][2] += row['B'][11] * delta_impulse * constraint['object_b']['angular_damping'][0];
		}
	}

	// Apply position/rotation solver
	for ( i = 0; i < this['contact_constraints'].length; i++ ) {
		constraint = this['contact_constraints'][i];
		row = constraint.rows[0];

		/*vec3.scale( constraint.object_a.turn_velocity, 1, _tmp_vec3_1 ); // Apply ERP to angular velocity

		var axis = vec3.create(),
			fAngle = vec3.length( _tmp_vec3_1 );

		//limit the angular motion
		var ANGULAR_MOTION_THRESHOLD = 0.25 * Math.PI;
		if ( fAngle * time_delta > ANGULAR_MOTION_THRESHOLD ) {
			fAngle = ANGULAR_MOTION_THRESHOLD / time_delta;
		}

		if ( fAngle < 0.001 )
		{
			// use Taylor's expansions of sync function
			vec3.scale(
				_tmp_vec3_1,
				0.5 * time_delta -
				( time_delta * time_delta * time_delta) *
				( 0.020833333333 ) * fAngle * fAngle,
				axis
			);
		}
		else
		{
			vec3.scale(
				_tmp_vec3_1,
				Math.sin( 0.5 * fAngle * time_delta ) / fAngle,
				axis
			);
		}

		var dorn = quat4.createFrom( axis[0], axis[1], axis[2], Math.cos( fAngle * time_delta * 0.5 ) );

		quat4.multiply( dorn, constraint.object_a.rotation, constraint.object_a.rotation );
		quat4.normalize( constraint.object_a.rotation );*/

		//vec3.scale( constraint['object_a'].push_velocity, 0.2 );
		//vec3.scale( constraint['object_a'].turn_velocity, 0.1 );
		//console.debug( constraint.object_a.push_velocity[0], constraint.object_a.push_velocity[1], constraint.object_a.push_velocity[2] );
		vec3.add( constraint['object_a']['position'], constraint['object_a'].push_velocity );
		vec3.add( constraint['object_a']['angular_velocity'], constraint['object_a'].turn_velocity );
		constraint['object_a']['push_velocity'][0] = constraint['object_a']['push_velocity'][1] = constraint['object_a']['push_velocity'][2] = 0;
		constraint['object_a']['turn_velocity'][0] = constraint['object_a']['turn_velocity'][1] = constraint['object_a']['turn_velocity'][2] = 0;

		//vec3.scale( constraint['object_b'].push_velocity, 0.5 );
		//vec3.scale( constraint['object_b'].turn_velocity, 0.2 );
		vec3.add( constraint['object_b']['position'], constraint['object_b'].push_velocity );
		vec3.add( constraint['object_b']['angular_velocity'], constraint['object_b'].turn_velocity );
		constraint['object_b']['push_velocity'][0] = constraint['object_b']['push_velocity'][1] = constraint['object_b']['push_velocity'][2] = 0;
		constraint['object_b']['turn_velocity'][0] = constraint['object_b']['turn_velocity'][1] = constraint['object_b']['turn_velocity'][2] = 0;
	}

	// Solve impulses
	for ( iteration = 0; iteration < max_iterations; iteration++ ) {
		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.constraints[i];

			num_rows = constraint.rows.length;
			for ( j = 0; j < num_rows; j++ ) {

				row = constraint.rows[j];

				var dot1 = row['jacobian'][0] * constraint['object_a'].solver_impulse[0] +
						   row['jacobian'][1] * constraint['object_a'].solver_impulse[1] +
						   row['jacobian'][2] * constraint['object_a'].solver_impulse[2] +
						   row['jacobian'][3] * constraint['object_a'].solver_impulse[3] +
						   row['jacobian'][4] * constraint['object_a'].solver_impulse[4] +
						   row['jacobian'][5] * constraint['object_a'].solver_impulse[5];
				var dot2 = row['jacobian'][6] * constraint['object_b'].solver_impulse[0] +
						   row['jacobian'][7] * constraint['object_b'].solver_impulse[1] +
						   row['jacobian'][8] * constraint['object_b'].solver_impulse[2] +
						   row['jacobian'][9] * constraint['object_b'].solver_impulse[3] +
						   row['jacobian'][10] * constraint['object_b'].solver_impulse[4] +
						   row['jacobian'][11] * constraint['object_b'].solver_impulse[5];

				delta_lambda = ( row['eta'] - dot1 - dot2 ) / row['D'];

				row['multiplier_cache'] = row['multiplier'];
				row['multiplier'] = Math.max(
					row['lower_limit'],
					Math.min(
						row['multiplier_cache'] + delta_lambda,
						row['upper_limit']
					)
				);
				delta_lambda = row['multiplier'] - row['multiplier_cache'];

				constraint['object_a'].solver_impulse[0] += delta_lambda * row['B'][0];
				constraint['object_a'].solver_impulse[1] += delta_lambda * row['B'][1];
				constraint['object_a'].solver_impulse[2] += delta_lambda * row['B'][2];
				constraint['object_a'].solver_impulse[3] += delta_lambda * row['B'][3];
				constraint['object_a'].solver_impulse[4] += delta_lambda * row['B'][4];
				constraint['object_a'].solver_impulse[5] += delta_lambda * row['B'][5];
				constraint['object_b'].solver_impulse[0] += delta_lambda * row['B'][6];
				constraint['object_b'].solver_impulse[1] += delta_lambda * row['B'][7];
				constraint['object_b'].solver_impulse[2] += delta_lambda * row['B'][8];
				constraint['object_b'].solver_impulse[3] += delta_lambda * row['B'][9];
				constraint['object_b'].solver_impulse[4] += delta_lambda * row['B'][10];
				constraint['object_b'].solver_impulse[5] += delta_lambda * row['B'][11];

			}
		}
	}
};

Goblin.SequentialImpulseSolver.prototype.apply = function( time_delta ) {
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

			if ( constraint['object_a']['mass'] !== Infinity ) {
				_tmp_vec3_1[0] = row['B'][0] * multiplier;
				_tmp_vec3_1[1] = row['B'][1] * multiplier;
				_tmp_vec3_1[2] = row['B'][2] * multiplier;
				//vec3.scale( _tmp_vec3_1, row['object_a']['mass'] );
				//vec3.add( constraint['object_a'].accumulated_force, _tmp_vec3_1 );
				//console.debug( _tmp_vec3_1[0], _tmp_vec3_1[1], _tmp_vec3_1[2] );
				vec3.add( constraint.object_a.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row['B'][3] * multiplier;
				_tmp_vec3_1[1] = row['B'][4] * multiplier;
				_tmp_vec3_1[2] = row['B'][5] * multiplier;
				//mat3.multiplyVec3( constraint['object_a']['inertiaTensorWorldFrame'], _tmp_vec3_1 );
				//vec3.add( constraint['object_a'].accumulated_torque, _tmp_vec3_1 );
				//vec3.scale( _tmp_vec3_1, 60 );
				//console.debug( _tmp_vec3_1[0], _tmp_vec3_1[1], _tmp_vec3_1[2] );
				vec3.add( constraint.object_a.angular_velocity, _tmp_vec3_1 );
			}

			if ( constraint['object_b']['mass'] !== Infinity ) {
				_tmp_vec3_1[0] = row['B'][6] * multiplier;
				_tmp_vec3_1[1] = row['B'][7] * multiplier;
				_tmp_vec3_1[2] = row['B'][8] * multiplier;
				/*vec3.scale( _tmp_vec3_1, constraint['object_b']['mass'] );
				vec3.add( constraint['object_b'].accumulated_force, _tmp_vec3_1 );*/
				vec3.add( constraint.object_b.linear_velocity, _tmp_vec3_1 );

				_tmp_vec3_1[0] = row['B'][9] * multiplier;
				_tmp_vec3_1[1] = row['B'][10] * multiplier;
				_tmp_vec3_1[2] = row['B'][11] * multiplier;
				/*mat3.multiplyVec3( constraint['object_a']['inertiaTensorWorldFrame'], _tmp_vec3_1 );
				vec3.add( constraint['object_b'].accumulated_torque, _tmp_vec3_1 );*/
				vec3.add( constraint.object_b.angular_velocity, _tmp_vec3_1 );
			}
		}
	}
};

/**
 * Applies a body's anisotropic friction
 *
 * @method applyAnisotropicFriction
 * @param object
 * @param friction_direction
 * @static
 * @private
 */
Goblin.SequentialImpulseSolver.applyAnisotropicFriction = function( object, friction_direction ) {
	var anisotropic_friction = object['anisotropic_friction'];

	if ( anisotropic_friction[0] === anisotropic_friction[1] === anisotropic_friction[2] === 1.0 ) {
		// @TODO transform `anisotropic_friction` to world coordinates and apply to avoid two transforms

		// transform to local coordinates
		mat4.multiplyVec3( object['transform_inverse'], friction_direction, _tmp_vec3_1 );

		//apply anisotropic friction
		vec3.multiply( _tmp_vec3_1, anisotropic_friction );

		// ... and transform it back to global coordinates
		mat4.multiplyVec( object['transform'], _tmp_vec3_1, friction_direction );
	}
};

// mappings for closure compiler
Goblin['SequentialImpulseSolver'] = Goblin.SequentialImpulseSolver;
Goblin.SequentialImpulseSolver.prototype['processContactManifolds'] = Goblin.SequentialImpulseSolver.prototype.processContactManifolds;
Goblin.SequentialImpulseSolver.prototype['solve'] = Goblin.SequentialImpulseSolver.prototype.solve;
Goblin.SequentialImpulseSolver.prototype['apply'] = Goblin.SequentialImpulseSolver.prototype.apply;