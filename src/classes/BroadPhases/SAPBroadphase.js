(function(){
	/**
	 * @class SAPMarker
	 * @private
	 * @param {SAPMarker.TYPES} marker_type
	 * @param {RigidBody} body
	 * @param {Number} position
	 * @constructor
	 */
	var SAPMarker = function( marker_type, body, position ) {
		this.type = marker_type;
		this.body = body;
		this.position = position;
		
		this.prev = null;
		this.next = null;
	};
	SAPMarker.TYPES = {
		START: 0,
		END: 1
	};

	var LinkedList = function() {
		this.first = null;
		this.last = null;
	};

	/**
	 * Sweep and Prune broadphase
	 *
	 * @class SAPBroadphase
	 * @constructor
	 */
	Goblin.SAPBroadphase = function() {
		/**
		 * linked list of the start/end markers along the X axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_x = new LinkedList();

		/**
		 * linked list of the start/end markers along the Y axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_y = new LinkedList();

		/**
		 * linked list of the start/end markers along the Z axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_z = new LinkedList();

		/**
		 * maintains count of axis over which two bodies overlap; if count is three, their AABBs touch/penetrate
		 *
		 * @type {Object}
		 */
		this.overlap_counter = {};

		/**
		 * array of all (current) collision pairs between the broadphases' bodies
		 *
		 * @property collision_pairs
		 * @type {Array}
		 */
		this.collision_pairs = [];

		/**
		 * array of bodies which have been added to the broadphase since the last update
		 *
		 * @type {Array<RigidBody>}
		 */
		this.pending_bodies = [];
	};

	Goblin.SAPBroadphase.prototype = {
		incrementOverlaps: function( body_a, body_b ) {
			if( !Goblin.CollisionUtils.canBodiesCollide( body_a, body_b ) ) {
				return;
			}

			var key = body_a.id < body_b.id ? body_a.id + '-' + body_b.id : body_b.id + '-' + body_a.id;

			if ( !this.overlap_counter.hasOwnProperty( key ) ) {
				this.overlap_counter[key] = 0;
			}

			this.overlap_counter[key]++;

			if ( this.overlap_counter[key] === 3 ) {
				// The AABBs are touching, add to potential contacts
				this.collision_pairs.push([ body_a.id < body_b.id ? body_a : body_b, body_a.id < body_b.id ? body_b : body_a ]);
			}
		},

		decrementOverlaps: function( body_a, body_b ) {
			var key = body_a.id < body_b.id ? body_a.id + '-' + body_b.id : body_b.id + '-' + body_a.id;

			if ( !this.overlap_counter.hasOwnProperty( key ) ) {
				this.overlap_counter[key] = 0;
			}

			this.overlap_counter[key]--;

			if ( this.overlap_counter[key] === 0 ) {
				delete this.overlap_counter[key];
			} else if ( this.overlap_counter[key] === 2 ) {
				// These are no longer touching, remove from potential contacts
				this.collision_pairs = this.collision_pairs.filter(function( pair ){
					if ( pair[0] === body_a && pair[1] === body_b ) {
						return false;
					}
					if ( pair[0] === body_b && pair[1] === body_a ) {
						return false;
					}
					return true;
				});
			}
		},

		/**
		 * Adds a body to the broadphase for contact checking
		 *
		 * @method addBody
		 * @param body {RigidBody} body to add to the broadphase contact checking
		 */
		addBody: function( body ) {
			this.pending_bodies.push( body );
		},

		removeBody: function( body ) {
			// first, check if the body is pending
			var pending_index = this.pending_bodies.indexOf( body );
			if ( pending_index !== -1 ) {
				this.pending_bodies.splice( pending_index, 1 );
				return;
			}

			// body was already added, find & remove
			var next, prev;
			var marker = this.markers_x.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_x.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_x.first = next;
					}
				}
				marker = marker.next;
			}

			marker = this.markers_y.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_y.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_y.first = next;
					}
				}
				marker = marker.next;
			}

			marker = this.markers_z.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_z.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_z.first = next;
					}
				}
				marker = marker.next;
			}

			// remove any collisions
			this.collision_pairs = this.collision_pairs.filter(function( pair ){
				if ( pair[0] === body || pair[1] === body ) {
					return false;
				}
				return true;
			});
		},

		insertPending: function() {
			var body;
			while ( ( body = this.pending_bodies.pop() ) ) {
				body.updateDerived();
				var start_marker_x = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.x ),
					start_marker_y = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.y ),
					start_marker_z = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.z ),
					end_marker_x = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.x ),
					end_marker_y = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.y ),
					end_marker_z = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.z );

				// Insert these markers, incrementing overlap counter
				this.insert( this.markers_x, start_marker_x );
				this.insert( this.markers_x, end_marker_x );
				this.insert( this.markers_y, start_marker_y );
				this.insert( this.markers_y, end_marker_y );
				this.insert( this.markers_z, start_marker_z );
				this.insert( this.markers_z, end_marker_z );
			}
		},

		insert: function( list, marker ) {
			if ( list.first == null ) {
				list.first = list.last = marker;
			} else {
				// Insert at the end of the list & sort
				marker.prev = list.last;
				list.last.next = marker;
				list.last = marker;
				this.sort( list, marker );
			}
		},

		sort: function( list, marker ) {
			var prev;
			while (
				marker.prev != null &&
				(
					marker.position < marker.prev.position ||
					( marker.position === marker.prev.position && marker.type === SAPMarker.TYPES.START && marker.prev.type === SAPMarker.TYPES.END )
				)
			) {
				prev = marker.prev;

				// check if this swap changes overlap counters
				if ( marker.type !== prev.type ) {
					if ( marker.type === SAPMarker.TYPES.START ) {
						// marker is START, moving into an overlap
						this.incrementOverlaps( marker.body, prev.body );
					} else {
						// marker is END, leaving an overlap
						this.decrementOverlaps( marker.body, prev.body );
					}
				}

				marker.prev = prev.prev;
				prev.next = marker.next;

				marker.next = prev;
				prev.prev = marker;

				if ( marker.prev == null ) {
					list.first = marker;
				} else {
					marker.prev.next = marker;
				}
				if ( prev.next == null ) {
					list.last = prev;
				} else {
					prev.next.prev = prev;
				}
			}
		},

		/**
		 * Updates the broadphase's internal representation and current predicted contacts
		 *
		 * @method update
		 */
		update: function() {
			this.insertPending();

			var marker = this.markers_x.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.x;
				} else {
					marker.position = marker.body.aabb.max.x;
				}
				this.sort( this.markers_x, marker );
				marker = marker.next;
			}

			marker = this.markers_y.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.y;
				} else {
					marker.position = marker.body.aabb.max.y;
				}
				this.sort( this.markers_y, marker );
				marker = marker.next;
			}

			marker = this.markers_z.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.z;
				} else {
					marker.position = marker.body.aabb.max.z;
				}
				this.sort( this.markers_z, marker );
				marker = marker.next;
			}
		},

		/**
		 * Returns an array of objects the given body may be colliding with
		 *
		 * @method intersectsWith
		 * @param body {RigidBody}
		 * @return Array<RigidBody>
		 */
		intersectsWith: function( body ) {
			this.addBody( body );
			this.update();

			var possibilities = this.collision_pairs.filter(function( pair ){
				if ( pair[0] === body || pair[1] === body ) {
					return true;
				}
				return false;
			}).map(function( pair ){
				return pair[0] === body ? pair[1] : pair[0];
			});

			this.removeBody( body );
			return possibilities;
		},

		/**
		 * Checks if a ray segment intersects with objects in the world
		 *
		 * @method rayIntersect
		 * @property start {vec3} start point of the segment
		 * @property end {vec3{ end point of the segment
         * @return {Array<RayIntersection>} an unsorted array of intersections
		 */
		rayIntersect: function( start, end ) {
			// It's assumed that raytracing will be performed through a proxy like Goblin.World,
			// thus that the only time this broadphase cares about updating itself is if an object was added
			if ( this.pending_bodies.length > 0 ) {
				this.update();
			}

			// This implementation only scans the X axis because the overall process gets slower the more axes you add
			// thanks JavaScript

			var active_bodies = {},
				intersections = [],
				id_body_map = {},
				id_intersection_count = {},
				ordered_start, ordered_end,
				marker, has_encountered_start,
				i, body, key, keys;

			// X axis
			marker = this.markers_x.first;
			has_encountered_start = false;
			active_bodies = {};
			ordered_start = start.x < end.x ? start.x : end.x;
			ordered_end = start.x < end.x ? end.x : start.x;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					active_bodies[marker.body.id] = marker.body;
				}

				if ( marker.position >= ordered_start ) {
					if ( has_encountered_start === false ) {
						has_encountered_start = true;
						keys = Object.keys( active_bodies );
						for ( i = 0; i < keys.length; i++ ) {
							key = keys[i];
							body = active_bodies[key];
							if ( body == null ) { // needed because we don't delete but set to null, see below comment
								continue;
							}
							// The next two lines are piss-slow
							id_body_map[body.id] = body;
							id_intersection_count[body.id] = id_intersection_count[body.id] ? id_intersection_count[body.id] + 1 : 1;
						}
					} else if ( marker.type === SAPMarker.TYPES.START ) {
						// The next two lines are piss-slow
						id_body_map[marker.body.id] = marker.body;
						id_intersection_count[marker.body.id] = id_intersection_count[marker.body.id] ? id_intersection_count[marker.body.id] + 1 : 1;
					}
				}

				if ( marker.type === SAPMarker.TYPES.END ) {
					active_bodies[marker.body.id] = null; // this is massively faster than deleting the association
					//delete active_bodies[marker.body.id];
				}

				if ( marker.position > ordered_end ) {
					// no more intersections to find on this axis
					break;
				}

				marker = marker.next;
			}

			keys = Object.keys( id_intersection_count );
			for ( i = 0; i < keys.length; i++ ) {
				var body_id = keys[i];
				if ( id_intersection_count[body_id] === 1 ) {
					if ( id_body_map[body_id].aabb.testRayIntersect( start, end ) ) {
						id_body_map[body_id].rayIntersect( start, end, intersections );
					}
				}
			}

			return intersections;
		}
	};
})();