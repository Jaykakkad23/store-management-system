var canvas = document.getElementById("shelf-canvas");
var stage = document.getElementById("shelf-stage");
var tooltip = document.getElementById("shelf-tooltip");
var fallback = document.getElementById("shelf-fallback");
var THREE;
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

if (renderer) {
  var shelf = new THREE.Group();
  scene.add(shelf);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x87998b, 2));
  var light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(-3, 5, 6);
  scene.add(light);

  function addShelfPart(x, y, z, width, height, depth, color) {
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.75 })
    );
    mesh.position.set(x, y, z);
    shelf.add(mesh);
  }

  addShelfPart(-2.8, 0, 0, 0.12, 3.2, 0.65, "#617767");
  addShelfPart(2.8, 0, 0, 0.12, 3.2, 0.65, "#617767");
  for (var row = 0; row < 3; row++) {
    var y = 1.15 - row * 1.1;
    addShelfPart(0, y, 0, 5.7, 0.1, 0.8, "#819486");
  }

  var productMeshes = [];
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var hoveredProduct = null;
  var products = window.products || [];

  function productColor(product) {
    if (product.stock === 0 || window.isExpired(product.expiry)) { return "#bb665c"; }
    if (product.stock <= 10 || window.isNearExpiry(product.expiry)) { return "#d3a14f"; }
    return "#6f9c79";
  }

  function drawProducts() {
    for (var i = 0; i < productMeshes.length; i++) {
      shelf.remove(productMeshes[i]);
      productMeshes[i].geometry.dispose();
      productMeshes[i].material.dispose();
    }
    productMeshes = [];

    products = window.products || [];
    for (var j = 0; j < products.length; j++) {
      var column = j % 4;
      var rowIndex = Math.floor(j / 4);
      var box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.62, 0.48),
        new THREE.MeshStandardMaterial({ color: productColor(products[j]), roughness: 0.55 })
      );
      box.position.set(-2 + column * 1.33, 1.55 - rowIndex * 1.1, 0.12);
      box.userData.productIndex = j;
      shelf.add(box);
      productMeshes.push(box);
    }
  }

  function resizeShelf() {
    var width = stage.clientWidth;
    var height = stage.clientHeight;
    if (width === 0 || height === 0) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function findProduct(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(productMeshes);
    return hits.length ? products[hits[0].object.userData.productIndex] : null;
  }

  canvas.addEventListener("pointermove", function (event) {
    hoveredProduct = findProduct(event);
    canvas.style.cursor = hoveredProduct ? "pointer" : "grab";
    if (hoveredProduct) {
      tooltip.innerHTML = "<strong></strong><span></span>";
      tooltip.querySelector("strong").textContent = hoveredProduct.name;
      tooltip.querySelector("span").textContent = hoveredProduct.stock + " in stock";
      tooltip.style.left = Math.min(event.offsetX + 12, stage.clientWidth - 150) + "px";
      tooltip.style.top = Math.max(event.offsetY - 38, 8) + "px";
      tooltip.classList.remove("hidden");
    } else {
      tooltip.classList.add("hidden");
    }
  });

  canvas.addEventListener("pointerleave", function () {
    hoveredProduct = null;
    tooltip.classList.add("hidden");
  });

  canvas.addEventListener("click", function (event) {
    var product = findProduct(event);
    if (!product) { return; }
    window.showPage("inventory");
    document.getElementById("inv-search").value = product.name;
    window.renderInventory();
  });

  window.renderInventoryShelf = drawProducts;
  drawProducts();
  resizeShelf();
  window.addEventListener("resize", resizeShelf);

  function animate() {
    requestAnimationFrame(animate);
    shelf.rotation.y = Math.sin(Date.now() * 0.00035) * 0.06;
    renderer.render(scene, camera);
  }
  animate();
}
}
