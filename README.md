# AserCraft (Original Voxel Sandbox Prototype)

AserCraft is a small, original block-building sandbox prototype inspired by classic voxel game loops.

## Legal note
This project is **not** Minecraft, and it does not include copied Minecraft code, assets, branding, or proprietary content.

## Features
- Procedural 2D block world with layered terrain (grass, dirt, stone).
- Player movement with gravity and jumping.
- Block breaking and placing with mouse controls.
- Hotbar with selectable block type.
- Local save/load using browser `localStorage`.

## Run locally
You can open `index.html` directly, or run a tiny server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Controls
- `A` / `D`: move
- `Space`: jump
- `1` / `2` / `3`: choose block in hotbar
- Left click: break block
- Right click: place selected block
- `R`: regenerate world
- `P`: save world
- `L`: load world
