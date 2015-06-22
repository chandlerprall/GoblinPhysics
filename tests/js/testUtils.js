window.testUtils = (function(){
	var renderer,
		camera,
		controls,
		world,
		run_raf;
	
	var objects = [];

	var startThree = function() {
		// Setup Three.js
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor( new THREE.Color( 0xFFFFFF ) );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		testUtils.scene = new THREE.Scene;

		camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, .01, 1000 );
		camera.position.set( 0, 9, 21 );
        //camera.position.set( 0, 2, 10 );
		//camera.lookAt( testUtils.scene.position );

		controls = new THREE.TrackballControls( camera, renderer.domElement );
	};

	var startGoblin = function() {
		testUtils.world = world = new Goblin.World( new Goblin.SAPBroadphase(), new Goblin.NarrowPhase(), new Goblin.IterativeSolver() );
	};

	return {
		scene: null,
		world: null,
		ontick: null,

		initialize: function() {
			startThree();
			startGoblin();
		},

        render: function() {
            // Sync objects
            var i, object;
            for ( i = 0; i < objects.length; i++ ) {
                object = objects[i];
                object.position.set(
                    object.goblin.position.x,
                    object.goblin.position.y,
                    object.goblin.position.z
                );
                object.quaternion.set(
                    object.goblin.rotation.x,
                    object.goblin.rotation.y,
                    object.goblin.rotation.z,
                    object.goblin.rotation.w
                );
            }

            renderer.render( testUtils.scene, camera );
        },

		run: function() {
			run_raf = requestAnimationFrame( testUtils.run );

			controls.update();
			world.step( 1 / 60 );
			testUtils.render();

			if ( testUtils.ontick ) testUtils.ontick();
		},

		stop: function()
		{
			cancelAnimationFrame( run_raf );
		},

		withinEpsilon: function( value, expected ) {
			return Math.abs( value - expected ) <= Goblin.EPSILON;
		},

		createSphere: function( radius, mass ) {
			var sphere = new THREE.Mesh(
				new THREE.SphereGeometry( radius, 32, 32 ),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			sphere.goblin = new Goblin.RigidBody(
				new Goblin.SphereShape( radius ),
				mass
			);

			objects.push( sphere );
			testUtils.scene.add( sphere );
			world.addRigidBody( sphere.goblin );

			return sphere;
		},

		createBox: function( half_width, half_height, half_length, mass ) {
			var box = new THREE.Mesh(
				new THREE.BoxGeometry( half_width * 2, half_height * 2, half_length * 2 ),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			box.goblin = new Goblin.RigidBody(
				new Goblin.BoxShape( half_width, half_height, half_length ),
				mass
			);

			objects.push( box );
			testUtils.scene.add( box );
			world.addRigidBody( box.goblin );

			return box;
		},

		createCylinder: function( radius, half_height, mass ) {
			var cylinder = new THREE.Mesh(
				new THREE.CylinderGeometry( radius, radius, half_height * 2 ),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			cylinder.goblin = new Goblin.RigidBody(
				new Goblin.CylinderShape( radius, half_height ),
				mass
			);

			objects.push( cylinder );
			testUtils.scene.add( cylinder );
			world.addRigidBody( cylinder.goblin );

			return cylinder;
		},

		createCone: function( radius, half_height, mass ) {
			var cone = new THREE.Mesh(
				new THREE.CylinderGeometry( 0, radius, half_height * 2 ),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			cone.goblin = new Goblin.RigidBody(
				new Goblin.ConeShape( radius, half_height ),
				mass
			);

			objects.push( cone );
			testUtils.scene.add( cone );
			world.addRigidBody( cone.goblin );

			return cone;
		},

		createPlane: function( orientation, half_width, half_length, mass ) {
			var plane = new THREE.Mesh(
				new THREE.BoxGeometry(
					orientation === 1 || orientation === 2 ? half_width * 2 : 0,
					orientation === 0 ? half_width * 2 : ( orientation === 2 ? half_length * 2 : 0 ),
					orientation === 0 || orientation === 1 ? half_length * 2 : 0
				),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			plane.goblin = new Goblin.RigidBody(
				new Goblin.PlaneShape( orientation, half_width, half_length ),
				mass
			);

			objects.push( plane );
			testUtils.scene.add( plane );
			world.addRigidBody( plane.goblin );

			return plane;
		},

		createConvex: function( vertices, mass ) {
			//var start = performance.now();
			var convex = new THREE.Mesh(
				new THREE.ConvexGeometry(vertices.map(function( vertex ){
					return new THREE.Vector3( vertex.x, vertex.y, vertex.z );
				})),
				new THREE.MeshNormalMaterial({ opacity: 1, transparent: true })
			);
			//console.log( 'three: ' + ( performance.now() - start ) );

			//var start = performance.now();
			convex.goblin = new Goblin.RigidBody(
				new Goblin.ConvexShape( vertices ),
				mass
			);
			//console.log( 'goblin: ' + ( performance.now() - start ) );

			objects.push( convex );
			testUtils.scene.add( convex );
			world.addRigidBody( convex.goblin );

			return convex;
		}
	};
})();

// Takes a GjkEpa polyhedron and edges and renders it with Three.js
// ( e.g. call renderPolygon from inside the EPA termination condition )
// `renderPolyhedron( polyhedron, edges );`
window.renderPolyhedron = function( polyhedron, edges ) {
	var geometry = new THREE.Geometry();

	polyhedron.faces.forEach(
		function( face, idx )
		{
			if ( face.active ) {
				geometry.vertices.push(
					new THREE.Vector3( face.a.point.x, face.a.point.y, face.a.point.z ),
					new THREE.Vector3( face.b.point.x, face.b.point.y, face.b.point.z ),
					new THREE.Vector3( face.c.point.x, face.c.point.y, face.c.point.z )
				);
				geometry.faces.push( new THREE.Face3( geometry.vertices.length - 3, geometry.vertices.length - 2, geometry.vertices.length - 1 ) );

				// Line geometry
				var line, center, normal, linegeom;

				var color = 0xFF0000;
				if ( idx === 1 ) {
					color = 0x0000FF;
				}

				linegeom = new THREE.Geometry();
				center = geometry.vertices[geometry.vertices.length - 3].clone().add( geometry.vertices[geometry.vertices.length - 2] ).add( geometry.vertices[geometry.vertices.length - 1] ).multiplyScalar( 0.333 );
				normal = center.clone().add( new THREE.Vector3( face.normal.x, face.normal.y, face.normal.z ) );
				linegeom.vertices.push( center, normal );
				line = new THREE.Line( linegeom, new THREE.LineBasicMaterial({ color: color }) );
				testUtils.scene.add( line );
			}
		}
	);

	if ( edges ) {
		for ( var i = 0; i < edges.length; i += 5 ) {
			//continue;
			//if ( i > 5 ) continue;
			var neighbor = edges[i],
				edge = edges[i+1],
				byebye = edges[i+2];

			var a,b;
			if ( edge === 0 ) {
				a = neighbor.a;
				b = neighbor.b;
			} else if ( edge === 1 ) {
				a = neighbor.b;
				b = neighbor.c;
			} else {
				a = neighbor.c;
				b = neighbor.a;
			}

			linegeom = new THREE.Geometry();
			linegeom.vertices.push(
				new THREE.Vector3( a.point.x, a.point.y, a.point.z ),
				new THREE.Vector3( b.point.x, b.point.y, b.point.z )
			);
			line = new THREE.Line( linegeom, new THREE.LineBasicMaterial({ color: 0x0000FF }) );
			testUtils.scene.add( line );
		}
	}

	geometry.computeFaceNormals();
	var mesh = new THREE.Mesh(
		geometry,
		//new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: false, wireframe: false, opacity: 0.7 })
		new THREE.MeshNormalMaterial({ opacity: 1, transparent: true, wireframe: false })
	);
	testUtils.scene.add( mesh );
	testUtils.render();
};