/**
 * Manages the physics simulation
 *
 * @class World
 * @param broadphase {Goblin.Broadphase} the broadphase used by the world to find possible contacts
 * @param nearphase {Goblin.NearPhase} the nearphase used by the world to generate valid contacts
 * @constructor
 */
Goblin.World = function( broadphase, nearphase, solver ) {
	/**
	 * The broadphase used by the world to find possible contacts
	 *
	 * @property broadphase
	 * @type {Goblin.Broadphase}
	 */
	this.broadphase = broadphase;

	/**
	 * The nearphase used by the world to generate valid contacts
	 *
	 * @property nearphasee
	 * @type {Goblin.NearPhase}
	 */
	this.nearphase = nearphase;

	/**
	 * The contact solver used by the world to calculate and apply impulses resulting from contacts
	 *
	 * @property solver
	 */
	this.solver = solver;

	/**
	 * Array of mass_points in the world
	 *
	 * @property mass_points
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.mass_points = [];

	/**
	 * Array of rigid_bodies in the world
	 *
	 * @property rigid_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.rigid_bodies = [];

	/**
	* the world's gravity, applied by default to all objects in the world
	*
	* @property gravity
	* @type {vec3}
	* @default [ 0, -9.8, 0 ]
	*/
	this.gravity = vec3.createFrom( 0, -9.8, 0 );

	/**
	 * array of force generators in the world
	 *
	 * @property force_generators
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.force_generators = [];

	/**
	 * array of constraints in the world
	 *
	 * @property constraints
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.constraints = [];
};
/**
* Steps the physics simulation according to the time delta
*
* @method step
* @param time_delta {Number} amount of time to simulate, in seconds
* @param [max_step] {Number} maximum time step size, in seconds
*/
Goblin.World.prototype.step = function( time_delta, max_step ) {
    max_step = max_step || time_delta;

	var x, delta, time_loops,
        i, loop_count, body;

    time_loops = time_delta / max_step;
    for ( x = 0; x < time_loops; x++ ) {
        delta = Math.min( max_step, time_delta );
        time_delta -= max_step;

        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            this.rigid_bodies[i].updateDerived();
        }

        // Apply gravity
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];

            // Objects of infinite mass don't move
            if ( body.mass !== Infinity ) {
                vec3.scale( body.gravity || this.gravity, body.mass * delta, _tmp_vec3_1 );
                vec3.add( body.accumulated_force, _tmp_vec3_1 );
            }
        }

        // Apply force generators
        for ( i = 0, loop_count = this.force_generators.length; i < loop_count; i++ ) {
            this.force_generators[i].applyForce();
        }

        // Check for contacts, broadphase
        this.broadphase.predictContactPairs();

        // Find valid contacts, nearphase
        this.nearphase.generateContacts( this.broadphase.collision_pairs );

        // Process contact manifolds into contact and friction constraints
        this.solver.processContactManifolds( this.nearphase.contact_manifolds );

        // Prepare the constraints by precomputing some values
        this.solver.prepareConstraints();

        // Resolve contacts
        this.solver.resolveContacts( delta );

        // Run the constraint solver
        this.solver.solveConstraints();

        // Apply the constraints
        this.solver.applyConstraints();

        // Integrate rigid bodies
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];
            body.integrate( delta );
        }
    }
};

/**
 * Adds a rigid body to the world
 *
 * @method addRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to add to the world
 */
Goblin.World.prototype.addRigidBody = function( rigid_body ) {
	rigid_body.world = this;
	this.rigid_bodies.push( rigid_body );
	this.broadphase.addBody( rigid_body );
};

/**
 * Removes a rigid body from the world
 *
 * @method removeRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to remove from the world
 */
Goblin.World.prototype.removeRigidBody = function( rigid_body ) {
	var i,
		rigid_body_count = this.rigid_bodies.length;

	for ( i = 0; i < rigid_body_count; i++ ) {
		if ( this.rigid_bodies[i] === rigid_body ) {
			this.rigid_bodies.splice( i, 1 );
			this.broadphase.removeBody( rigid_body );
			break;
		}
	}
};

/**
 * Adds a force generator to the world
 *
 * @method addForceGenerator
 * @param force_generator {Goblin.ForceGenerator} force generator object to be added
 */
Goblin.World.prototype.addForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	// Make sure this generator isn't already in the world
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			return;
		}
	}

	this.force_generators.push( force_generator );
};

/**
 * removes a force generator from the world
 *
 * @method removeForceGenerator
 * @param force_generatorv {Goblin.ForceGenerator} force generator object to be removed
 */
Goblin.World.prototype.removeForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			this.force_generators.splice( i, 1 );
			return;
		}
	}
};

/**
 * adds a constraint to the world
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint object to be added
 */
Goblin.World.prototype.addConstraint = function( constraint ) {
	var i, constraints_count;
	// Make sure this constraint isn't already in the world
	for ( i = 0, constraints_count = this.constraints.length; i < constraints_count; i++ ) {
		if ( this.constraints[i] === constraint ) {
			return;
		}
	}

	constraint.world = this;
	this.constraints.push( constraint );
};

/**
 * removes a constraint from the world
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint object to be removed
 */
Goblin.World.prototype.removeConstraint = function( constraint ) {
	var i, constraints_count;
	for ( i = 0, constraints_count = this.constraints.length; i < constraints_count; i++ ) {
		if ( this.constraints[i] === constraint ) {
			this.constraints.splice( i, 1 );
			return;
		}
	}
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {Array<RayIntersection>} an array of intersections, sorted by distance from `start`
 */
Goblin.World.prototype.rayIntersect = (function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
		}
	};
	return function( start, end ) {
		var intersections = this.broadphase.rayIntersect( start, end );
		intersections.sort( tSort );
		return intersections;
	};
})();