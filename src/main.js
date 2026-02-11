import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/PointerLockControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecaf7);
scene.fog = new THREE.Fog(0x8ecaf7, 35, 120);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 18, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(20, 45, 15);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const controls = new PointerLockControls(camera, renderer.domElement);
document.body.addEventListener("click", () => controls.lock());
scene.add(controls.getObject());

const keys = new Set();
document.addEventListener("keydown", (e) => keys.add(e.code));
document.addEventListener("keyup", (e) => keys.delete(e.code));

const blockSize = 1;
const worldSize = 28;
const blocks = new Map();
const collider = [];

const materials = {
  grass: new THREE.MeshLambertMaterial({ color: 0x58a74d }),
  dirt: new THREE.MeshLambertMaterial({ color: 0x8a5f3a }),
  stone: new THREE.MeshLambertMaterial({ color: 0x888888 }),
  wood: new THREE.MeshLambertMaterial({ color: 0xa06d41 }),
};

const blockGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
const raycaster = new THREE.Raycaster();
raycaster.far = 7;

function keyFrom(x, y, z) {
  return `${x},${y},${z}`;
}

function pseudoHeight(x, z) {
  const v1 = Math.sin(x * 0.25) * 1.9;
  const v2 = Math.cos(z * 0.24) * 1.7;
  const v3 = Math.sin((x + z) * 0.17) * 1.2;
  return Math.floor(8 + v1 + v2 + v3);
}

function addBlock(x, y, z, type = "grass") {
  const key = keyFrom(x, y, z);
  if (blocks.has(key)) return;

  const mesh = new THREE.Mesh(blockGeo, materials[type] || materials.grass);
  mesh.position.set(x, y, z);
  mesh.userData.grid = { x, y, z, type };
  scene.add(mesh);
  blocks.set(key, mesh);
  collider.push(mesh);
}

function removeBlock(mesh) {
  const { x, y, z } = mesh.userData.grid;
  const key = keyFrom(x, y, z);
  blocks.delete(key);
  const index = collider.indexOf(mesh);
  if (index >= 0) collider.splice(index, 1);
  scene.remove(mesh);
}

function buildWorld() {
  for (let x = -worldSize; x <= worldSize; x++) {
    for (let z = -worldSize; z <= worldSize; z++) {
      const h = pseudoHeight(x, z);
      for (let y = 0; y <= h; y++) {
        const depth = h - y;
        const type = depth === 0 ? "grass" : depth < 3 ? "dirt" : "stone";
        addBlock(x, y, z, type);
      }
    }
  }

  for (let i = -18; i <= 18; i += 9) {
    const trunkX = i;
    const trunkZ = 6;
    const base = pseudoHeight(trunkX, trunkZ) + 1;
    for (let h = 0; h < 4; h++) addBlock(trunkX, base + h, trunkZ, "wood");
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = 3; ly <= 5; ly++) {
          if (Math.abs(lx) + Math.abs(lz) < 4) {
            addBlock(trunkX + lx, base + ly, trunkZ + lz, "grass");
          }
        }
      }
    }
  }
}

buildWorld();

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const moveDir = new THREE.Vector3();
const lookDir = new THREE.Vector3();

function handleMining(place = false) {
  camera.getWorldDirection(lookDir);
  raycaster.set(camera.position, lookDir);
  const hit = raycaster.intersectObjects(collider, false)[0];
  if (!hit) return;

  if (place) {
    const target = hit.object.userData.grid;
    const point = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    const z = Math.round(point.z);
    if (y > 0 && !blocks.has(keyFrom(x, y, z))) {
      const pick = target.type === "stone" ? "stone" : "dirt";
      addBlock(x, y, z, pick);
    }
  } else {
    if (hit.object.userData.grid.y > 0) removeBlock(hit.object);
  }
}

window.addEventListener("mousedown", (event) => {
  if (!controls.isLocked) return;
  if (event.button === 0) handleMining(false);
  if (event.button === 2) handleMining(true);
});
window.addEventListener("contextmenu", (e) => e.preventDefault());

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (controls.isLocked) {
    moveDir.set(0, 0, 0);
    if (keys.has("KeyW")) moveDir.z -= 1;
    if (keys.has("KeyS")) moveDir.z += 1;
    if (keys.has("KeyA")) moveDir.x -= 1;
    if (keys.has("KeyD")) moveDir.x += 1;
    if (keys.has("Space")) moveDir.y += 1;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) moveDir.y -= 1;

    moveDir.normalize();
    const speed = 16;
    velocity.copy(moveDir).multiplyScalar(speed * dt);

    controls.moveRight(velocity.x);
    controls.moveForward(-velocity.z);
    camera.position.y += velocity.y;
    camera.position.y = Math.max(2, camera.position.y);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
