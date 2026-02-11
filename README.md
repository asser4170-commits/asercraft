 <<<<<<< codex/create-minecraft-knockoff-with-original-structure-s9h30q
# Blocky Frontier

Blocky Frontier is an original, legal voxel sandbox prototype inspired by the *genre* of early block-building games.

## Goals

- Keep the project original (code, branding, and behavior)
- Showcase chunkless block placement/removal with a simple terrain seed
- Provide a tiny starter architecture that is easy to expand

## Run locally

Because this project imports ES modules from a CDN, run it with a local web server:
=======
 <<<<<<< codex/create-minecraft-knockoff-with-original-structure-6y58gt
# Voxel Frontier

Voxel Frontier is an original, permissively licensed voxel sandbox prototype inspired by classic block-building gameplay loops.

## Features

- Procedurally generated block terrain.
- First-person movement with pointer-lock camera controls.
- Left-click mining and right-click block placement.
- Lightweight, dependency-free setup (served as static files).

## Run locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 in a browser.

## Legal note

This project does not reuse proprietary game code, assets, names, or branding from any existing commercial game.
=======
# Asercraft

Asercraft is an original, legal voxel-style sandbox prototype built from scratch.
It is **inspired by classic block-building gameplay patterns** (mine/place/explore),
but it does not copy proprietary game code, assets, branding, or world content.

## What is included

- Procedural chunked terrain generation (2D top-down representation)
- Break/place block loop
- Small hotbar with selectable block types
- Basic save/load using `localStorage`

## Run locally

Because this is plain HTML/CSS/JS, you can run any static server:
 >>>>>>> main

```bash
python3 -m http.server 4173
```

 <<<<<<< codex/create-minecraft-knockoff-with-original-structure-s9h30q
Then open <http://localhost:4173>.

## Controls

- Orbit camera: drag with mouse
- Left click: remove selected block
- Right click: place currently selected block
- `1`, `2`, `3`: choose block type

## Legal note

This project intentionally avoids copying proprietary source code, assets, and branding from any commercial game.
=======
Then open:

- `http://localhost:4173/src/`

## Controls

- `WASD`: move cursor
- `Mouse Left`: break block
- `Mouse Right`: place selected block
- `1-4`: select hotbar slot
- `R`: regenerate world (new seed)
- `K`: save world
- `L`: load world

## Notes

This project is intentionally lightweight so it can be extended into a full 3D voxel engine later.
 >>>>>>> main
 >>>>>>> main
