const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:")
  ? "http://localhost:8080"
  : "";

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Server returned non-JSON response (${response.status}). ${text.slice(0, 120)}`);
  }
}

const BASE_URL = API_ORIGIN;
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` }; }
function requireAdmin() { const role = (localStorage.getItem("role") || "").toUpperCase(); if (!["ADMIN", "MANAGER"].includes(role)) { alert("Admin/Manager access required"); window.location.href = "login.html"; } }

/* ================= SIDEBAR ================= */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

/* ================= DROPDOWN ================= */
function toggleDropdown(id, el) {
  const menu = document.getElementById(id);
  menu.classList.toggle("open");
  el.classList.toggle("open");
}

/* ================= SECTION ================= */
function showSection(name) {
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active");
  document.getElementById("page-title").innerText = name
    .replace("-", " ")
    .toUpperCase();

  if (name === "dashboard") loadDashboard();
  if (name === "product-list") loadProducts();
  if (name === "user-list") loadUsers();
}

/* ================= MODAL ENGINE ================= */

/**
 * Inject modal CSS once
 */
function injectModalStyles() {
  if (document.getElementById("modal-styles")) return;
  const style = document.createElement("style");
  style.id = "modal-styles";
  style.textContent = `
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      z-index: 999;
      animation: mFadeIn 0.15s ease;
    }
    @keyframes mFadeIn { from { opacity:0 } to { opacity:1 } }
    .modal-box {
      background: var(--white);
      width: 420px; max-width: 90vw;
      padding: 36px 32px;
      border: 1px solid #e0d8cc;
      animation: mSlideUp 0.18s ease;
    }
    @keyframes mSlideUp {
      from { transform: translateY(10px); opacity:0 }
      to   { transform: translateY(0);    opacity:1 }
    }
    .modal-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px; font-weight: 300;
      color: var(--walnut);
      margin-bottom: 24px;
    }
    .modal-field { margin-bottom: 16px; }
    .modal-label {
      display: block;
      font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--mist);
      margin-bottom: 6px;
    }
    .modal-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0d8cc;
      background: var(--white);
      font-size: 13px; color: var(--ink);
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }
    .modal-input:focus { border-color: var(--walnut); }
    .modal-actions {
      display: flex; gap: 10px;
      margin-top: 24px;
    }
    .btn-modal-confirm {
      flex: 1; padding: 11px;
      background: var(--walnut); color: var(--white);
      border: none; cursor: pointer;
      font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: background 0.2s;
    }
    .btn-modal-confirm:hover { background: var(--walnut-light); }
    .btn-modal-cancel {
      flex: 1; padding: 11px;
      background: none; color: var(--walnut);
      border: 1px solid #e0d8cc;
      cursor: pointer;
      font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: background 0.2s;
    }
    .btn-modal-cancel:hover { background: var(--parchment); }
  `;
  document.head.appendChild(style);
}

/**
 * Generic modal builder.
 * @param {string} title - Modal heading
 * @param {Array}  fields - [{ id, label, type?, placeholder?, value? }]
 * @param {string} confirmLabel - Text on the confirm button
 * @returns {Promise<Object|null>} - Object of { fieldId: value } or null if cancelled
 */
function openModal(title, fields, confirmLabel = "Save") {
  injectModalStyles();

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const fieldsHTML = fields
      .map(
        (f) => `
      <div class="modal-field">
        <label class="modal-label" for="mf-${f.id}">${f.label}</label>
        <input
          class="modal-input"
          id="mf-${f.id}"
          type="${f.type || "text"}"
          placeholder="${f.placeholder || ""}"
          value="${f.value || ""}"
        />
      </div>
    `
      )
      .join("");

    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        ${fieldsHTML}
        <div class="modal-actions">
          <button class="btn-modal-cancel" id="modal-cancel">Cancel</button>
          <button class="btn-modal-confirm" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Focus first input
    const firstInput = overlay.querySelector(".modal-input");
    if (firstInput) firstInput.focus();

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });

    overlay
      .querySelector("#modal-cancel")
      .addEventListener("click", () => close(null));

    overlay.querySelector("#modal-confirm").addEventListener("click", () => {
      const result = {};
      fields.forEach((f) => {
        result[f.id] = overlay.querySelector(`#mf-${f.id}`).value;
      });
      close(result);
    });

    // Keyboard: Enter = confirm, Esc = cancel
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        overlay.querySelector("#modal-confirm").click();
      }
      if (e.key === "Escape") close(null);
    });

    function close(data) {
      overlay.remove();
      resolve(data);
    }
  });
}

