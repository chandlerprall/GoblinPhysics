Goblin.EventEmitter = function(){};

Goblin.EventEmitter.prototype = {
	addListener: function( event, listener ) {
		if ( this.listeners[event] == null ) {
			this.listeners[event] = [];
		}

		if ( this.listeners[event].indexOf( listener ) === -1 ) {
			this.listeners[event].push( listener );
		}
	},

	removeListener: function( event, listener ) {
		if ( this.listeners[event] == null ) {
			this.listeners[event] = [];
		}

		var index = this.listeners[event].indexOf( listener );
		if ( index !== -1 ) {
			this.listeners[event].splice( index, 1 );
		}
	},

	removeAllListeners: function() {
		var listeners = Object.keys( this.listeners );
		for ( var i = 0; i < listeners.length; i++ ) {
			this.listeners[listeners[i]].length = 0;
		}
	},

	emit: function( event ) {
		var event_arguments = Array.prototype.slice.call( arguments, 1 ),
			ret_value;

		if ( this.listeners[event] instanceof Array ) {
			var listeners = this.listeners[event].slice();
			for ( var i = 0; i < listeners.length; i++ ) {
				ret_value = listeners[i].apply( this, event_arguments );
				if ( ret_value === false ) {
					return false;
				}
			}
		}
	}
};

Goblin.EventEmitter.apply = function( klass ) {
	klass.prototype.addListener = Goblin.EventEmitter.prototype.addListener;
	klass.prototype.removeListener = Goblin.EventEmitter.prototype.removeListener;
	klass.prototype.removeAllListeners = Goblin.EventEmitter.prototype.removeAllListeners;
	klass.prototype.emit = Goblin.EventEmitter.prototype.emit;
};