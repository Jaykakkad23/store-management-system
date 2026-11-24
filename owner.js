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