/**
 * Manages the physics simulation
 *
 * @class World
 * @param broadphase {Goblin.Broadphase} the broadphase used by the world to find possible contacts
 * @param narrowphase {Goblin.NarrowPhase} the narrowphase used by the world to generate valid contacts
 * @constructor
 */
Goblin.World = function( broadphase, narrowphase, solver ) {
	/**
	 * How many time steps have been simulated. If the steps are always the same length then total simulation time = world.ticks * time_step
	 *
	 * @property ticks
	 * @type {number}
	 */
	this.ticks = 0;

	/**
	 * The broadphase used by the world to find possible contacts
	 *
	 * @property broadphase
	 * @type {Goblin.Broadphase}
	 */
	this.broadphase = broadphase;

	/**
	 * The narrowphase used by the world to generate valid contacts
	 *
	 * @property narrowphasee
	 * @type {Goblin.NarrowPhase}
	 */
	this.narrowphase = narrowphase;

	/**
	 * The contact solver used by the world to calculate and apply impulses resulting from contacts
	 *
	 * @property solver
	 */
	this.solver = solver;
	solver.world = this;

	/**
	 * Array of rigid bodies in the world
	 *
	 * @property rigid_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.rigid_bodies = [];

	/**
	 * Array of ghost bodies in the world
	 *
	 * @property ghost_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.ghost_bodies = [];

	/**
	* the world's gravity, applied by default to all objects in the world
	*
	* @property gravity
	* @type {vec3}
	* @default [ 0, -9.8, 0 ]
	*/
	this.gravity = new Goblin.Vector3( 0, -9.8, 0 );

	/**
	 * array of force generators in the world
	 *
	 * @property force_generators
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.force_generators = [];

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.World );

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
		this.ticks++;
        delta = Math.min( max_step, time_delta );
        time_delta -= max_step;

		this.emit( 'stepStart', this.ticks, delta );

        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            this.rigid_bodies[i].updateDerived();
        }

        // Apply gravity
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];

            // Objects of infinite mass don't move
            if ( body._mass !== Infinity ) {
				_tmp_vec3_1.scaleVector( body.gravity || this.gravity, body._mass * delta );
                body.accumulated_force.add( _tmp_vec3_1 );
            }
        }

        // Apply force generators
        for ( i = 0, loop_count = this.force_generators.length; i < loop_count; i++ ) {
            this.force_generators[i].applyForce();
        }

        // Check for contacts, broadphase
        this.broadphase.predictContactPairs();

        // Find valid contacts, narrowphase
        this.narrowphase.generateContacts( this.broadphase.collision_pairs );

        // Process contact manifolds into contact and friction constraints
        this.solver.processContactManifolds( this.narrowphase.contact_manifolds );

        // Prepare the constraints by precomputing some values
        this.solver.prepareConstraints( delta );

        // Resolve contacts
        this.solver.resolveContacts();

        // Run the constraint solver
        this.solver.solveConstraints();

        // Apply the constraints
        this.solver.applyConstraints( delta );

        // Integrate rigid bodies
        for ( i = 0, loop_count = this.rigid_bodies.length; i < loop_count; i++ ) {
            body = this.rigid_bodies[i];
            body.integrate( delta );
        }

		// Uppdate ghost bodies
		for ( i = 0; i < this.ghost_bodies.length; i++ ) {
			body = this.ghost_bodies[i];
			body.checkForEndedContacts();
		}

		this.emit( 'stepEnd', this.ticks, delta );
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
	rigid_body.updateDerived();
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
 * Adds a ghost body to the world
 *
 * @method addGhostBody
 * @param ghost_body {Goblin.GhostBody} ghost body to add to the world
 */
Goblin.World.prototype.addGhostBody = function( ghost_body ) {
	ghost_body.world = this;
	ghost_body.updateDerived();
	this.ghost_bodies.push( ghost_body );
	this.broadphase.addBody( ghost_body );
};

/**
 * Removes a ghost body from the world
 *
 * @method removeGhostBody
 * @param ghost_body {Goblin.GhostBody} ghost body to remove from the world
 */
Goblin.World.prototype.removeGhostBody = function( ghost_body ) {
	for ( var i = 0; i < this.ghost_bodies.length; i++ ) {
		if ( this.ghost_bodies[i] === ghost_body ) {
			this.ghost_bodies.splice( i, 1 );
			this.broadphase.removeBody( ghost_body );
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
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.World.prototype.addConstraint = function( constraint ) {
	this.solver.addConstraint( constraint );
};

/**
 * removes a constraint from the world
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.World.prototype.removeConstraint = function( constraint ) {
	this.solver.removeConstraint( constraint );
};

(function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
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
	Goblin.World.prototype.rayIntersect = function( start, end ) {
		var intersections = this.broadphase.rayIntersect( start, end );
		intersections.sort( tSort );
		return intersections;
	};

	Goblin.World.prototype.shapeIntersect = function( shape, start, end ){
		var swept_shape = new Goblin.LineSweptShape( start, end, shape ),
			swept_body = new Goblin.RigidBody( swept_shape, 0 );
		swept_body.updateDerived();

		var possibilities = this.broadphase.intersectsWith( swept_body ),
			intersections = [];

		for ( var i = 0; i < possibilities.length; i++ ) {
			var contact = this.narrowphase.getContact( swept_body, possibilities[i] );

			if ( contact != null ) {
				var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
				intersection.object = contact.object_b;
				intersection.normal.copy( contact.contact_normal );

				// compute point
				intersection.point.scaleVector( contact.contact_normal, -contact.penetration_depth );
				intersection.point.add( contact.contact_point );

				// compute time
				intersection.t = intersection.point.distanceTo( start );

				intersections.push( intersection );
			}
		}

		intersections.sort( tSort );
		return intersections;
	};
})();