/* ================= DASHBOARD ================= */
async function loadDashboard() {
  const [prodRes, userRes] = await Promise.all([
    fetch(`${BASE_URL}/products/findall`, { headers: authHeaders() }),
    fetch(`${BASE_URL}/users/findall`, { headers: authHeaders() }),
  ]);
  const products = await prodRes.json();
  const users = await userRes.json();

  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalStock = products.reduce(
    (s, p) => s + (Number(p.quantity) || 0),
    0
  );
  const outOfStock = products.filter((p) => Number(p.quantity) === 0).length;

  // 5 most recent products (last in array = newest by ID)
  const recent = [...products].reverse().slice(0, 5);

  const section = document.getElementById("section-dashboard");
  section.innerHTML = `
    <h1>Dashboard</h1>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Products</div>
        <div class="stat-value">${totalProducts}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Users</div>
        <div class="stat-value">${totalUsers}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Items in Stock</div>
        <div class="stat-value">${totalStock.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Out of Stock</div>
        <div class="stat-value" style="color:var(--danger)">${outOfStock}</div>
      </div>
    </div>

    <h2 style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;color:var(--walnut);margin-bottom:16px;">
      Recent Products
    </h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:68px">Image</th>
          <th>Name</th>
          <th>Price</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${recent
          .map(
            (p) => `
          <tr>
            <td>
              ${
                p.img
                  ? `<img src="${p.img}" alt="${p.productName}"
                      style="width:48px;height:48px;object-fit:cover;border:1px solid #e0d8cc;display:block;"
                      onerror="this.replaceWith(noImg())" />`
                  : `<div style="width:48px;height:48px;background:var(--parchment);border:1px solid #e0d8cc;"></div>`
              }
            </td>
            <td>${p.productName}</td>
            <td>${p.price.toLocaleString()}</td>
            <td>${p.quantity}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const res = await fetch(`${BASE_URL}/products/findall`, { headers: authHeaders() });
  const data = await readJsonSafely(res);

  const section = document.getElementById("section-product-list");

  let html = `
    <h1>Products</h1>
    <button class="btn-add" onclick="openAddModal('product')">+ Add Product</button>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:72px">Image</th>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((p) => {
    const imgCell = p.img
      ? `<img src="${p.img}" alt="${p.productName}"
            style="width:52px;height:52px;object-fit:cover;border:1px solid #e0d8cc;display:block;"
            onerror="this.replaceWith(noImg())" />`
      : `<div style="width:52px;height:52px;background:var(--parchment);border:1px solid #e0d8cc;"></div>`;

    html += `
      <tr>
        <td>${imgCell}</td>
        <td>${p.id}</td>
        <td>${p.productName}</td>
        <td>${p.price}</td>
        <td>${p.quantity}</td>
        <td>
          <button onclick="editProduct(${p.id})">Edit</button>
          <button onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  section.innerHTML = html;
}

function noImg() {
  const d = document.createElement("div");
  d.style.cssText =
    "width:52px;height:52px;background:var(--parchment);border:1px solid #e0d8cc;";
  return d;
}

/* ================= DELETE PRODUCT ================= */
async function deleteProduct(id) {
  if (!(await confirmModal("Are you sure you want to delete this product?")))
    return;
  await fetch(`${BASE_URL}/products/${id}`, { method: "DELETE", headers: authHeaders() });
  loadProducts();
}

