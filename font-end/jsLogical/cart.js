const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:")
  ? "http://localhost:8080"
  : "";

const API = `${API_ORIGIN}/cart`;
const ORDER_API = `${API_ORIGIN}/api/v1/orders`;

let currentCart = null;

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Server returned non-JSON response (${response.status}). ${text.slice(0, 120)}`);
  }
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function checkAuth() {
  const user = localStorage.getItem("user");
  if (!user || !getToken()) {
    alert("Please login first!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

<<<<<<< HEAD
function productName(product) {
  return product?.product_name || product?.productName || product?.name || "Untitled product";
}
=======
// FETCH CART
async function fetchAll() {
  if (!(await checkAuth())) return;
  let token = localStorage.getItem("token");
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)

function productIdFromItem(item) {
  return item?.product?.id || item?.productId || item?.id;
}

async function fetchAll() {
  if (!(await checkAuth())) return;
  showLoading(true);

  try {
    const res = await fetch(`${API}/getcart`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    if (res.status === 404 || res.status === 204) {
      currentCart = null;
      renderGrid([]);
      updateSummary([]);
      return;
    }

<<<<<<< HEAD
    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || `Server error: ${res.status}`);
    }
=======
    const cart = await res.json();
    currentCart = cart;
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)

    const cart = await readJsonSafely(res);
    currentCart = cart && cart.cartId ? cart : null;
    const items = currentCart?.cartItems || [];

    renderGrid(items);
    updateSummary(items);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to load cart", "error");
  } finally {
    showLoading(false);
  }
}

async function deleteCart() {
  if (!(await checkAuth())) return;
  if (!currentCart || !(currentCart.cartItems || []).length) {
    showToast("Cart is already empty", "error");
    return;
  }
  if (!confirm("Remove all items from cart?")) return;

<<<<<<< HEAD
=======
  const cartId = currentCart.cartId;

>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
  try {
    const res = await fetch(`${API}/${currentCart.cartId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || "Delete failed");
    }

    currentCart = null;
    renderGrid([]);
    updateSummary([]);
    showToast("Cart cleared", "success");
  } catch (error) {
    showToast(error.message || "Delete failed", "error");
  }
}

function renderGrid(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalQty = safeItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.getElementById("cartBadge").textContent = totalQty;
  const grid = document.getElementById("grid");

  if (!safeItems.length) {
    document.getElementById("emptyState").style.display = "flex";
    grid.innerHTML = "";
    return;
  }

  document.getElementById("emptyState").style.display = "none";

<<<<<<< HEAD
  grid.innerHTML = safeItems
    .map((item) => {
      const product = item.product || {};
      const id = productIdFromItem(item);
      const name = productName(product);
      const img = product.img ? escapeHtml(product.img) : "";
      const price = Number(item.price ?? product.price ?? 0);
      const quantity = Number(item.quantity || 0);
      return `
        <div class="card">
          ${img
            ? `<img src="${img}" class="card-img" alt="${escapeHtml(name)}">`
            : `<div class="card-img-placeholder">No Image</div>`}
          <div class="card-body">
            <div class="card-tag">Furniture</div>
            <div class="card-name">${escapeHtml(name)}</div>
            <div class="card-meta">
              <span class="card-price">$${formatPrice(price)}</span>
              <span class="card-qty">Qty: ${quantity}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-icon btn-delete" title="Remove item" onclick="deleteItem(${Number(id)})">🗑</button>
          </div>
        </div>`;
    })
=======
  grid.innerHTML = items
    .map(
      (item, idx) => `
      <div class="card">
        ${
          item.product?.img
            ? `<img src="${item.product.img}" class="card-img">`
            : `<div class="card-img-placeholder">No Image</div>`
        }
        <div class="card-body">
          <div class="card-name">${item.product?.product_name}</div>
          <div class="card-price">$${formatPrice(item.price)}</div>
          <div>Qty: ${item.quantity}</div>
        </div>
      </div>
    `
    )
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
    .join("");
}

function calculateTotals(items) {
  const subtotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
  const itemCount = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const shipping = subtotal <= 0 ? 0 : subtotal >= 1000 ? 0 : 40;
  const grandTotal = subtotal + shipping;
  return { subtotal, itemCount, shipping, grandTotal };
}

function updateSummary(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const { subtotal, itemCount, shipping, grandTotal } = calculateTotals(safeItems);

  document.getElementById("itemCount").textContent = itemCount;
  document.getElementById("subtotal").textContent = `$${formatPrice(subtotal)}`;
  document.getElementById("shipping").textContent = shipping === 0 ? (subtotal > 0 ? "Free" : "—") : `$${formatPrice(shipping)}`;
  document.getElementById("grandTotal").textContent = `$${formatPrice(grandTotal)}`;

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.disabled = itemCount === 0;
}

function showLoading(on) {
  document.getElementById("loadingState").style.display = on ? "flex" : "none";
}

function formatPrice(val) {
  return Number(val || 0).toFixed(2);
}

function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => (el.className = "toast"), 3000);
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}
<<<<<<< HEAD

async function deleteItem(productId) {
  if (!(await checkAuth())) return;
  if (!productId || Number.isNaN(Number(productId))) {
    showToast("Invalid product item", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/item/${productId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || "Failed to remove item");
    }

    showToast("Item removed", "success");
    await fetchAll();
  } catch (error) {
    showToast(error.message || "Failed to remove item", "error");
  }
}

function openCheckout() {
  const items = currentCart?.cartItems || [];
  if (!items.length) {
    showToast("Your cart is empty", "error");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById("shippingAddress").value = user.address || "";
  document.getElementById("receiverPhone").value = user.phonenumber || user.phoneNumber || "";
  document.getElementById("orderNote").value = "";
  document.getElementById("paymentMethod").value = "COD";
  document.getElementById("checkoutModal").style.display = "flex";
}

function closeCheckout() {
  document.getElementById("checkoutModal").style.display = "none";
}

async function submitCheckout() {
  if (!(await checkAuth())) return;

  const shippingAddress = document.getElementById("shippingAddress").value.trim();
  const receiverPhone = document.getElementById("receiverPhone").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const note = document.getElementById("orderNote").value.trim();

  if (!shippingAddress) {
    showToast("Please enter shipping address", "error");
    return;
  }
  if (!receiverPhone) {
    showToast("Please enter receiver phone", "error");
    return;
  }

  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.textContent = "Placing...";

  try {
    const res = await fetch(`${ORDER_API}/checkout`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ shippingAddress, receiverPhone, paymentMethod, note }),
    });

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || "Checkout failed");
    }

    const order = await readJsonSafely(res);
    closeCheckout();
    currentCart = null;
    renderGrid([]);
    updateSummary([]);
    showToast(`Order placed successfully: ${order.orderCode || "completed"}`, "success");
  } catch (error) {
    showToast(error.message || "Checkout failed", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAll();
});
=======
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
