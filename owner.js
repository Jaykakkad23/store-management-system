var user = checkSignedInUser("owner");
if (user !== null) {
  document.getElementById("user-name").textContent = user.name;
  var parts = user.name.split(" ");
  document.getElementById("user-initials").textContent = parts[0][0] + (parts[1] ? parts[1][0] : "");
  showPage("overview");
}

function showPage(pageName) {
  var pages = ["overview", "inventory", "sales", "shifts"];
  for (var i = 0; i < pages.length; i++) {
    document.getElementById("page-" + pages[i]).classList.add("hidden");
  }
  document.getElementById("page-" + pageName).classList.remove("hidden");
  var links = document.querySelectorAll(".nav-link");
  for (var j = 0; j < links.length; j++) { links[j].classList.remove("active"); }
  if (pageName === "overview") { links[0].classList.add("active"); document.getElementById("crumb-text").textContent = "Owner workspace / Overview"; renderOverview(); }
  if (pageName === "inventory") { links[1].classList.add("active"); document.getElementById("crumb-text").textContent = "Owner workspace / Inventory"; renderInventory(); }
  if (pageName === "sales") { links[2].classList.add("active"); document.getElementById("crumb-text").textContent = "Owner workspace / Sales"; renderSales(); }
  if (pageName === "shifts") { links[3].classList.add("active"); document.getElementById("crumb-text").textContent = "Owner workspace / Shifts"; renderShifts(); }
}

function makeStatCardHTML(label, value, note) {
  return '<div class="stat-card"><div class="stat-label">' + label + '</div>' +
    '<div class="stat-value">' + value + '</div><div class="stat-note">' + note + '</div></div>';
}

function renderOverview() {
  var todayList = getTodaySales();
  var revenue = getTodayRevenue();
  var totalStock = 0; var lowList = []; var nearList = [];
  for (var i = 0; i < products.length; i++) {
    totalStock += products[i].stock;
    if (products[i].stock < 10) { lowList.push(products[i]); }
    if (products[i].stock > 0 && isNearExpiry(products[i].expiry)) { nearList.push(products[i]); }
  }
  document.getElementById("overview-stats").innerHTML =
    makeStatCardHTML("Today's sales", formatMoney(revenue), todayList.length + " transactions") +
    makeStatCardHTML("Transactions", todayList.length, "Recorded today") +
    makeStatCardHTML("Items in stock", totalStock, products.length + " products") +
    makeStatCardHTML("Needs attention", lowList.length + " products", "Below 10 units");

  var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var heights = [37, 58, 45, 70, 54, 84, 66];
  var chartHTML = '';
  for (var d = 0; d < days.length; d++) {
    var cls = (d === 6) ? 'chart-day current' : 'chart-day';
    chartHTML += '<div class="' + cls + '"><span class="bar-track"><i style="height:' + heights[d] + '%"></i></span><span>' + days[d] + '</span></div>';
  }
  document.getElementById("sales-chart").innerHTML = chartHTML;
  var allRev = 0; var rescued = 0;
  for (var s = 0; s < sales.length; s++) { allRev += sales[s].total; rescued += (sales[s].rescuedUnits || 0); }
  document.getElementById("chart-total").textContent = formatMoney(allRev);
  document.getElementById("rescued-total").textContent = rescued;

  var lowHTML = '';
  for (var l = 0; l < lowList.length && l < 4; l++) {
    lowHTML += '<div class="stock-row"><div><strong>' + lowList[l].name + '</strong><small>' + lowList[l].category + '</small></div><span class="stock-count">' + lowList[l].stock + ' left</span></div>';
  }
  document.getElementById("low-stock-list").innerHTML = lowHTML || "<div class=\"empty-state\">All products well stocked</div>";

  var nearHTML = '';
  for (var n = 0; n < nearList.length; n++) {
    nearHTML += '<div class="stock-row"><div><strong>' + nearList[n].name + '</strong><small>Expires in ' + daysUntilExpiry(nearList[n].expiry) + ' days</small></div><span class="stock-count">' + nearList[n].stock + ' in stock</span></div>';
  }
  document.getElementById("near-expiry-list").innerHTML = nearHTML || "<div class=\"empty-state\">No products close to expiry</div>";
  renderSalesTable("recent-sales-wrap", sales.slice(0, 5));
  if (window.renderInventoryShelf) { window.renderInventoryShelf(); }
}

function renderInventory() {
  var q = document.getElementById("inv-search").value.toLowerCase();
  document.getElementById("inv-count").textContent = products.length;
  var html = ''; var shown = 0;
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    if ((p.name + " " + p.category).toLowerCase().indexOf(q) === -1) { continue; }
    shown++;
    var sClass = p.stock === 0 ? 'tag red' : (p.stock <= 10 ? 'tag warning' : 'tag');
    var sText = p.stock === 0 ? 'Out of stock' : (p.stock <= 10 ? 'Low stock' : 'In stock');
    html += '<tr><td>' + p.name + '</td><td>' + p.category + '</td><td>' + formatMoney(p.price) + '</td><td>' + p.stock + '</td><td>' + p.expiry + '</td>' +
      '<td><span class="' + sClass + '">' + sText + '</span></td><td><button class="button small" onclick="openProductModal(' + p.id + ')">Edit</button></td></tr>';
  }
  document.getElementById("inv-rows").innerHTML = html;
  document.getElementById("inv-empty").classList.toggle("hidden", shown > 0);
}

function openProductModal(productId) {
  document.getElementById("product-modal").classList.remove("hidden");
  if (productId === null) {
    document.getElementById("modal-title").textContent = "Add product";
    document.getElementById("modal-submit-btn").textContent = "Add product";
    document.getElementById("edit-id").value = "";
    document.getElementById("product-form").reset();
  } else {
    document.getElementById("modal-title").textContent = "Edit product";
    document.getElementById("modal-submit-btn").textContent = "Save changes";
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === productId) {
        document.getElementById("edit-id").value = products[i].id;
        document.getElementById("f-name").value = products[i].name;
        document.getElementById("f-category").value = products[i].category;
        document.getElementById("f-price").value = products[i].price;
        document.getElementById("f-stock").value = products[i].stock;
        document.getElementById("f-expiry").value = products[i].expiry;
      }
    }
  }
}
function closeProductModal() { document.getElementById("product-modal").classList.add("hidden"); }

document.getElementById("product-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var editId = document.getElementById("edit-id").value;
  var name = document.getElementById("f-name").value.trim();
  var category = document.getElementById("f-category").value.trim();
  var price = Number(document.getElementById("f-price").value);
  var stock = Number(document.getElementById("f-stock").value);
  var expiry = document.getElementById("f-expiry").value;
  if (editId === "") {
    products.unshift({ id: Date.now(), name: name, category: category, price: price, stock: stock, expiry: expiry });
  } else {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === Number(editId)) {
        products[i].name = name; products[i].category = category;
        products[i].price = price; products[i].stock = stock; products[i].expiry = expiry;
      }
    }
  }
  saveAllData(); closeProductModal(); renderInventory();
  showToast(editId === "" ? "Product added." : "Product updated.");
});