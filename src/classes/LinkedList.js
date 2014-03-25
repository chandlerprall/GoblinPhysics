Goblin.LinkedList = function() {
	this.first = null;
};

Goblin.LinkedList.prototype.add = function( entry ) {
	// Unordered list, just add the entry to the front
	if ( this.first == null ) {
		this.first = entry;
	} else {
		this.first.prev = entry;
		entry.next = this.first;
		this.first = entry;
	}
};

Goblin.LinkedList.prototype.remove = function( value ) {
	var entry;

	while ( entry = this.first ) {
		if ( entry.value === value ) {
			if ( entry.prev ) {
				entry.prev = entry.next;
			}
			if ( entry.next ) {
				entry.next = entry.prev;
			}

			return;
		}
		entry = entry.next;
	}
};

Goblin.LinkedListEntry = function( value ) {
	this.value = value;

	this.prev = null;
	this.next = null;
};