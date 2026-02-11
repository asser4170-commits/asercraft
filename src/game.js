(() => {
  const TILE = 24;
  const WORLD_W = 180;
  const WORLD_H = 80;
  const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
  };

  const BLOCK_COLORS = {
    [BLOCK.GRASS]: '#6ebf4a',
    [BLOCK.DIRT]: '#8c5a3c',
    [BLOCK.STONE]: '#6d757d',
  };

  const BLOCK_NAME = {
    [BLOCK.GRASS]: 'Grass',
    [BLOCK.DIRT]: 'Dirt',
    [BLOCK.STONE]: 'Stone',
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const hotbarEl = document.getElementById('hotbar');

  let seed = (Math.random() * 1e9) | 0;
  let world = [];

  const player = {
    x: 12,
    y: 10,
    w: 0.8,
    h: 1.8,
    vx: 0,
    vy: 0,
    speed: 10,
    jump: 13,
    onGround: false,
    reach: 6,
  };

  const state = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    selected: BLOCK.GRASS,
    cameraX: 0,
    cameraY: 0,
    message: 'Ready',
    messageTimer: 0,
  };

  function rng(n) {
    return Math.abs(Math.sin(seed * 0.00001 + n * 78.233) * 43758.5453) % 1;
  }

  function generateWorld() {
    world = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(BLOCK.AIR));
    let height = 38;

    for (let x = 0; x < WORLD_W; x += 1) {
      const n = rng(x);
      height += Math.floor((n - 0.5) * 3);
      height = Math.max(18, Math.min(52, height));

      for (let y = height; y < WORLD_H; y += 1) {
        const depth = y - height;
        if (depth === 0) {
          world[y][x] = BLOCK.GRASS;
        } else if (depth < 4) {
          world[y][x] = BLOCK.DIRT;
        } else {
          world[y][x] = BLOCK.STONE;
        }
      }
    }

    player.x = 14;
    player.y = 10;
    player.vx = 0;
    player.vy = 0;
    setMessage('Generated new world');
  }

  function getBlock(x, y) {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) {
      return BLOCK.STONE;
    }
    return world[y][x];
  }

  function setBlock(x, y, type) {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) {
      return;
    }
    world[y][x] = type;
  }

  function collides(px, py, pw, ph) {
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const x1 = Math.floor(px + pw - 0.001);
    const y1 = Math.floor(py + ph - 0.001);

    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        if (getBlock(x, y) !== BLOCK.AIR) {
          return true;
        }
      }
    }
    return false;
  }

  function update(dt) {
    const left = state.keys.has('a') || state.keys.has('arrowleft');
    const right = state.keys.has('d') || state.keys.has('arrowright');

    player.vx = 0;
    if (left) player.vx = -player.speed;
    if (right) player.vx = player.speed;

    if ((state.keys.has(' ') || state.keys.has('w') || state.keys.has('arrowup')) && player.onGround) {
      player.vy = -player.jump;
      player.onGround = false;
    }

    player.vy += 26 * dt;
    player.vy = Math.min(player.vy, 25);

    const nextX = player.x + player.vx * dt;
    if (!collides(nextX, player.y, player.w, player.h)) {
      player.x = nextX;
    }

    const nextY = player.y + player.vy * dt;
    if (!collides(player.x, nextY, player.w, player.h)) {
      player.y = nextY;
      player.onGround = false;
    } else {
      if (player.vy > 0) {
        player.onGround = true;
        player.y = Math.floor(player.y + player.h) - player.h;
      } else {
        player.y = Math.ceil(player.y);
      }
      player.vy = 0;
    }

    state.cameraX = player.x * TILE - canvas.width / 2;
    state.cameraY = player.y * TILE - canvas.height / 2;
    state.cameraX = Math.max(0, Math.min(state.cameraX, WORLD_W * TILE - canvas.width));
    state.cameraY = Math.max(0, Math.min(state.cameraY, WORLD_H * TILE - canvas.height));

    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) {
        state.message = 'Ready';
      }
    }
  }

  function worldToScreen(x, y) {
    return {
      x: x * TILE - state.cameraX,
      y: y * TILE - state.cameraY,
    };
  }

  function screenToWorld(x, y) {
    return {
      x: Math.floor((x + state.cameraX) / TILE),
      y: Math.floor((y + state.cameraY) / TILE),
    };
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#8fd3ff');
    sky.addColorStop(1, '#c8ecff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const xStart = Math.floor(state.cameraX / TILE);
    const yStart = Math.floor(state.cameraY / TILE);
    const xEnd = xStart + Math.ceil(canvas.width / TILE) + 1;
    const yEnd = yStart + Math.ceil(canvas.height / TILE) + 1;

    for (let y = yStart; y <= yEnd; y += 1) {
      if (y < 0 || y >= WORLD_H) continue;
      for (let x = xStart; x <= xEnd; x += 1) {
        if (x < 0 || x >= WORLD_W) continue;
        const b = world[y][x];
        if (b === BLOCK.AIR) continue;

        const p = worldToScreen(x, y);
        ctx.fillStyle = BLOCK_COLORS[b] || '#ff00ff';
        ctx.fillRect(p.x, p.y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(p.x, p.y + TILE - 3, TILE, 3);
      }
    }

    const pp = worldToScreen(player.x, player.y);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(pp.x, pp.y, player.w * TILE, player.h * TILE);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(pp.x + 4, pp.y + 6, 4, 4);

    const target = screenToWorld(state.mouseX, state.mouseY);
    const tp = worldToScreen(target.x, target.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(tp.x + 1, tp.y + 1, TILE - 2, TILE - 2);
  }

  function setMessage(message) {
    state.message = message;
    state.messageTimer = 2.8;
  }

  function refreshHud() {
    statusEl.textContent = `${state.message} · Pos (${player.x.toFixed(1)}, ${player.y.toFixed(1)}) · Seed ${seed}`;

    hotbarEl.innerHTML = '';
    [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE].forEach((block, idx) => {
      const slot = document.createElement('div');
      slot.className = `slot ${state.selected === block ? 'selected' : ''}`;
      slot.textContent = `${idx + 1}: ${BLOCK_NAME[block]}`;
      hotbarEl.appendChild(slot);
    });
  }

  function withinReach(tx, ty) {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dx = tx + 0.5 - cx;
    const dy = ty + 0.5 - cy;
    return Math.hypot(dx, dy) <= player.reach;
  }

  function handleMouse(action) {
    const tile = screenToWorld(state.mouseX, state.mouseY);
    if (!withinReach(tile.x, tile.y)) {
      setMessage('Out of reach');
      return;
    }

    if (action === 'break') {
      if (getBlock(tile.x, tile.y) !== BLOCK.AIR) {
        setBlock(tile.x, tile.y, BLOCK.AIR);
        setMessage('Broke block');
      }
      return;
    }

    if (action === 'place') {
      if (getBlock(tile.x, tile.y) === BLOCK.AIR) {
        const overlapsPlayer = collides(tile.x, tile.y, 1, 1) &&
          tile.x < player.x + player.w &&
          tile.x + 1 > player.x &&
          tile.y < player.y + player.h &&
          tile.y + 1 > player.y;

        if (!overlapsPlayer) {
          setBlock(tile.x, tile.y, state.selected);
          setMessage(`Placed ${BLOCK_NAME[state.selected]}`);
        }
      }
    }
  }

  function saveWorld() {
    const payload = {
      seed,
      world,
      player: { x: player.x, y: player.y },
    };
    localStorage.setItem('asercraft-save', JSON.stringify(payload));
    setMessage('Saved world');
  }

  function loadWorld() {
    const raw = localStorage.getItem('asercraft-save');
    if (!raw) {
      setMessage('No save found');
      return;
    }

    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data.world) || !Array.isArray(data.world[0])) {
        throw new Error('bad save');
      }

      world = data.world;
      seed = Number.isInteger(data.seed) ? data.seed : seed;
      player.x = data.player?.x ?? player.x;
      player.y = data.player?.y ?? player.y;
      setMessage('Loaded world');
    } catch {
      setMessage('Save corrupted');
    }
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    state.keys.add(key);

    if (key === '1') state.selected = BLOCK.GRASS;
    if (key === '2') state.selected = BLOCK.DIRT;
    if (key === '3') state.selected = BLOCK.STONE;

    if (key === 'r') {
      seed = (Math.random() * 1e9) | 0;
      generateWorld();
    }

    if (key === 'p') saveWorld();
    if (key === 'l') loadWorld();
  }

  function onKeyUp(event) {
    state.keys.delete(event.key.toLowerCase());
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = ((event.clientX - rect.left) * canvas.width) / rect.width;
    state.mouseY = ((event.clientY - rect.top) * canvas.height) / rect.height;
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) handleMouse('break');
    if (event.button === 2) handleMouse('place');
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  generateWorld();

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    refreshHud();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
