GoblinPhysics
==============

About
-----
GoblinPhysics is an open source physics engine written from the ground up in JavaScript. It aims to provide a fast and dependable physics simulation regardless of platform (desktop vs. mobile, browser vs. nodejs). The current version is in its infancy but on the way to achieving that goal. Because GoblinPhysics is still early in its development it is not production ready, although supported functionality is considered stable.

Examples
--------
[Box Stack](http://www.goblinphysics.com/examples/stack.html)
[Sphere Stack](http://www.goblinphysics.com/examples/spheres.html)
[Box Columns](http://www.goblinphysics.com/examples/boxes.html)
[Shapes](http://www.goblinphysics.com/examples/shapes.html)
[Contact Points](http://www.goblinphysics.com/examples/contact-points.html)

Features
--------
* Rigid body simulation
* Sphere and Box shapes
* Test suite
* Example scripts

Documentation
-------------
See `Building` below for how to generate documentation. Hosted version available at [http://www.goblinphysics.com](http://www.goblinphysics.com/).

Roadmap
-------
**Planned for v0.2**
* Cone and Cylinder shapes
* Axis Aligned Bounding Boxes to replace the current Bounding Sphere
* Clean up friction constraint

**Non-exhaustive list of planned features**
* Convex hull shape
* Compound objects
* Sweep & Prune broad phase
* Ray casting
* Event callbacks (for collisions, etc)
* Constraints (hinge, point-to-point, etc)
* Internal object re-use (framework for this is in place, need to actually use it)
* Island solver
* Box-Box near phase for better performance and stability

Tests
-----
[Balance](http://www.goblinphysics.com/tests/balance.html)
[Box-Sphere](http://www.goblinphysics.com/tests/box-sphere.html)
[GJK-Boxes](http://www.goblinphysics.com/tests/gjk_boxes.html)
[GJK-Spheres](http://www.goblinphysics.com/tests/gjk_spheres.html)
[Gravity](http://www.goblinphysics.com/tests/gravity.html)
[Restitution](http://www.goblinphysics.com/tests/restitution.html)
[Sphere-Sphere](http://www.goblinphysics.com/tests/sphere-sphere.html)
[Support Points](http://www.goblinphysics.com/tests/support-points.html)

Building
--------
[grunt](http://gruntjs.com/) is used to build the library and generate documenation. Follow grunt's [getting started](http://gruntjs.com/getting-started) page for a quick setup. To install the packages necessary to build GoblinPhysics, run `npm install` in the git checkout directory. Once all of the packages have been downloaded you can build by running `grunt`. To generate documenation, run `grunt docs`.
