/**
 * Manages pools for various types of objects, provides methods for creating and freeing pooled objects
 *
 * @class ObjectPool
 * @static
 */
Goblin.ObjectPool = {
	/**
	 * Key/value map of registered types
	 *
	 * @property types
	 * @private
	 */
	types: {},

	/**
	 * Key/pool map of object type - to - object pool
	 *
	 * @property pools
	 * @private
	 */
	pools: {},

	/**
	 * Registers a type of object to be available in pools
	 *
	 * @param key {String} Key associated with the object to register
	 * @param constructing_function {Function} Function which will return a new object
	 */
	registerType: function( key, constructing_function ) {
		this.types[ key ] = constructing_function;
		this.pools[ key ] = [];
	},

	/**
	 * Retrieve a free object from the specified pool, or creates a new object if one is not available
	 *
	 * @param key {String} Key of the object type to retrieve
	 * @return {Mixed} Object of the type asked for, when done release it with `ObjectPool.freeObject`
	 */
	getObject: function( key ) {
		var pool = this.pools[ key ];

		if ( pool.length !== 0 ) {
			return pool.pop();
		} else {
			return this.types[ key ]();
		}
	},

	/**
	 * Adds on object to the object pool so it can be reused
	 *
	 * @param key {String} Type of the object being freed, matching the key given to `registerType`
	 * @param object {Mixed} object to release into the pool
	 */
	freeObject: function( key, object ) {
		this.pools[ key ].push( object );
	}
};

// mappings for closure compiler
Goblin['ObjectPool'] = Goblin.ObjectPool;
Goblin.ObjectPool['registerType'] = Goblin.ObjectPool.registerType;
Goblin.ObjectPool['getObject'] = Goblin.ObjectPool.getObject;
Goblin.ObjectPool['freeObject'] = Goblin.ObjectPool.freeObject;

// register the objects used in Goblin
Goblin.ObjectPool.registerType( 'vec3', vec3.create );
Goblin.ObjectPool.registerType( 'mat3', mat3.create );
Goblin.ObjectPool.registerType( 'MassPointContact', function() { return new Goblin.MassPointContact(); } );
Goblin.ObjectPool.registerType( 'ContactDetails', function() { return new Goblin.ContactDetails(); } );
Goblin.ObjectPool.registerType( 'ContactManifold', function() { return new Goblin.ContactManifold(); } );
Goblin.ObjectPool.registerType( 'GJKSupportPoint', function() { return new Goblin.GjkEpa.SupportPoint( vec3.create(), vec3.create(), vec3.create(), vec3.create() ); } );
Goblin.ObjectPool.registerType( 'ConstraintRow', function() { return new Goblin.ConstraintRow(); } );
Goblin.ObjectPool.registerType( 'ContactConstraint', function() { return new Goblin.ContactConstraint(); } );
Goblin.ObjectPool.registerType( 'FrictionConstraint', function() { return new Goblin.FrictionConstraint(); } );