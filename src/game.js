 <<<<<<< codex/create-minecraft-knockoff-with-original-structure-9nrst9
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
=======
 <<<<<<< codex/create-minecraft-knockoff-with-original-structure-s9h30q
import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.166.1/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#app');
const hotbar = document.querySelector('#hotbar');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#95d7ff');
scene.fog = new THREE.Fog('#95d7ff', 18, 50);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(8, 10, 14);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minDistance = 6;
controls.maxDistance = 30;

scene.add(new THREE.AmbientLight('#ffffff', 0.45));

const sun = new THREE.DirectionalLight('#ffe2b6', 0.9);
sun.position.set(14, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
scene.add(sun);

const blockTypes = [
  { name: 'Grass', color: '#5ea03b' },
  { name: 'Stone', color: '#8b8e96' },
  { name: 'Sand', color: '#d8c287' },
];

let selectedBlock = 0;

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockMaterials = blockTypes.map((type) =>
  new THREE.MeshLambertMaterial({ color: type.color })
);
const wireMaterial = new THREE.LineBasicMaterial({ color: '#ffffff' });

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const positionToKey = (x, y, z) => `${x}|${y}|${z}`;
const worldMap = new Map();

function addBlock(x, y, z, typeIndex) {
  const key = positionToKey(x, y, z);
  if (worldMap.has(key)) return;

  const cube = new THREE.Mesh(cubeGeometry, blockMaterials[typeIndex]);
  cube.position.set(x, y, z);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.userData = { x, y, z, typeIndex };
  worldGroup.add(cube);
  worldMap.set(key, cube);
}

function removeBlock(x, y, z) {
  const key = positionToKey(x, y, z);
  const block = worldMap.get(key);
  if (!block || y < 0) return;
  worldGroup.remove(block);
  worldMap.delete(key);
}

function generateTerrain(size = 20) {
  for (let x = -size / 2; x < size / 2; x += 1) {
    for (let z = -size / 2; z < size / 2; z += 1) {
      const baseHeight = Math.floor(Math.sin(x * 0.4) + Math.cos(z * 0.35));
      for (let y = -2; y <= baseHeight; y += 1) {
        const type = y === baseHeight ? 0 : y >= -1 ? 1 : 2;
        addBlock(x, y, z, type);
      }
    }
  }
}

generateTerrain();

const grid = new THREE.GridHelper(42, 42, '#4d6c8f', '#6f8dab');
grid.position.y = -2.5;
scene.add(grid);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const selectionBox = new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeometry), wireMaterial);
selectionBox.visible = false;
scene.add(selectionBox);

let hoveredIntersection = null;

function updateHover(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(worldGroup.children, false);

  if (hits.length === 0) {
    hoveredIntersection = null;
    selectionBox.visible = false;
    return;
  }

  hoveredIntersection = hits[0];
  const block = hoveredIntersection.object;
  selectionBox.position.copy(block.position);
  selectionBox.visible = true;
}

renderer.domElement.addEventListener('mousemove', (event) => {
  updateHover(event.clientX, event.clientY);
});

renderer.domElement.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

renderer.domElement.addEventListener('mousedown', (event) => {
  updateHover(event.clientX, event.clientY);
  if (!hoveredIntersection) return;

  const { object, face } = hoveredIntersection;
  if (!face) return;

  const { x, y, z } = object.userData;

  if (event.button === 0) {
    removeBlock(x, y, z);
    selectionBox.visible = false;
  }

  if (event.button === 2) {
    const direction = face.normal;
    const nextX = x + direction.x;
    const nextY = y + direction.y;
    const nextZ = z + direction.z;
    addBlock(nextX, nextY, nextZ, selectedBlock);
  }
});

function renderHotbar() {
  hotbar.innerHTML = '';
  blockTypes.forEach((block, index) => {
    const chip = document.createElement('div');
    chip.className = `block-chip ${selectedBlock === index ? 'selected' : ''}`;
    chip.textContent = `${index + 1}: ${block.name}`;
    hotbar.appendChild(chip);
  });
}

