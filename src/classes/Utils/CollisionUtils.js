Goblin.CollisionUtils = {};

Goblin.CollisionUtils.canBodiesCollide = function( object_a, object_b ) {
	if ( object_a._mass === Infinity && object_b._mass === Infinity ) {
		// Two static objects aren't considered to be in contact
		return false;
	}

	// Check collision masks
	if ( object_a.collision_mask !== 0 ) {
		if ( ( object_a.collision_mask & 1 ) === 0 ) {
			// object_b must not be in a matching group
			if ( ( object_a.collision_mask & object_b.collision_groups ) !== 0 ) {
				return false;
			}
		} else {
			// object_b must be in a matching group
			if ( ( object_a.collision_mask & object_b.collision_groups ) === 0 ) {
				return false;
			}
		}
	}
	if ( object_b.collision_mask !== 0 ) {
		if ( ( object_b.collision_mask & 1 ) === 0 ) {
			// object_a must not be in a matching group
			if ( ( object_b.collision_mask & object_a.collision_groups ) !== 0 ) {
				return false;
			}
		} else {
			// object_a must be in a matching group
			if ( ( object_b.collision_mask & object_a.collision_groups ) === 0 ) {
				return false;
			}
		}
	}

	return true;
};