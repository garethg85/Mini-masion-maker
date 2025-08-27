   import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// First-person controls
const controls = new PointerLockControls(camera, canvas);
scene.add(controls.getObject());
canvas.addEventListener('click', () => controls.lock());

// Camera position
camera.position.set(0, 5, 10);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Skybox
scene.background = new THREE.Color(0x37474F); // Dark mode default (darker blue-gray)

// Block types and materials (matched to style.css)
const blockTypes = {
  bedroom: new THREE.MeshStandardMaterial({ color: 0x7986cb }), // #7986cb
  kitchen: new THREE.MeshStandardMaterial({ color: 0xffb74d }), // #ffb74d
  lounge: new THREE.MeshStandardMaterial({ color: 0x4db6ac }), // #4db6ac
  bathroom: new THREE.MeshStandardMaterial({ color: 0x90caf9 }), // #90caf9
  sofa: new THREE.MeshStandardMaterial({ color: 0x8d6e63 }), // #8d6e63
  bed: new THREE.MeshStandardMaterial({ color: 0xf06292 }), // #f06292
  fridge: new THREE.MeshStandardMaterial({ color: 0xb0bec5 }), // #b0bec5
  desk: new THREE.MeshStandardMaterial({ color: 0xa1887f }), // #a1887f
  vault: new THREE.MeshStandardMaterial({ color: 0x212121 }), // #212121
  pool: new THREE.MeshStandardMaterial({ color: 0x00bcd4 }), // #00bcd4
  cinema: new THREE.MeshStandardMaterial({ color: 0x3e2723 }), // #3e2723
  wine: new THREE.MeshStandardMaterial({ color: 0x6d4c41 }) // #6d4c41
};
let currentBlockType = 'bedroom';
let currentRotation = 0;
document.getElementById('blockType').addEventListener('change', (e) => {
  currentBlockType = e.target.value;
});

// Block geometry
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blocks = []; // Store block data for save/load

// Player marker (small cube to represent player position)
const playerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
const playerMarker = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(playerMarker);

// Create ground (10x10 grid of lounge blocks)
function createGrid() {
  blocks.length = 0;
  scene.children = scene.children.filter(child => !child.userData.isBlock);
  for (let x = -5; x < 5; x++) {
    for (let z = -5; z < 5; z++) {
      const block = new THREE.Mesh(blockGeometry, blockTypes.lounge);
      block.position.set(x, 0, z);
      block.userData = { type: 'lounge', rotation: 0, isBlock: true };
      scene.add(block);
      blocks.push({ x, y: 0, z, type: 'lounge', rotation: 0 });
    }
  }
}
createGrid();

// Mouse and raycaster for block placement/removal
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(child => child.userData.isBlock));
  if (intersects.length > 0) {
    const intersect = intersects[0];
    if (e.button === 0) { // Left-click to place
      const faceNormal = intersect.face.normal;
      const position = intersect.point.add(faceNormal.multiplyScalar(0.5));
      const x = Math.round(position.x);
      const y = Math.round(position.y);
      const z = Math.round(position.z);
      if (!blocks.some(b => b.x === x && b.y === y && b.z === z)) {
        const block = new THREE.Mesh(blockGeometry, blockTypes[currentBlockType]);
        block.position.set(x, y, z);
        block.rotation.y = THREE.MathUtils.degToRad(currentRotation);
        block.userData = { type: currentBlockType, rotation: currentRotation, isBlock: true };
        scene.add(block);
        blocks.push({ x, y, z, type: currentBlockType, rotation: currentRotation });
      }
    } else if (e.button === 2 && intersect.object.userData.type !== 'lounge') { // Right-click to remove (except ground)
      scene.remove(intersect.object);
      const index = blocks.findIndex(b => b.x === intersect.object.position.x && b.y === intersect.object.position.y && b.z === intersect.object.position.z);
      if (index !== -1) blocks.splice(index, 1);
    }
  }
});

// Touch controls
const joystickCanvas = document.getElementById('joystick');
const joystickCtx = joystickCanvas.getContext('2d');
const touchState = {
  joystick: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
  place: { active: false },
  remove: { active: false }
};
const joystick = { outerRadius: 50, innerRadius: 20, x: 50, y: 50 };
joystickCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touches = e.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const touchX = touch.clientX - joystickCanvas.getBoundingClientRect().left;
    const touchY = touch.clientY - joystickCanvas.getBoundingClientRect().top;
    if (touchX < window.innerWidth / 2) {
      touchState.joystick.active = true;
      touchState.joystick.x = touchX;
      touchState.joystick.y = touchY;
      joystick.x = touchX;
      joystick.y = touchY;
    }
  }
});
joystickCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touches = e.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const touchX = touch.clientX - joystickCanvas.getBoundingClientRect().left;
    const touchY = touch.clientY - joystickCanvas.getBoundingClientRect().top;
    if (touchState.joystick.active) {
      touchState.joystick.x = touchX;
      touchState.joystick.y = touchY;
      const dx = touchX - joystick.x;
      const dy = touchY - joystick.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = joystick.outerRadius - joystick.innerRadius;
      if (distance > maxDistance) {
        const scale = maxDistance / distance;
        touchState.joystick.dx = dx * scale;
        touchState.joystick.dy = dy * scale;
      } else {
        touchState.joystick.dx = dx;
        touchState.joystick.dy = dy;
      }
    }
  }
});
joystickCanvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  touchState.joystick.active = false;
  touchState.joystick.dx = 0;
  touchState.joystick.dy = 0;
});

