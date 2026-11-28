try {
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
} catch (error) {
  console.error("Could not load Three.js for the inventory shelf.", error);
  fallback.textContent = "Could not load the 3D shelf. Check your internet connection and reload.";
  fallback.classList.remove("hidden");
}

if (THREE) {
var scene = new THREE.Scene();
scene.background = new THREE.Color("#f5f8f5");

var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 1.1, 8);

var renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
} catch (error) {
  console.error("Could not start WebGL for the inventory shelf.", error);
  fallback.classList.remove("hidden");
}