/**
 * Lightweight confirm-only modal (no input fields).
 */
function confirmModal(message) {
  injectModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title" style="font-size:22px">Confirm</div>
        <p style="font-size:14px;color:var(--ink);margin-bottom:0">${message}</p>
        <div class="modal-actions">
          <button class="btn-modal-cancel" id="modal-cancel">Cancel</button>
          <button class="btn-modal-confirm" id="modal-confirm" style="background:var(--danger)">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#modal-cancel").addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
    overlay.querySelector("#modal-confirm").addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        resolve(false);
      }
    });
  });
}

/* ================= EDIT PRODUCT ================= */
async function editProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  const p = await readJsonSafely(res);

  const data = await openModal(
    "Edit Product",
    [
      { id: "product_name", label: "Name", value: p.productName },
      { id: "price", label: "Price", value: p.price, type: "number" },
      { id: "quantity", label: "Quantity", value: p.quantity, type: "number" },
      { id: "description", label: "Description", value: p.description },
      {
        id: "img",
        label: "Image URL",
        value: p.img,
        placeholder: "https://...",
      },
    ],
    "Save Changes"
  );

  if (!data) return;

  await fetch(`${BASE_URL}/products/update/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      product_name: data.product_name,
      price: data.price,
      quantity: data.quantity,
      description: data.description,
      img: data.img,
    }),
  });

  loadProducts();
}

/* ================= LOAD USERS ================= */
async function loadUsers() {
  const res = await fetch(`${BASE_URL}/users/findall`, { headers: authHeaders() });
  const data = await readJsonSafely(res);

  const section = document.getElementById("section-user-list");

  let html = `
    <h1>Users</h1>
    <button class="btn-add" onclick="openAddModal('user')">+ Add User</button>
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Username</th><th>Phone</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((u) => {
    html += `
      <tr>
        <td>${u.userId}</td>
        <td>${u.username}</td>
        <td>${u.phonenumber || ""}</td>
        <td>
          <button onclick="editUser(${u.userId})">Edit</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  section.innerHTML = html;
}

/* ================= EDIT USER ================= */
async function editUser(id) {
  const data = await openModal(
    "Edit User",
    [
      { id: "username", label: "Username" },
      { id: "password", label: "Password", type: "password" },
      { id: "phonenumber", label: "Phone", type: "tel" },
      { id: "address", label: "Address" },
    ],
    "Save Changes"
  );

  if (!data) return;

  await fetch(`${BASE_URL}/users/update/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  loadUsers();
}

/* ================= ADD MODAL ================= */
async function openAddModal(type) {
  if (type === "product") {
    const data = await openModal(
      "Add Product",
      [
        {
          id: "product_name",
          label: "Product name",
          placeholder: "e.g. Walnut Coffee Table",
        },
        { id: "price", label: "Price", type: "number", placeholder: "0.00" },
        { id: "quantity", label: "Quantity", type: "number", placeholder: "0" },
        {
          id: "description",
          label: "Description",
          placeholder: "Short description...",
        },
        { id: "img", label: "Image URL", placeholder: "https://..." },
      ],
      "Add Product"
    );

    if (!data) return;

    await fetch(`${BASE_URL}/products/addproduct`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        product_name: data.product_name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
        img: data.img,
      }),
    });

    loadProducts();
  }

  if (type === "user") {
    const data = await openModal(
      "Add User",
      [
        { id: "username", label: "Username" },
        { id: "password", label: "Password", type: "password" },
        { id: "phonenumber", label: "Phone", type: "tel" },
        { id: "address", label: "Address" },
      ],
      "Add User"
    );

    if (!data) return;

    await fetch(`${BASE_URL}/users/addUser`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    loadUsers();
  }
}
function logout() {
  localStorage.removeItem("user");
  localStorage.clear();
  window.location = "login.html";
}
/* ================= INIT ================= */
window.onload = () => {
  showSection("dashboard");
};
