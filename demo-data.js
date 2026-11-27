var accounts = [
  {email: "owner@test.com" , password: "owner", name: "J&M pvt.ltd" , role: "owner"},
    {email: "cashier@test.com" , password: "cashier", name: "cashier normie" , role: "cashier"} 
];

var defaultProducts = [
    { id: 1, name: "Tata Salt 1kg", category: "Grocery", price: 28, stock: 23, expiry: "2026-12-16" },
    { id: 2, name: "Nirma Salt", category: "Grocery", price: 26, stock: 27, expiry: "2027-12-16" },
    { id: 3, name: "Amul Gold 500ml", category: "Dairy", price: 37, stock: 2, expiry: "2026-11-22" },
    { id: 4, name: "Amul Taza 500ml", category: "Dairy", price: 31, stock: 16, expiry: "2026-11-19" },
    { id: 5, name: "Good Day", category: "Snacks", price: 20, stock: 43, expiry: "2027-12-16" },
    { id: 6, name: "Kurkure", category: "Snacks", price: 36, stock: 23, expiry: "2027-12-16" },
    { id: 7, name: "Monster Ultra 350ml", category: "Drinks", price: 109, stock: 63, expiry: "2028-6-12" },
    { id: 8, name: "Diet Coke", category: "Drinks", price: 50, stock: 15, expiry: "2028-1-22" },
    { id: 9, name: "Face Wash", category: "Personal Care", price: 28, stock: 23, expiry: "2026-12-16" },
    { id: 10, name: "Wet Wipes", category: "Personal Care", price: 28, stock: 23, expiry: "2026-12-16" }
];

var defaultSales = [
   { id: "SS-23", cashier: "Manan", total: 486, time: "Today, 11:42 AM", items: 5, NearExpirySold: 0 },
   { id: "SS-22", cashier: "Cashier Normie", total: 712, time: "Today, 11:42 AM", items: 7, NearExpirySold: 1 },
   { id: "SS-21", cashier: "Manan", total: 350, time: "Today, 11:42 AM", items: 6, NearExpirySold: 2 },
   { id: "SS-20", cashier: "Manan", total: 220, time: "Today, 11:42 AM", items: 4, NearExpirySold: 0 },
];

function loadData(key, fallback) {
  var saved = localStorage.getItem(key);
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return JSON.parse(JSON.stringify(fallback));
}

var products = loadData("stockshift-products", defaultProducts);
var sales = loadData("stockshift-sales", defaultSales);
var shifts = loadData("stockshift-shifts", []);

function saveAllData() {
  localStorage.setItem("stockshift-products", JSON.stringify(products));
  localStorage.setItem("stockshift-sales", JSON.stringify(sales));
  localStorage.setItem("stockshift-shifts", JSON.stringify(shifts));
}

function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

function formatMoney(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN");
}

function daysUntilExpiry(dateText) {
  var expiryDate = new Date(dateText + "T00:00:00");
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var diffMs = expiryDate - today;
  return Math.ceil(diffMs / 86400000);
}

function isNearExpiry(dateText) {
  var days = daysUntilExpiry(dateText);
  return days >= 0 && days <= 30;
}

function isExpired(dateText) {
  return daysUntilExpiry(dateText) < 0;
}

function getTodaySales() {
  var list = [];
  for (var i = 0; i < sales.length; i++) {
    if (sales[i].time.indexOf("Today") === 0) {
      list.push(sales[i]);
    }
  }
  return list;
}

function getTodayRevenue() {
  var list = getTodaySales();
  var total = 0;
  for (var i = 0; i < list.length; i++) {
    total = total + list[i].total;
  }
  return total;
}

function nextSaleId() {
  var num = 1049 + sales.length - defaultSales.length;
  return "SS-" + num;
}

function getActiveShift() {
  var saved = localStorage.getItem("stockshift-active-shift");
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return null;
}

function setActiveShift(shift) {
  if (shift !== null) {
    localStorage.setItem("stockshift-active-shift", JSON.stringify(shift));
  } else {
    localStorage.removeItem("stockshift-active-shift");
  }
}

function startShift(cashierName, openingCash) {
  if (getActiveShift() !== null) { return null; }
  var shift = {
    id: "SHIFT-" + Date.now(),
    cashier: cashierName,
    startedAt: new Date().toISOString(),
    openingCash: openingCash,
    cashSales: 0,
    transactions: 0
  };
  setActiveShift(shift);
  return shift;
}

function closeShift(countedCash, note) {
  var active = getActiveShift();
  if (active === null) { return null; }
  var expected = roundMoney(active.openingCash + active.cashSales);
  var counted = roundMoney(countedCash);
  var closed = {
    id: active.id, cashier: active.cashier, startedAt: active.startedAt,
    openingCash: active.openingCash, cashSales: active.cashSales,
    transactions: active.transactions, closedAt: new Date().toISOString(),
    expectedCash: expected, countedCash: counted,
    difference: roundMoney(counted - expected), note: note
  };
  shifts.unshift(closed);
  setActiveShift(null);
  saveAllData();
  return closed;
}

function checkSignedInUser(requiredRole) {
  var saved = sessionStorage.getItem("stockshift-user");
  if (saved === null) {
    location.replace("index.html");
    return null;
  }
  var user = JSON.parse(saved);
  if (user.role !== requiredRole) {
    location.replace("index.html");
    return null;
  }
  return user;
}

function signOut() {
  sessionStorage.removeItem("stockshift-user");
  location.href = "index.html";
}

function showToast(message) {
  var old = document.querySelector(".toast");
  if (old !== null) { old.remove(); }
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 2600);
}