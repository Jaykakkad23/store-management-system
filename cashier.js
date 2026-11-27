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