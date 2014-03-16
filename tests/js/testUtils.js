window.testUtils = (function(){
	var renderer,
		camera,
		controls,
		world;
	
	var objects = [];

	var startThree = function() {
		// Setup Three.js
		renderer = new THREE.WebGLRenderer({ antialias: true });
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
		testUtils.world = world = new Goblin.World( new Goblin.BasicBroadphase(), new Goblin.NearPhase(), new Goblin.SequentialImpulseSolver() );
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
                    object.goblin.position[0],
                    object.goblin.position[1],
                    object.goblin.position[2]
                );
                object.quaternion.set(
                    object.goblin.rotation[0],
                    object.goblin.rotation[1],
                    object.goblin.rotation[2],
                    object.goblin.rotation[3]
                );
            }

            renderer.render( testUtils.scene, camera );
        },

		run: function() {
			requestAnimationFrame( testUtils.run );

			controls.update();
			world.step( 1 / 60 );
			testUtils.render();

			if ( testUtils.ontick ) testUtils.ontick();
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
			sphere.useQuaternion = true;

			objects.push( sphere );
			testUtils.scene.add( sphere );
			world.addRigidBody( sphere.goblin );

			return sphere;
		},

		createBox: function( half_width, half_height, half_length, mass ) {
			var box = new THREE.Mesh(
				new THREE.CubeGeometry( half_width * 2, half_height * 2, half_length * 2 ),
				new THREE.MeshNormalMaterial({ opacity: 1 })
			);
			box.goblin = new Goblin.RigidBody(
				new Goblin.BoxShape( half_width, half_height, half_length ),
				mass
			);
			box.useQuaternion = true;

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
			cylinder.useQuaternion = true;

			objects.push( cylinder );
			testUtils.scene.add( cylinder );
			world.addRigidBody( cylinder.goblin );

			return cylinder;
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
					new THREE.Vector3( face.a.point[0], face.a.point[1], face.a.point[2] ),
					new THREE.Vector3( face.b.point[0], face.b.point[1], face.b.point[2] ),
					new THREE.Vector3( face.c.point[0], face.c.point[1], face.c.point[2] )
				);
				geometry.faces.push( new THREE.Face3( geometry.vertices.length - 3, geometry.vertices.length - 2, geometry.vertices.length - 1 ) );

				// Line geometry
				var line, center, normal, linegeom;

				var color = 0xFF0000;
				if ( idx === 1 ) {
					color = 0x0000FF;
				}

				linegeom = new THREE.Geometry();
				center = geometry.vertices[geometry.vertices.length - 3].clone().addSelf( geometry.vertices[geometry.vertices.length - 2] ).addSelf( geometry.vertices[geometry.vertices.length - 1] ).multiplyScalar( 0.333 );
				normal = center.clone().addSelf( new THREE.Vector3( face.normal[0], face.normal[1], face.normal[2] ) );
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
				new THREE.Vector3( a.point[0], a.point[1], a.point[2] ),
				new THREE.Vector3( b.point[0], b.point[1], b.point[2] )
			);
			line = new THREE.Line( linegeom, new THREE.LineBasicMaterial({ color: 0x0000FF }) );
			testUtils.scene.add( line );
		};
	}

	var mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: false, wireframe: false, opacity: 0.7 })
	);
	testUtils.scene.add( mesh );
	testUtils.render();
};