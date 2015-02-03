Goblin.GhostBody = function( shape ) {
    Goblin.RigidBody.call( this, shape, Infinity );

    this.contacts = [];
    this.tick_contacts = [];

    this.addListener( 'speculativeContact', Goblin.GhostBody.prototype.onSpeculativeContact );
};

Goblin.GhostBody.prototype = Object.create( Goblin.RigidBody.prototype );

Goblin.GhostBody.prototype.onSpeculativeContact = function( object_b, contact ) {
    this.tick_contacts.push( object_b );
    if ( this.contacts.indexOf( object_b ) === -1 ) {
        this.contacts.push( object_b );
        this.emit( 'contactStart', object_b, contact );
    } else {
        this.emit( 'contactContinue', object_b, contact );
    }

    return false;
};

Goblin.GhostBody.prototype.checkForEndedContacts = function() {
    for ( var i = 0; i < this.contacts.length; i++ ) {
        if ( this.tick_contacts.indexOf( this.contacts[i] ) === -1 ) {
            this.emit( 'contactEnd', this.contacts[i] );
            this.contacts.splice( i, 1 );
            i -= 1;
        }
    }
    this.tick_contacts.length = 0;
};