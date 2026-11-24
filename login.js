var loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  var email = document.getElementById("email").value.trim().toLowerCase();
  var password = document.getElementById("password").value;
  var foundUser = null;

  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].email === email && accounts[i].password === password) {
      foundUser = accounts[i];
      break;
    }
  }

  if (foundUser === null) {
    document.getElementById("login-error").textContent = "Email or password is incorrect.";
    return;
  }

  sessionStorage.setItem("stockshift-user", JSON.stringify(foundUser));
  if (foundUser.role === "owner") {
    location.href = "owner.html";
  } else {
    location.href = "cashier.html";
  }
});
