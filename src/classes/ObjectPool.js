/**
 * Manages pools for various types of objects, provides methods for creating and freeing pooled objects
 *
 * @class ObjectPool
 * @static
 */
Goblin.ObjectPool = {
	/**
	 * key/value map of registered types
	 *
	 * @property types
	 * @private
	 */
	types: {},

	/**
	 * key/pool map of object type - to - object pool
	 *
	 * @property pools
	 * @private
	 */
	pools: {},

	/**
	 * registers a type of object to be available in pools
	 *
	 * @param key {String} key associated with the object to register
	 * @param constructing_function {Function} function which will return a new object
	 */
	registerType: function( key, constructing_function ) {
		this.types[ key ] = constructing_function;
		this.pools[ key ] = [];
	},

	/**
	 * retrieve a free object from the specified pool, or creates a new object if one is not available
	 *
	 * @param key {String} key of the object type to retrieve
	 * @return {Mixed} object of the type asked for, when done release it with `ObjectPool.freeObject`
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
	 * adds on object to the object pool so it can be reused
	 *
	 * @param key {String} type of the object being freed, matching the key given to `registerType`
	 * @param object {Mixed} object to release into the pool
	 */
	freeObject: function( key, object ) {
		this.pools[ key ].push( object );
	}
};

// register the objects used in Goblin
Goblin.ObjectPool.registerType( 'ContactDetails', function() { return new Goblin.ContactDetails(); } );
Goblin.ObjectPool.registerType( 'ContactManifold', function() { return new Goblin.ContactManifold(); } );
Goblin.ObjectPool.registerType( 'GJK2SupportPoint', function() { return new Goblin.GjkEpa2.SupportPoint( vec3.create(), vec3.create(), vec3.create() ); } );
Goblin.ObjectPool.registerType( 'ConstraintRow', function() { return new Goblin.ConstraintRow(); } );
Goblin.ObjectPool.registerType( 'ContactConstraint', function() { return new Goblin.ContactConstraint(); } );
Goblin.ObjectPool.registerType( 'FrictionConstraint', function() { return new Goblin.FrictionConstraint(); } );
Goblin.ObjectPool.registerType( 'RayIntersection', function() { return new Goblin.RayIntersection(); } );
Goblin.ObjectPool.registerType( 'RigidBodyProxy', function() { return new Goblin.RigidBodyProxy(); } );