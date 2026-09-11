# Lumen Core

A 60-second browser-based arcade survival game built using HTML Canvas and Vanilla JavaScript.

## Game Description
In **Lumen Core**, you are trapped inside a microscopic containment chamber failing to hold a collapsing energy star. The star's lethal rendering bloom continuously expands across the arena, steadily reducing your safe space over a strict 60-second countdown.

To survive, you must maneuver around the chamber to collect floating **Coolant Nodes**, which automatically target and fire into the star to shrink its expanding hitbox. Navigating tight corners and managing risk vs. reward becomes crucial as the screen fills with blinding light.

## Gameplay Mechanics
* **Objective:** Survive for exactly 60.00 seconds without touching the star's glowing red hitbox.
* **Movement:** Direct, high-precision mouse tracking inside the containment arena.
* **Coolant System:** Touching cyan Coolant Nodes (`#06b6d4`) converts them into containment projectiles aimed directly at the star's center.
* **The Bloom Hazard:** The star's physical hitbox grows at a steady rate of 15 pixels per second, accompanied by a dynamic glowing blur shadow.

## Control Scheme
* **Mouse Movement:** Move the cursor inside the canvas frame to steer your ship.
* **Auto-Fire:** Coolant projectiles automatically launch toward the core upon node collection.
