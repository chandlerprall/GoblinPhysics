Goblin.Constraint = function() {
	this.active = true;

	this.object_a = null;

	this.object_b = null;

	this.rows = [];

	this.factor = 1;

	this.last_impulse = new Goblin.Vector3();

	this.breaking_threshold = 0;

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.Constraint );

Goblin.Constraint.prototype.deactivate = function() {
	this.active = false;
	this.emit( 'deactivate' );
};

Goblin.Constraint.prototype.update = function(){};