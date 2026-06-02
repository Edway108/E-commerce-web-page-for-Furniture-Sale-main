const API = "http://127.0.0.1:8080/cart";

let currentCart = null;

// AUTH
function getToken() {
  return localStorage.getItem("token") || "";
}

async function checkAuth() {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// FETCH CART
async function fetchAll() {
  // Trong fetchAll, thêm log này
  // xem structure thật sự
  if (!(await checkAuth())) return;
  let token = localStorage.getItem("token");

  showLoading(true);

  try {
    const res = await fetch(`${API}/getcart`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const cart = await res.json();
    console.log("cart data:", JSON.stringify(cart));
    currentCart = cart;

    const items = cart?.cartItems || [];

    renderGrid(items);
    updateSummary(items);
  } catch (err) {
    console.error(err);
    showToast("Failed to load cart", "error");
  }
}

// DELETE CART
async function deleteCart() {
  if (!(await checkAuth())) return;
  if (!currentCart) return;

  const cartId = currentCart.cartId;
  try {
    const res = await fetch(`${API}/${cartId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error();

    currentCart = null;
    renderGrid([]);
    updateSummary([]);
    showToast("Cart cleared", "success");
  } catch {
    showToast("Delete failed", "error");
  }
}

// RENDER
function renderGrid(items) {
  showLoading(false);

  document.getElementById("cartBadge").textContent = items.length;
  const grid = document.getElementById("grid");

  if (!items.length) {
    document.getElementById("emptyState").style.display = "flex";
    grid.innerHTML = "";
    return;
  }

  document.getElementById("emptyState").style.display = "none";

  grid.innerHTML = items
    .map(
      (item) => `
      <div class="card">
        ${
          item.product?.img
            ? `<img src="${item.product.img}" class="card-img">`
            : `<div class="card-img-placeholder">No Image</div>`
        }
        <div class="card-body">
          <div class="card-name">${
            item.product?.product_name ?? item.product?.productName
          }</div>
          <div class="card-price">$${formatPrice(item.price)}</div>
          <div>Qty: ${item.quantity}</div>
          <button 
            class="delete-btn" 
            onclick="deleteItem(${item.product?.id})"
          >
            🗑 Remove
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// SUMMARY
function updateSummary(items) {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  document.getElementById("subtotal").textContent = `$${formatPrice(subtotal)}`;
}

// HELPERS
function showLoading(on) {
  document.getElementById("loadingState").style.display = on ? "flex" : "none";
}

function formatPrice(val) {
  return Number(val).toFixed(2);
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show";
  setTimeout(() => (el.className = "toast"), 3000);
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  fetchAll();
});
function logout() {
  localStorage.removeItem("user");
  localStorage.clear;
  window.location = "login.html";
}

async function deleteItem(productId) {
  if (!(await checkAuth())) return;

  try {
    const res = await fetch(`${API}/item`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ productId: productId }),
    });

    if (!res.ok) throw new Error();

    showToast("Item removed", "success");
    await fetchAll(); // re-fetch lại cart
  } catch {
    showToast("Failed to remove item", "error");
  }
}