// Movement
const velocity = new THREE.Vector3();
const moveSpeed = 5;
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'w': velocity.z = -moveSpeed; break;
    case 's': velocity.z = moveSpeed; break;
    case 'a': velocity.x = -moveSpeed; break;
    case 'd': velocity.x = moveSpeed; break;
    case ' ': velocity.y = moveSpeed; break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'w': case 's': velocity.z = 0; break;
    case 'a': case 'd': velocity.x = 0; break;
    case ' ': velocity.y = 0; break;
  }
});

// Control functions
window.rotateBlock = () => {
  currentRotation = (currentRotation + 90) % 360;
  alert(`Block rotation set to ${currentRotation}°`);
};

window.resetGrid = () => {
  createGrid();
  alert('Grid reset!');
};

window.saveLayout = () => {
  localStorage.setItem('mansionLayout', JSON.stringify(blocks));
  alert('Layout saved!');
};

window.loadLayout = () => {
  const layout = JSON.parse(localStorage.getItem('mansionLayout'));
  if (!layout) {
    alert('No saved layout found.');
    return;
  }
  blocks.length = 0;
  scene.children = scene.children.filter(child => !child.userData.isBlock);
  layout.forEach(block => {
    const mesh = new THREE.Mesh(blockGeometry, blockTypes[block.type]);
    mesh.position.set(block.x, block.y, block.z);
    mesh.rotation.y = THREE.MathUtils.degToRad(block.rotation);
    mesh.userData = { type: block.type, rotation: block.rotation, isBlock: true };
    scene.add(mesh);
    blocks.push(block);
  });
  alert('Layout loaded!');
};

window.toggleTheme = () => {
  document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-mode', !document.body.classList.contains('light-theme'));
  scene.background = new THREE.Color(document.body.classList.contains('light-theme') ? 0xF0F8FF : 0x37474F);
};

window.placeBlockTouch = () => {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Center of screen
  const intersects = raycaster.intersectObjects(scene.children.filter(child => child.userData.isBlock));
  if (intersects.length > 0) {
    const intersect = intersects[0];
    const faceNormal = intersect.face.normal;
    const position = intersect.point.add(faceNormal.multiplyScalar(0.5));
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const z = Math.round(position.z);
    if (!blocks.some(b => b.x === x && b.y === y && b.z === z)) {
      const block = new THREE.Mesh(blockGeometry, blockTypes[currentBlockType]);
      block.position.set(x, y, z);
      block.rotation.y = THREE.MathUtils.degToRad(currentRotation);
      block.userData = { type: currentBlockType, rotation: currentRotation, isBlock: true };
      scene.add(block);
      blocks.push({ x, y, z, type: currentBlockType, rotation: currentRotation });
    }
  }
};

window.removeBlockTouch = () => {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(child => child.userData.isBlock));
  if (intersects.length > 0 && intersects[0].object.userData.type !== 'lounge') {
    scene.remove(intersects[0].object);
    const index = blocks.findIndex(b => b.x === intersects[0].object.position.x && b.y === intersects[0].object.position.y && b.z === intersects[0].object.position.z);
    if (index !== -1) blocks.splice(index, 1);
  }
};

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update player position
  controls.moveRight(velocity.x * 0.01);
  controls.moveForward(velocity.z * 0.01);
  camera.position.y += velocity.y * 0.01;

  // Simple gravity and collision
  raycaster.set(new THREE.Vector3(camera.position.x, camera.position.y - 0.5, camera.position.z), new THREE.Vector3(0, -1, 0));
  const intersects = raycaster.intersectObjects(scene.children.filter(child => child.userData.isBlock));
  if (intersects.length > 0 && intersects[0].distance < 1.5) {
    camera.position.y = intersects[0].point.y + 1.5;
    velocity.y = 0;
  } else {
    camera.position.y -= 0.1; // Gravity
  }

  // Update player marker
  playerMarker.position.copy(camera.position);
  playerMarker.position.y -= 1;

  // Draw touch joystick
  joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
  if (touchState.joystick.active) {
    joystickCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    joystickCtx.beginPath();
    joystickCtx.arc(joystick.x, joystick.y, joystick.outerRadius, 0, Math.PI * 2);
    joystickCtx.fill();
    joystickCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    joystickCtx.beginPath();
    joystickCtx.arc(joystick.x + touchState.joystick.dx, joystick.y + touchState.joystick.dy, joystick.innerRadius, 0, Math.PI * 2);
    joystickCtx.fill();
  }

  // Move camera with joystick
  if (touchState.joystick.active) {
    const speedScale = moveSpeed / (joystick.outerRadius - joystick.innerRadius);
    controls.moveRight(touchState.joystick.dx * speedScale * 0.01);
    controls.moveForward(-touchState.joystick.dy * speedScale * 0.01);
  }

  // Render scene
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}); 
