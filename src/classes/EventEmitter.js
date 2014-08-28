Goblin.EventEmitter = function() {
	this.events = {};
};

Goblin.EventEmitter.prototype.addListener = function( event, listener ) {
	if ( this.events[event] === undefined ) {
		this.events[event] = [];
	}

	if ( this.events[event].indexOf( listener ) === -1 ) {
		this.events[event].push( listener );
	}
};

Goblin.EventEmitter.prototype.removeListener = function( event, listener ) {
	if ( this.events[event] === undefined ) {
		this.events[event] = [];
	}

	var index = this.events[event].indexOf( listener );
	if ( index !== -1 ) {
		this.events[event].splice( index, 1 );
	}
};

Goblin.EventEmitter.prototype.emit = function( event ) {
	var event_arguments = Array.prototype.slice.call( arguments, 1 ),
		ret_value;

	if ( this.events[event] !== undefined ) {
		for ( var i = 0; i < this.events[event].length; i++ ) {
			ret_value = this.events[event][i].apply( this, event_arguments );
			if ( ret_value === false ) {
				return false;
			}
		}
	}
};