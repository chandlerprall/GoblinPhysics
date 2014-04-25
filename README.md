GoblinPhysics
==============

GoblinPhysics is an open source physics engine written from the ground up in JavaScript. It aims to provide a fast and dependable physics simulation regardless of platform (desktop vs. mobile, browser vs. nodejs). The current version is in its infancy but on the way to achieving that goal. Because GoblinPhysics is still early in its development it is not production ready, although supported functionality is considered stable.

Examples
--------
* [Box Stack](http://www.goblinphysics.com/examples/stack.html)
* [Sphere Stack](http://www.goblinphysics.com/examples/spheres.html)
* [Box Columns](http://www.goblinphysics.com/examples/boxes.html)
* [Shapes](http://www.goblinphysics.com/examples/shapes.html)
* [Contact Points](http://www.goblinphysics.com/examples/contact-points.html)

Features
--------
* Rigid body simulation
* Sphere, Box, Cone, Cylinder, Plane, and Compound shapes
* Ray tracing
* Example scripts
* Test suite

Documentation
-------------
See `Building` below for how to generate documentation. Hosted version available at [http://www.goblinphysics.com](http://www.goblinphysics.com/).

Roadmap
-------
**Planned for v0.4**
* Optimizations
* Code cleanup
* Examples cleanup

** Planned for 0.5**
* Event/callback system
* Revolute constraints

**Non-exhaustive list of planned features**
* Convex hull shape
* Compound objects
* Sweep & Prune broad phase
* Ray casting
* Event callbacks (for collisions, etc)
* Constraints (hinge, point-to-point, etc)
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
* [Restitution](http://www.goblinphysics.com/tests/restitution.html)
* [Sphere-Sphere](http://www.goblinphysics.com/tests/sphere-sphere.html)
* [Support Points](http://www.goblinphysics.com/tests/support-points.html)

Building
--------
[grunt](http://gruntjs.com/) is used to build the library and generate documenation. Follow grunt's [getting started](http://gruntjs.com/getting-started) page for a quick setup. To install the packages necessary to build GoblinPhysics, run `npm install` in the git checkout directory. Once all of the packages have been downloaded you can build by running `grunt`. To generate documenation, run `grunt docs`.

License
-------
GoblinPhysics is distributed under the [zlib license](https://github.com/chandlerprall/GoblinPhysics/blob/master/LICENSE). This means you can use the library to do whatever you want, free of charge, with or without giving attribution (although attribution is always appreciated). There is a current dependency on [gl-matrix](https://github.com/toji/gl-matrix) which is also under the zlib license. [Three.js](https://github.com/mrdoob/three.js/), used in GoblinPhysics' examples and tests, is distributed under the MIT license which requires attribution if used.
