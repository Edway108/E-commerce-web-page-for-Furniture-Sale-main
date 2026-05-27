const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:")
  ? "http://localhost:8080"
  : "";

const CART_API = `${API_ORIGIN}/cart`;
const ORDER_API = `${API_ORIGIN}/api/v1/orders`;

let currentCart = null;
let currentItems = [];

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Server returned non-JSON response (${response.status}). ${text.slice(0, 120)}`);
  }
}

function checkAuth() {
  if (!getToken()) {
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

function productName(product) {
  return product?.product_name || product?.productName || product?.name || "Untitled product";
}

function productImage(product) {
  return product?.img || product?.imageUrl || product?.image || "";
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2);
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || item.product?.price || 0) * Number(item.quantity || 0), 0);
  const discount = subtotal >= 2000 ? subtotal * 0.05 : 0;
  const tax = (subtotal - discount) * 0.08;
  const shipping = subtotal <= 0 ? 0 : subtotal >= 1000 ? 0 : 40;
  const total = subtotal - discount + tax + shipping;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return { subtotal, discount, tax, shipping, total, itemCount };
}

async function loadCart() {
  if (!checkAuth()) return;
  setLoading(true);

  try {
    const response = await fetch(`${CART_API}/getcart?t=${Date.now()}`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    if (response.status === 404 || response.status === 204) {
      currentCart = null;
      currentItems = [];
      renderCheckout();
      return;
    }

    if (!response.ok) {
      const error = await readJsonSafely(response).catch(() => ({}));
      throw new Error(error.message || `Server error: ${response.status}`);
    }

    currentCart = await readJsonSafely(response);
    currentItems = Array.isArray(currentCart?.cartItems) ? currentCart.cartItems : [];
    renderCheckout();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Failed to load checkout", "error");
  } finally {
    setLoading(false);
  }
}

function renderCheckout() {
  const itemsBox = document.getElementById("summaryItems");
  const emptyBox = document.getElementById("checkoutEmpty");
  const linesBox = document.getElementById("summaryLines");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  if (!currentItems.length) {
    itemsBox.innerHTML = "";
    emptyBox.style.display = "block";
    linesBox.style.display = "none";
    placeOrderBtn.disabled = true;
    document.getElementById("summaryCount").textContent = "No items in cart";
    return;
  }

  emptyBox.style.display = "none";
  linesBox.style.display = "block";
  placeOrderBtn.disabled = false;

  itemsBox.innerHTML = currentItems.map((item) => {
    const product = item.product || {};
    const name = productName(product);
    const img = productImage(product);
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || product.price || 0);
    return `
      <article class="summary-item">
        ${img
          ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(name)}">`
          : `<div class="summary-placeholder">No image</div>`}
        <div>
          <h3>${escapeHtml(name)}</h3>
          <p>Qty: ${quantity}</p>
        </div>
        <strong>$${formatPrice(price * quantity)}</strong>
      </article>`;
  }).join("");

  const totals = calculateTotals(currentItems);
  document.getElementById("summaryCount").textContent = `${totals.itemCount} item${totals.itemCount > 1 ? "s" : ""} in your cart`;
  document.getElementById("subtotal").textContent = `$${formatPrice(totals.subtotal)}`;
  document.getElementById("discount").textContent = `-$${formatPrice(totals.discount)}`;
  document.getElementById("tax").textContent = `$${formatPrice(totals.tax)}`;
  document.getElementById("shipping").textContent = totals.shipping === 0 ? "Free" : `$${formatPrice(totals.shipping)}`;
  document.getElementById("grandTotal").textContent = `$${formatPrice(totals.total)}`;
}

function prefillCustomerInfo() {
  const username = localStorage.getItem("username") || "";
  const receiverName = document.getElementById("receiverName");
  if (receiverName && username) receiverName.value = username;
}

function validateCheckoutForm() {
  const address = document.getElementById("shippingAddress").value.trim();
  const phone = document.getElementById("receiverPhone").value.trim();
  const addressError = document.getElementById("addressError");
  const phoneError = document.getElementById("phoneError");
  let valid = true;

  addressError.textContent = "";
  phoneError.textContent = "";

  if (address.length < 8) {
    addressError.textContent = "Please enter a detailed shipping address.";
    valid = false;
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(phone)) {
    phoneError.textContent = "Please enter a valid phone number.";
    valid = false;
  }

  return valid;
}

async function submitCheckout() {
  if (!checkAuth()) return;
  if (!currentItems.length) {
    showToast("Your cart is empty", "error");
    return;
  }
  if (!validateCheckoutForm()) return;

  const placeOrderBtn = document.getElementById("placeOrderBtn");
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing order...";

  const receiverName = document.getElementById("receiverName").value.trim();
  const deliveryTime = document.getElementById("deliveryTime").value;
  const note = document.getElementById("orderNote").value.trim();
  const fullNote = [
    receiverName ? `Receiver: ${receiverName}` : "",
    deliveryTime ? `Preferred delivery: ${deliveryTime}` : "",
    note,
  ].filter(Boolean).join(" | ");

  const payload = {
    shippingAddress: document.getElementById("shippingAddress").value.trim(),
    receiverPhone: document.getElementById("receiverPhone").value.trim(),
    paymentMethod: document.getElementById("paymentMethod").value,
    note: fullNote,
  };

  try {
    const response = await fetch(`${ORDER_API}/checkout`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await readJsonSafely(response).catch(() => ({}));
      throw new Error(error.message || "Checkout failed");
    }

    const order = await readJsonSafely(response);
    currentCart = null;
    currentItems = [];
    renderCheckout();
    document.getElementById("successText").textContent = `Your order ${order.orderCode || ""} has been created successfully.`;
    document.getElementById("successModal").style.display = "flex";
  } catch (error) {
    showToast(error.message || "Checkout failed", "error");
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place order";
  }
}

function setLoading(isLoading) {
  document.getElementById("checkoutLoading").style.display = isLoading ? "flex" : "none";
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = "toast"; }, 3000);
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  prefillCustomerInfo();
  loadCart();
});
