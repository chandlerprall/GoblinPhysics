GoblinPhysics
==============

GoblinPhysics is an open source physics engine written from the ground up in JavaScript. It aims to provide a fast and dependable physics simulation regardless of platform (desktop vs. mobile, browser vs. nodejs).

Examples
--------
* [Mesh Shape](http://www.goblinphysics.com/examples/mesh-shape-statue.html)
* [Boxes](http://www.goblinphysics.com/examples/boxes.html)
* [Box Stack](http://www.goblinphysics.com/examples/stack.html)
* [Sphere Stack](http://www.goblinphysics.com/examples/spheres.html)
* [Shapes](http://www.goblinphysics.com/examples/shapes.html)
* [Compound Shapes](http://www.goblinphysics.com/examples/compound-shapes.html)
* [Infinite Boxes](http://www.goblinphysics.com/examples/boxes.html)
* [Point Constraint](http://www.goblinphysics.com/examples/constraint-point.html)
* [Slider Constraint](http://www.goblinphysics.com/examples/constraint-slider.html)
* [Weld Constraint](http://www.goblinphysics.com/examples/constraint-weld.html)
* [Ray Traycer](http://www.goblinphysics.com/examples/raytracer.html)

Features
--------
* Rigid body simulation
* Sphere, Box, Cone, Cylinder, Plane, Convex, Mesh, and Compound shapes
* Weld, Slider, and Point constraints
* Basic event callback system
* Ray tracing
* Example scripts
* Test suite

Documentation
-------------
See `Building` below for how to generate documentation. Hosted version available at [http://www.goblinphysics.com/documentation](http://www.goblinphysics.com/documentation).

Roadmap
-------
**Non-exhaustive list of planned features**
* Sweep & Prune broad phase
* More event callbacks
* More constraints
* Internal object re-use (framework for this is in place, need to actually use it)
* Island solver
* Box-Box detection for better performance and stability
* Force generators

Tests
-----
* [Balance](http://www.goblinphysics.com/tests/balance.html)
* [Box-Sphere](http://www.goblinphysics.com/tests/box-sphere.html)
* [GJK-Boxes](http://www.goblinphysics.com/tests/gjk_boxes.html)
* [GJK-Spheres](http://www.goblinphysics.com/tests/gjk_spheres.html)
* [Gravity](http://www.goblinphysics.com/tests/gravity.html)
* [Ray Tracing](http://www.goblinphysics.com/tests/raytracing.html)
* [Restitution](http://www.goblinphysics.com/tests/restitution.html)
* [Sphere-Sphere](http://www.goblinphysics.com/tests/sphere-sphere.html)
* [Support Points](http://www.goblinphysics.com/tests/support-points.html)

Building
--------
[grunt](http://gruntjs.com/) is used to build the library and generate documenation. Follow grunt's [getting started](http://gruntjs.com/getting-started) page for a quick setup. To install the packages necessary to build GoblinPhysics, run `npm install` in the git checkout directory. Once all of the packages have been downloaded you can build by running `grunt`. To generate documenation, run `grunt docs`.

License
-------
GoblinPhysics is distributed under the [zlib license](https://github.com/chandlerprall/GoblinPhysics/blob/master/LICENSE). This means you can use the library to do whatever you want, free of charge, with or without giving attribution (although attribution is always appreciated). [Three.js](https://github.com/mrdoob/three.js/) and [Stats.js](https://github.com/mrdoob/stats.js), used in GoblinPhysics' examples and tests, are distributed under the MIT license which requires attribution if used.