window.addEventListener('keydown', (event) => {
  const choice = Number(event.key) - 1;
  if (choice >= 0 && choice < blockTypes.length) {
    selectedBlock = choice;
    renderHotbar();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderHotbar();

function loop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();
=======
const TILE_SIZE = 24;
const WORLD_SIZE = 96;
const VIEW_SIZE = 32;

const BLOCKS = {
  air: { id: 0, color: "#0f172a", solid: false },
  grass: { id: 1, color: "#2e7d32", solid: true },
  dirt: { id: 2, color: "#7c4a2d", solid: true },
  stone: { id: 3, color: "#7b8794", solid: true },
  wood: { id: 4, color: "#8d6e63", solid: true },
};

const HOTBAR = ["grass", "dirt", "stone", "wood"];
const STORAGE_KEY = "asercraft-save-v1";

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateWorld(seed) {
  const world = Array.from({ length: WORLD_SIZE }, () => Array(WORLD_SIZE).fill(BLOCKS.air.id));
  const rng = mulberry32(seed);

  for (let y = 0; y < WORLD_SIZE; y += 1) {
    for (let x = 0; x < WORLD_SIZE; x += 1) {
      const nx = x / WORLD_SIZE - 0.5;
      const ny = y / WORLD_SIZE - 0.5;
      const radial = Math.sqrt(nx * nx + ny * ny);
      const noise = rng() * 0.6 + rng() * 0.3;
      const height = 1 - radial + noise * 0.45;

      if (height > 0.75) world[y][x] = BLOCKS.stone.id;
      else if (height > 0.55) world[y][x] = BLOCKS.grass.id;
      else if (height > 0.4) world[y][x] = BLOCKS.dirt.id;
      else world[y][x] = BLOCKS.air.id;
    }
  }
  return world;
}

function blockById(id) {
  return Object.values(BLOCKS).find((block) => block.id === id) || BLOCKS.air;
}

class Game {
  constructor(canvas, status, hotbar) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.status = status;
    this.hotbar = hotbar;

    this.seed = Math.floor(Math.random() * 1_000_000_000);
    this.world = generateWorld(this.seed);
    this.cursor = { x: Math.floor(WORLD_SIZE / 2), y: Math.floor(WORLD_SIZE / 2) };
    this.selectedSlot = 0;

    this.installEvents();
    this.renderHotbar();
    this.loop();
  }

  installEvents() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "w") this.cursor.y = Math.max(0, this.cursor.y - 1);
      if (key === "s") this.cursor.y = Math.min(WORLD_SIZE - 1, this.cursor.y + 1);
      if (key === "a") this.cursor.x = Math.max(0, this.cursor.x - 1);
      if (key === "d") this.cursor.x = Math.min(WORLD_SIZE - 1, this.cursor.x + 1);

      const number = Number(key);
      if (number >= 1 && number <= HOTBAR.length) {
        this.selectedSlot = number - 1;
        this.renderHotbar();
      }

      if (key === "r") {
        this.seed = Math.floor(Math.random() * 1_000_000_000);
        this.world = generateWorld(this.seed);
      }
      if (key === "k") this.save();
      if (key === "l") this.load();
    });

    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("mousedown", (event) => {
      const { x, y } = this.screenToWorld(event.offsetX, event.offsetY);
      if (!this.inBounds(x, y)) return;

      if (event.button === 0) {
        this.world[y][x] = BLOCKS.air.id;
      }

      if (event.button === 2) {
        const blockName = HOTBAR[this.selectedSlot];
        this.world[y][x] = BLOCKS[blockName].id;
      }
    });
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < WORLD_SIZE && y < WORLD_SIZE;
  }

  screenToWorld(screenX, screenY) {
    const camX = Math.max(0, Math.min(WORLD_SIZE - VIEW_SIZE, this.cursor.x - Math.floor(VIEW_SIZE / 2)));
    const camY = Math.max(0, Math.min(WORLD_SIZE - VIEW_SIZE, this.cursor.y - Math.floor(VIEW_SIZE / 2)));

    const tileX = Math.floor(screenX / TILE_SIZE);
    const tileY = Math.floor(screenY / TILE_SIZE);

    return { x: camX + tileX, y: camY + tileY };
  }

  save() {
    const payload = {
      seed: this.seed,
      world: this.world,
      cursor: this.cursor,
      selectedSlot: this.selectedSlot,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data.world)) return;
      this.seed = data.seed;
      this.world = data.world;
      this.cursor = data.cursor;
      this.selectedSlot = data.selectedSlot ?? 0;
      this.renderHotbar();
    } catch {
      // Ignore malformed save data.
    }
  }

  renderHotbar() {
    this.hotbar.innerHTML = "<strong>Hotbar</strong><br/>";
    HOTBAR.forEach((name, index) => {
      const mark = index === this.selectedSlot ? "▶" : "•";
      const item = document.createElement("div");
      item.innerHTML = `<span>${mark}</span> ${index + 1}: ${name}`;
      this.hotbar.appendChild(item);
    });
  }

  render() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const camX = Math.max(0, Math.min(WORLD_SIZE - VIEW_SIZE, this.cursor.x - Math.floor(VIEW_SIZE / 2)));
    const camY = Math.max(0, Math.min(WORLD_SIZE - VIEW_SIZE, this.cursor.y - Math.floor(VIEW_SIZE / 2)));

    for (let y = 0; y < VIEW_SIZE; y += 1) {
      for (let x = 0; x < VIEW_SIZE; x += 1) {
        const worldX = camX + x;
        const worldY = camY + y;
        const block = blockById(this.world[worldY][worldX]);

        ctx.fillStyle = block.color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    const cursorScreenX = (this.cursor.x - camX) * TILE_SIZE;
    const cursorScreenY = (this.cursor.y - camY) * TILE_SIZE;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(cursorScreenX + 1, cursorScreenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    this.status.innerHTML = `
      <strong>Status</strong><br/>
      Seed: ${this.seed}<br/>
      Cursor: ${this.cursor.x}, ${this.cursor.y}<br/>
      Selected: ${HOTBAR[this.selectedSlot]}
    `;
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

const canvas = document.querySelector("#game");
const status = document.querySelector("#status");
const hotbar = document.querySelector("#hotbar");
new Game(canvas, status, hotbar);
 >>>>>>> main
 >>>>>>> main
