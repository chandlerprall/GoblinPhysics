Goblin.ConstraintMotor = function( torque, max_speed ) {
	this.constraint_row = null;
	this.set( torque, max_speed);
};

Goblin.ConstraintMotor.prototype.set = function( torque, max_speed ) {
	this.enabled = torque != null && max_speed != null;
	this.torque = torque;
	this.max_speed = max_speed;
};

Goblin.ConstraintMotor.prototype.createConstraintRow = function() {
	this.constraint_row = Goblin.ConstraintRow.createConstraintRow();
};