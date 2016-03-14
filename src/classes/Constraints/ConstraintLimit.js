Goblin.ConstraintLimit = function( limit_lower, limit_upper ) {
	this.erp = 0.3;
	this.constraint_row = null;

	this.set( limit_lower, limit_upper );
};

Goblin.ConstraintLimit.prototype.set = function( limit_lower, limit_upper ) {
	this.limit_lower = limit_lower || null;
	this.limit_upper = limit_upper || null;

	this.enabled = this.limit_lower != null || this.limit_upper != null;
};

Goblin.ConstraintLimit.prototype.createConstraintRow = function() {
	return this.constraint_row = Goblin.ConstraintRow.createConstraintRow();
};