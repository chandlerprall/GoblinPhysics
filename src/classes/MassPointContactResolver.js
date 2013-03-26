/**
 * Oversees contact resolution for particles
 *
 * @class MassPointContactResolver
 * @constructor
 * @param iterations {Integer} Number of iterations allowed per frame
 */
Goblin.MassPointContactResolver = function( iterations ) {
	/**
	 * Holds the number of iterations allowed.
	 *
	 * @property iterations
	 * @type {Integer}
	 */
	this['iterations'] = iterations;
};

/**
 * Resolves contacts between MassPoints
 *
 * @method resolveContacts
 * @param contacts {[Goblin.MassPoint]} Array of MassPoint objects to resolve
 * @param duration {Number} Time, in seconds, which this frame simulates
 */
Goblin.MassPointContactResolver.prototype.resolveContacts = function( contacts, duration ) {
	var iterations_used = 0,
		max_iterations = this['iterations'] || contacts.length * 2,
		num_contacts = contacts.length,
		max, max_index, i,
		separation_velocity;

	while( iterations_used++ < max_iterations ) {
		// Find the contact with the largest closing velocity;
		max = 0;
		max_index = -1;
		for ( i = 0; i < num_contacts; i++ ) {
			separation_velocity = contacts[i].calculateSeparatingVelocity();
			if ( separation_velocity < max ) {
				max = separation_velocity;
				max_index = i;
			}
		}

		// Resolve this contact.
		if ( max_index !== -1 ) {
			contacts[max_index].resolve( duration );
		}
	}
};

// mappings for closure compiler
Goblin['MassPointContactResolver'] = Goblin.MassPointContactResolver;