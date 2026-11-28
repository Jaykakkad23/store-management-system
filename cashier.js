var user = checkSignedInUser("cashier");
var cart = [];

if (user !== null) {
  document.getElementById("user-name").textContent = user.name;
  var parts = user.name.split(" ");
  document.getElementById("user-initials").textContent = parts[0][0] + (parts[1] ? parts[1][0] : "");
  if (getActiveShift() !== null) {
    showPage("pos");
  } else {
    showPage("shift");
  }
}

function showPage(pageName) {
  document.getElementById("page-pos").classList.add("hidden");
  document.getElementById("page-inventory").classList.add("hidden");
  document.getElementById("page-shift").classList.add("hidden");
  document.getElementById("page-" + pageName).classList.remove("hidden");

  var links = document.querySelectorAll(".nav-link");
  for (var i = 0; i < links.length; i++) {
    links[i].classList.remove("active");
  }
  if (pageName === "pos") { links[0].classList.add("active"); document.getElementById("crumb-text").textContent = "Cashier workspace / Checkout"; renderCheckout(); }
  if (pageName === "inventory") { links[1].classList.add("active"); document.getElementById("crumb-text").textContent = "Cashier workspace / Inventory"; renderInventory(); }
  if (pageName === "shift") { links[2].classList.add("active"); document.getElementById("crumb-text").textContent = "Cashier workspace / Shift handover"; renderShift(); }
}

function renderCheckout() {
  var q = document.getElementById("pos-search").value.toLowerCase();
  document.getElementById("pos-count").textContent = products.length;
  var html = "";
  var shown = 0;
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var text = (p.name + " " + p.category).toLowerCase();
    if (text.indexOf(q) === -1) { continue; }
    shown++;
    var expired = isExpired(p.expiry);
    var disabled = (p.stock === 0 || expired) ? 'disabled' : '';
    var badge = '';
    if (expired) { badge = '<span class="expiry-badge expired">Expired</span>'; }
    else if (isNearExpiry(p.expiry)) { badge = '<span class="expiry-badge">Expires in ' + daysUntilExpiry(p.expiry) + 'd</span>'; }
    html += '<button class="product-card" ' + disabled + ' onclick="addToCart(' + p.id + ', this)">' +
      '<span class="product-type">' + p.category + '</span>' +
      '<span class="product-name">' + p.name + '</span>' + badge +
      '<span class="product-bottom"><span>' + formatMoney(p.price) + '</span><span class="product-stock">' + p.stock + ' in stock</span></span></button>';
  }
  document.getElementById("product-grid").innerHTML = html;
  document.getElementById("pos-empty").classList.toggle("hidden", shown > 0);
  renderCart();
}

function addToCart(productId, button) {
  var p = null;
  for (var i = 0; i < products.length; i++) { if (products[i].id === productId) { p = products[i]; break; } }
  if (p === null || p.stock < 1) { return; }
  var existing = null;
  for (var j = 0; j < cart.length; j++) { if (cart[j].id === productId) { existing = cart[j]; break; } }
  p.stock -= 1;
  if (existing !== null) { existing.qty += 1; } else { cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 }); }
  button.classList.remove("shake");
  void button.offsetWidth;
  button.classList.add("shake");
  button.querySelector(".product-stock").textContent = p.stock + " in stock";
  button.disabled = p.stock === 0;
  renderCart();
}

function changeQty(productId, delta) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === productId) {
      var p = null;
      for (var k = 0; k < products.length; k++) { if (products[k].id === productId) { p = products[k]; } }
      var nextQty = cart[i].qty + delta;
      if (delta > 0 && p.stock < 1) { showToast('Not enough stock.'); return; }
      p.stock -= delta;
      if (nextQty < 1) { cart.splice(i, 1); } else { cart[i].qty = nextQty; }
      break;
    }
  }
  renderCheckout();
}

function clearCart() {
  for (var i = 0; i < cart.length; i++) {
    for (var j = 0; j < products.length; j++) {
      if (products[j].id === cart[i].id) { products[j].stock += cart[i].qty; }
    }
  }
  cart = [];
  renderCheckout();
}

