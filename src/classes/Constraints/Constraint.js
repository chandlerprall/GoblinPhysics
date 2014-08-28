Goblin.Constraint = function() {
	this.active = true;

	this.object_a = null;

	this.object_b = null;

	this.rows = [];

	this.factor = 1;

	this.last_impulse = vec3.create();

	this.breaking_threshold = 0;
};

Goblin.Constraint.prototype.update = function(){};