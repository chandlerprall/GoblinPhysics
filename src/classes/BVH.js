(function(){
	function getSurfaceArea( aabb ) {
		var x = aabb.max.x - aabb.min.x,
			y = aabb.max.y - aabb.min.y,
			z = aabb.max.z - aabb.min.z;
		return x * ( y + z ) + y * z;
	}

	/**
	 * Tree node for a BVH
	 *
	 * @class BVHNode
	 * @param [object] {Object} leaf object in the BVH tree
	 * @constructor
	 * @private
	 */
	var BVHNode = function( object ) {
		this.aabb = new Goblin.AABB();
		this.area = 0;

		this.parent = null;
		this.left = null;
		this.right = null;

		this.morton = null;

		this.object = object || null;
	};
	BVHNode.prototype = {
		isLeaf: function() {
			return this.object != null;
		},

		computeBounds: function( global_aabb ) {
			if ( this.isLeaf() ) {
				this.aabb.copy( this.object.aabb );
			} else {
				this.aabb.combineAABBs( this.left.aabb, this.right.aabb );
			}

			this.area = getSurfaceArea( this.aabb );
		},

		valueOf: function() {
			return this.area;
		}
	};

	/**
	 * Bottom-up BVH construction based on "Efficient BVH Construction via Approximate Agglomerative Clustering", Yan Gu 2013
	 *
	 * @Class AAC
	 * @static
	 * @private
	 */
	var AAC = (function(){
		function part1By2( n ) {
			n = ( n ^ ( n << 16 ) ) & 0xff0000ff;
			n = ( n ^ ( n << 8 ) ) & 0x0300f00f;
			n = ( n ^ ( n << 4 ) ) & 0x030c30c3;
			n = ( n ^ ( n << 2 ) ) & 0x09249249;
			return n;
		}
		function morton( x, y, z ) {
			return ( part1By2( z ) << 2 ) + ( part1By2( y ) << 1 ) + part1By2( x );
		}

		var _tmp_aabb = new Goblin.AABB();

		var AAC = function( global_aabb, leaves ) {
			var global_width = global_aabb.max.x - global_aabb.min.x,
				global_height = global_aabb.max.y - global_aabb.min.y,
				global_depth = global_aabb.max.z - global_aabb.min.z,
				max_value = 1 << 9,
				scale_x = max_value / global_width,
				scale_y = max_value / global_height,
				scale_z = max_value / global_depth;

			// Compute the morton code for each leaf
			for ( var i = 0; i < leaves.length; i++ ) {
				var leaf = leaves[i],
					// find center of aabb
					x = ( leaf.aabb.max.x - leaf.aabb.min.x ) / 2 + leaf.aabb.min.x,
					y = ( leaf.aabb.max.y - leaf.aabb.min.y ) / 2 + leaf.aabb.min.y,
					z = ( leaf.aabb.max.z - leaf.aabb.min.z ) / 2 + leaf.aabb.min.z;

				leaf.morton = morton(
					( x + global_aabb.min.x ) * scale_x,
					( y + global_aabb.min.y ) * scale_y,
					( z + global_aabb.min.z ) * scale_z
				);
			}

			// Sort leaves based on morton code
			leaves.sort( AAC.mortonSort );
			var tree = AAC.buildTree( leaves, 29 ); // @TODO smaller starting bit, log4N or log2N or log10N ?
			//var tree = AAC.buildTree( leaves, 20 ); // @TODO smaller starting bit, log4N or log2N or log10N ?
			AAC.combineCluster( tree, 1 );
			return tree;
		};
		AAC.mortonSort = function( a, b ) {
			if ( a.morton < b.morton ) {
				return -1;
			} else if ( a.morton > b.morton ) {
				return 1;
			} else {
				return 0;
			}
		};
		AAC.clusterReductionCount = function( cluster_size ) {
			var c = Math.pow( cluster_size, 0.5 ) / 2,
				a = 0.5;
			return Math.max( c * Math.pow( cluster_size, a ), 1 );
		};
		AAC.buildTree = function( nodes, bit ) {
			var cluster = [];

			if ( nodes.length < AAC.max_bucket_size ) {
				cluster.push.apply( cluster, nodes );
				AAC.combineCluster( cluster, AAC.clusterReductionCount( AAC.max_bucket_size ) );
			} else {
				var left = [],
					right = [];

				if ( bit < 1 ) {
					// no more bits, just cut bucket in half
					left = nodes.slice( 0, nodes.length / 2 );
					right = nodes.slice( nodes.length / 2 );
				} else {
					var bit_value = 1 << bit;
					for ( var i = 0; i < nodes.length; i++ ) {
						var node = nodes[i];
						if ( node.morton & bit_value ) {
							right.push( node );
						} else {
							left.push( node );
						}
					}
				}
				cluster.push.apply( cluster, AAC.buildTree( left, bit - 1 ) );
				cluster.push.apply( cluster, AAC.buildTree( right, bit - 1 ) );
				AAC.combineCluster( cluster, AAC.clusterReductionCount( cluster.length ) );
			}

			return cluster;
		};
		AAC.combineCluster = function( cluster, max_clusters ) {
			if ( cluster.length <= 1 ) {
				return cluster;
			}

			// find the best match for each object
			var merge_queue = new Goblin.MinHeap(),
				merged_node;
			for ( var i = 0; i < cluster.length; i++ ) {
				merged_node = new BVHNode();
				merged_node.left = cluster[i];
				merged_node.right = AAC.findBestMatch( cluster, cluster[i] );
				merged_node.computeBounds();
				merge_queue.push( merged_node );
			}

			var best_cluster;
			while( cluster.length > max_clusters ) {
				best_cluster = merge_queue.pop();
				cluster.splice( cluster.indexOf( best_cluster.left ), 1 );
				cluster.splice( cluster.indexOf( best_cluster.right ), 1 );
				cluster.push( best_cluster );

				// update the merge queue
				// @TODO don't clear the whole heap every time, only need to update any nodes which touched best_cluster.left / best_cluster.right
				merge_queue.heap.length = 0;
				for ( i = 0; i < cluster.length; i++ ) {
					merged_node = new BVHNode();
					merged_node.left = cluster[i];
					merged_node.right = AAC.findBestMatch( cluster, cluster[i] );
					merged_node.computeBounds();
					merge_queue.push( merged_node );
				}
			}
		};
		AAC.findBestMatch = function( cluster, object ) {
			var area,
				best_area = Infinity,
				best_idx = 0;
			for ( var i = 0; i < cluster.length; i++ ) {
				if ( cluster[i] === object ) {
					continue;
				}
				_tmp_aabb.combineAABBs( object.aabb, cluster[i].aabb );
				area = getSurfaceArea( _tmp_aabb );

				if ( area < best_area ) {
					best_area = area;
					best_idx = i;
				}
			}

			return cluster[best_idx];
		};
		AAC.max_bucket_size = 20;
		return AAC;
	})();

	/**
	 * Creates a bounding volume hierarchy around a group of objects which have AABBs
	 *
	 * @class BVH
	 * @param bounded_objects {Array} group of objects to be hierarchized
	 * @constructor
	 */
	Goblin.BVH = function( bounded_objects ) {
		// Create a node for each object
		var leaves = [],
			global_aabb = new Goblin.AABB();

		for ( var i = 0; i < bounded_objects.length; i++ ) {
			global_aabb.combineAABBs( global_aabb, bounded_objects[i].aabb );
			var leaf = new BVHNode( bounded_objects[i] );
			leaf.computeBounds();
			leaves.push( leaf );
		}

		this.tree = AAC( global_aabb, leaves )[0];
	};

	Goblin.BVH.AAC = AAC;
})();