function renderCart() {
  var shift = getActiveShift();
  var count = 0; var total = 0; var html = '';
  for (var i = 0; i < cart.length; i++) {
    count += cart[i].qty;
    total += cart[i].price * cart[i].qty;
    html += '<div class="cart-item"><div><strong>' + cart[i].name + '</strong><small>' + formatMoney(cart[i].price) + ' each</small></div>' +
      '<div class="quantity"><button onclick="changeQty(' + cart[i].id + ',-1)">-</button><span>' + cart[i].qty + '</span><button onclick="changeQty(' + cart[i].id + ',1)">+</button></div></div>';
  }
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = formatMoney(total);
  document.getElementById("cart-items").innerHTML = html;
  document.getElementById("cart-empty").classList.toggle("hidden", cart.length > 0);
  document.getElementById("shift-required-banner").classList.toggle("hidden", shift !== null);
  document.getElementById("complete-sale-btn").disabled = (cart.length === 0 || shift === null);
}
function completeSale() {
  var shift = getActiveShift();
  if (cart.length === 0 || shift === null) { return; }
  var total = 0; var itemsCount = 0; var rescued = 0;
  for (var i = 0; i < cart.length; i++) {
    for (var j = 0; j < products.length; j++) {
      if (products[j].id === cart[i].id) {
        if (isNearExpiry(products[j].expiry)) { rescued += cart[i].qty; }
      }
    }
    total += cart[i].price * cart[i].qty;
    itemsCount += cart[i].qty;
  }
  total = roundMoney(total);
  var now = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  sales.unshift({ id: nextSaleId(), cashier: user.name, total: total, time: "Today, " + now, items: itemsCount, rescuedUnits: rescued });
  shift.cashSales = roundMoney(shift.cashSales + total);
  shift.transactions += 1;
  setActiveShift(shift);
  saveAllData();
  cart = [];
  renderCheckout();
  showToast("Sale complete · " + formatMoney(total));
}

function renderInventory() {
  var q = document.getElementById("inv-search").value.toLowerCase();
  document.getElementById("inv-count").textContent = products.length;
  var html = ''; var shown = 0;
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    if ((p.name + " " + p.category).toLowerCase().indexOf(q) === -1) { continue; }
    shown++;
    var statusClass = p.stock === 0 ? 'tag red' : (p.stock <= 10 ? 'tag warning' : 'tag');
    var statusText = p.stock === 0 ? 'Out of stock' : (p.stock <= 10 ? 'Low stock' : 'In stock');
    html += '<tr><td>' + p.name + '</td><td>' + p.category + '</td><td>' + formatMoney(p.price) + '</td>' +
      '<td>' + p.stock + '</td><td>' + p.expiry + '</td><td><span class="' + statusClass + '">' + statusText + '</span></td></tr>';
  }
  document.getElementById("inv-rows").innerHTML = html;
  document.getElementById("inv-empty").classList.toggle("hidden", shown > 0);
}

function renderShift() {
  var active = getActiveShift();
  document.getElementById("shift-start-panel").classList.toggle("hidden", active !== null);
  document.getElementById("shift-active-panel").classList.toggle("hidden", active === null);
  document.getElementById("shift-close-panel").classList.add("hidden");
  document.getElementById("shift-last-panel").classList.toggle("hidden", active !== null || shifts.length === 0);
  if (active !== null) {
    document.getElementById("shift-started-at").textContent = "Started " + new Date(active.startedAt).toLocaleString("en-IN");
    document.getElementById("m-opening").textContent = formatMoney(active.openingCash);
    document.getElementById("m-sales").textContent = formatMoney(active.cashSales);
    document.getElementById("m-expected").textContent = formatMoney(active.openingCash + active.cashSales);
    document.getElementById("m-tx").textContent = active.transactions;
  } else if (shifts.length > 0) {
    var last = shifts[0];
    document.getElementById("last-shift-time").textContent = "Closed " + new Date(last.closedAt).toLocaleString("en-IN");
    document.getElementById("last-shift-status").textContent = last.difference === 0 ? "Balanced" : (last.difference > 0 ? "Over" : "Short");
    document.getElementById("last-expected").textContent = formatMoney(last.expectedCash);
    document.getElementById("last-counted").textContent = formatMoney(last.countedCash);
    document.getElementById("last-diff").textContent = formatMoney(Math.abs(last.difference));
    document.getElementById("last-note").textContent = last.note || "No handover note.";
  }
}

function toggleCloseShift(show) {
  document.getElementById("shift-active-panel").classList.toggle("hidden", show);
  document.getElementById("shift-close-panel").classList.toggle("hidden", !show);
  if (show) {
    var active = getActiveShift();
    document.getElementById("close-expected").textContent = formatMoney(active.openingCash + active.cashSales);
  }
}

document.getElementById("pos-search").addEventListener("input", renderCheckout);
document.getElementById("inv-search").addEventListener("input", renderInventory);
document.getElementById("start-shift-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var cash = Number(document.getElementById("opening-cash").value);
  startShift(user.name, cash);
  showPage("pos");
  showToast("Shift started.");
});
document.getElementById("close-shift-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var counted = Number(document.getElementById("counted-cash").value);
  var note = document.getElementById("shift-note").value.trim();
  closeShift(counted, note);
  cart = [];
  renderShift();
  showToast("Shift closed.");
});