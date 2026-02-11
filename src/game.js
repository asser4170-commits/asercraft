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
