(function(){
	Goblin.MinHeap = function( array ) {
		this.heap = array == null ? [] : array.slice();

		if ( this.heap.length > 0 ) {
			this.heapify();
		}
	};
	Goblin.MinHeap.prototype = {
		heapify: function() {
			var start = ~~( ( this.heap.length - 2 ) / 2 );
			while ( start >= 0 ) {
				this.siftUp( start, this.heap.length - 1 );
				start--;
			}
		},
		siftUp: function( start, end ) {
			var root = start;

			while ( root * 2 + 1 <= end ) {
				var child = root * 2 + 1;

				if ( child + 1 <= end && this.heap[child + 1].valueOf() < this.heap[child].valueOf() ) {
					child++;
				}

				if ( this.heap[child].valueOf() < this.heap[root].valueOf() ) {
					var tmp = this.heap[child];
					this.heap[child] = this.heap[root];
					this.heap[root] = tmp;
					root = child;
				} else {
					return;
				}
			}
		},
		push: function( item ) {
			this.heap.push( item );

			var root = this.heap.length - 1;
			while ( root !== 0 ) {
				var parent = ~~( ( root - 1 ) / 2 );

				if ( this.heap[parent].valueOf() > this.heap[root].valueOf() ) {
					var tmp = this.heap[parent];
					this.heap[parent] = this.heap[root];
					this.heap[root] = tmp;
				}

				root = parent;
			}
		},
		peek: function() {
			return this.heap.length > 0 ? this.heap[0] : null;
		},
		pop: function() {
			var entry = this.heap[0];
			this.heap[0] = this.heap[this.heap.length - 1];
			this.heap.length = this.heap.length - 1;
			this.siftUp( 0, this.heap.length - 1 );

			return entry;
		}
	};
})();