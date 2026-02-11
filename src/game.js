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
