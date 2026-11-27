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
