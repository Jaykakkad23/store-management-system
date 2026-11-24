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