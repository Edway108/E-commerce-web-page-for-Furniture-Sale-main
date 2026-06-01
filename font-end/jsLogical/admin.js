const BASE_URL = "http://localhost:8080";

let stockChart = null;
let valueChart = null;
let adminProductPage = null;
let adminProductState = {
  keyword: "",
  minPrice: "",
  maxPrice: "",
  stockStatus: "all",
  sortBy: "id",
  sortDir: "asc",
  page: 0,
  size: 10,
};

function getProductName(p) {
  return p.product_name || p.productName || p.name || "Unnamed product";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

function toggleDropdown(id, el) {
  const menu = document.getElementById(id);
  menu.classList.toggle("open");
  el.classList.toggle("open");
}

function showSection(name) {
  document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active");
  document.getElementById("page-title").innerText = name.replace("-", " ").toUpperCase();

  if (name === "dashboard") loadDashboard();
  if (name === "product-list") loadProducts();
  if (name === "user-list") loadUsers();
}

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
    }
    .modal-input:focus { border-color: var(--walnut); }
    .modal-actions { display: flex; gap: 10px; margin-top: 24px; }
    .btn-modal-confirm {
      flex: 1; padding: 11px;
      background: var(--walnut); color: var(--white);
      border: none; cursor: pointer;
      font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .btn-modal-confirm:hover { background: var(--walnut-light); }
    .btn-modal-cancel {
      flex: 1; padding: 11px;
      background: none; color: var(--walnut);
      border: 1px solid #e0d8cc;
      cursor: pointer;
      font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .btn-modal-cancel:hover { background: var(--parchment); }
  `;
  document.head.appendChild(style);
}

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
    const firstInput = overlay.querySelector(".modal-input");
    if (firstInput) firstInput.focus();

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });
    overlay.querySelector("#modal-cancel").addEventListener("click", () => close(null));
    overlay.querySelector("#modal-confirm").addEventListener("click", () => {
      const result = {};
      fields.forEach((f) => {
        result[f.id] = overlay.querySelector(`#mf-${f.id}`).value;
      });
      close(result);
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") overlay.querySelector("#modal-confirm").click();
      if (e.key === "Escape") close(null);
    });

    function close(data) {
      overlay.remove();
      resolve(data);
    }
  });
}

async function loadDashboard() {
  const [dashRes, userRes, productRes] = await Promise.all([
    fetch(`${BASE_URL}/products/dashboard`),
    fetch(`${BASE_URL}/users/findall`),
    fetch(`${BASE_URL}/products/filter?page=0&size=5&sortBy=id&sortDir=desc`),
  ]);

  const dashboard = await dashRes.json();
  const users = await userRes.json();
  const recentProductsPage = await productRes.json();
  const recentProducts = recentProductsPage.content || [];

  const section = document.getElementById("section-dashboard");
  section.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p class="dashboard-subtitle">Product stock, inventory value and report export.</p>
      </div>
      <div class="dashboard-actions">
        <button class="btn-add" onclick="downloadProductReport()">Export Product CSV</button>
        <button class="btn-add" onclick="logout()">Log out</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${dashboard.totalProducts}</div></div>
      <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value">${users.length}</div></div>
      <div class="stat-card"><div class="stat-label">Items in Stock</div><div class="stat-value">${Number(dashboard.totalStock || 0).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">Inventory Value</div><div class="stat-value">$${Number(dashboard.inventoryValue || 0).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">Low Stock</div><div class="stat-value" style="color:var(--clay)">${dashboard.lowStock}</div></div>
      <div class="stat-card"><div class="stat-label">Out of Stock</div><div class="stat-value" style="color:var(--danger)">${dashboard.outOfStock}</div></div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <h2>Stock Status</h2>
        <canvas id="stockChart"></canvas>
      </div>
      <div class="chart-card">
        <h2>Top Inventory Value</h2>
        <canvas id="valueChart"></canvas>
      </div>
    </div>

    <h2 class="section-subheading">Recent Products</h2>
    <table class="data-table">
      <thead>
        <tr><th style="width:68px">Image</th><th>Name</th><th>Price</th><th>Quantity</th></tr>
      </thead>
      <tbody>
        ${recentProducts
          .map(
            (p) => `
          <tr>
            <td>${renderProductImage(p, 48)}</td>
            <td>${getProductName(p)}</td>
            <td>$${Number(p.price || 0).toLocaleString()}</td>
            <td>${p.quantity || 0}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  renderDashboardCharts(dashboard);
}

function renderDashboardCharts(dashboard) {
  if (typeof Chart === "undefined") {
    document.getElementById("stockChart").replaceWith("Chart.js did not load. Please check internet connection.");
    document.getElementById("valueChart").replaceWith("Chart.js did not load. Please check internet connection.");
    return;
  }

  if (stockChart) stockChart.destroy();
  if (valueChart) valueChart.destroy();

  const stockSummary = dashboard.stockSummary || {};
  stockChart = new Chart(document.getElementById("stockChart"), {
    type: "bar",
    data: {
      labels: ["Available", "Low Stock", "Out of Stock"],
      datasets: [
        {
          label: "Product count",
          data: [stockSummary.available || 0, stockSummary.lowStock || 0, stockSummary.outOfStock || 0],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  const topValue = dashboard.highestValueProducts || [];
  valueChart = new Chart(document.getElementById("valueChart"), {
    type: "bar",
    data: {
      labels: topValue.map((p) => p.name),
      datasets: [
        {
          label: "Inventory value",
          data: topValue.map((p) => Number(p.inventoryValue || 0)),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function buildAdminProductParams(includePagination = true) {
  const params = new URLSearchParams();
  if (adminProductState.keyword) params.append("keyword", adminProductState.keyword);
  if (adminProductState.minPrice !== "") params.append("minPrice", adminProductState.minPrice);
  if (adminProductState.maxPrice !== "") params.append("maxPrice", adminProductState.maxPrice);
  if (adminProductState.stockStatus !== "all") params.append("stockStatus", adminProductState.stockStatus);
  params.append("sortBy", adminProductState.sortBy);
  params.append("sortDir", adminProductState.sortDir);
  if (includePagination) {
    params.append("page", adminProductState.page);
    params.append("size", adminProductState.size);
  }
  return params;
}

function readAdminProductFilters(resetPage = true) {
  adminProductState.keyword = document.getElementById("adminProductKeyword")?.value.trim() || "";
  adminProductState.minPrice = document.getElementById("adminMinPrice")?.value || "";
  adminProductState.maxPrice = document.getElementById("adminMaxPrice")?.value || "";
  adminProductState.stockStatus = document.getElementById("adminStockStatus")?.value || "all";
  adminProductState.sortBy = document.getElementById("adminSortBy")?.value || "id";
  adminProductState.sortDir = document.getElementById("adminSortDir")?.value || "asc";
  adminProductState.size = Number(document.getElementById("adminPageSize")?.value || 10);
  if (resetPage) adminProductState.page = 0;
}

async function loadProducts() {
  const res = await fetch(`${BASE_URL}/products/filter?${buildAdminProductParams(true)}`);
  const pageData = await res.json();
  adminProductPage = pageData;

  const section = document.getElementById("section-product-list");
  const products = pageData.content || [];

  section.innerHTML = `
    <h1>Products</h1>
    <div class="admin-toolbar">
      <div class="admin-filter-grid">
        <input id="adminProductKeyword" placeholder="Search name or description" value="${adminProductState.keyword}" onkeydown="if(event.key === 'Enter') applyAdminProductFilters()">
        <input id="adminMinPrice" type="number" placeholder="Min price" value="${adminProductState.minPrice}">
        <input id="adminMaxPrice" type="number" placeholder="Max price" value="${adminProductState.maxPrice}">
        <select id="adminStockStatus">
          <option value="all" ${adminProductState.stockStatus === "all" ? "selected" : ""}>All stock</option>
          <option value="inStock" ${adminProductState.stockStatus === "inStock" ? "selected" : ""}>In stock</option>
          <option value="lowStock" ${adminProductState.stockStatus === "lowStock" ? "selected" : ""}>Low stock</option>
          <option value="outOfStock" ${adminProductState.stockStatus === "outOfStock" ? "selected" : ""}>Out of stock</option>
        </select>
        <select id="adminSortBy">
          <option value="id" ${adminProductState.sortBy === "id" ? "selected" : ""}>Sort: ID</option>
          <option value="productName" ${adminProductState.sortBy === "productName" ? "selected" : ""}>Sort: Name</option>
          <option value="price" ${adminProductState.sortBy === "price" ? "selected" : ""}>Sort: Price</option>
          <option value="quantity" ${adminProductState.sortBy === "quantity" ? "selected" : ""}>Sort: Quantity</option>
        </select>
        <select id="adminSortDir">
          <option value="asc" ${adminProductState.sortDir === "asc" ? "selected" : ""}>Ascending</option>
          <option value="desc" ${adminProductState.sortDir === "desc" ? "selected" : ""}>Descending</option>
        </select>
        <select id="adminPageSize" onchange="updateAdminProductPageSize()">
          <option value="10" ${adminProductState.size === 10 ? "selected" : ""}>10/page</option>
          <option value="20" ${adminProductState.size === 20 ? "selected" : ""}>20/page</option>
          <option value="50" ${adminProductState.size === 50 ? "selected" : ""}>50/page</option>
          <option value="100" ${adminProductState.size === 100 ? "selected" : ""}>100/page</option>
        </select>
      </div>
      <div class="admin-toolbar-actions">
        <button class="btn-add" onclick="applyAdminProductFilters()">Apply</button>
        <button class="btn-add" onclick="resetAdminProductFilters()">Reset</button>
        <button class="btn-add" onclick="openAddModal('product')">+ Add Product</button>
        <button class="btn-add" onclick="downloadProductReport()">Export CSV</button>
      </div>
      <div class="admin-result-stats">${formatPageStats(pageData)}</div>
    </div>

    <table class="data-table">
      <thead>
        <tr><th style="width:72px">Image</th><th>ID</th><th>Name</th><th>Price</th><th>Quantity</th><th>Inventory Value</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${renderProductImage(p, 52)}</td>
            <td>${p.id}</td>
            <td>${getProductName(p)}</td>
            <td>$${Number(p.price || 0).toLocaleString()}</td>
            <td>${p.quantity || 0}</td>
            <td>$${(Number(p.price || 0) * Number(p.quantity || 0)).toLocaleString()}</td>
            <td>
              <button onclick="editProduct(${p.id})">Edit</button>
              <button onclick="deleteProduct(${p.id})">Delete</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <div class="admin-pagination">${renderAdminPagination(pageData)}</div>
  `;
}

function formatPageStats(pageData) {
  const total = pageData.totalElements || 0;
  const number = pageData.number || 0;
  const size = pageData.size || adminProductState.size;
  const count = pageData.numberOfElements || 0;
  const start = total === 0 ? 0 : number * size + 1;
  const end = total === 0 ? 0 : start + count - 1;
  return total === 0 ? "Showing 0 products" : `Showing ${start}-${end} of ${total} products`;
}

function renderAdminPagination(pageData) {
  const totalPages = pageData.totalPages || 0;
  if (totalPages <= 1) return "";
  const pageNumber = pageData.number || 0;
  let html = `<button onclick="changeAdminProductPage(${pageNumber - 1})" ${pageData.first ? "disabled" : ""}>Prev</button>`;
  for (let i = 0; i < totalPages; i++) {
    if (i < 2 || i >= totalPages - 2 || Math.abs(i - pageNumber) <= 1) {
      html += `<button class="${i === pageNumber ? "active" : ""}" onclick="changeAdminProductPage(${i})">${i + 1}</button>`;
    } else if (i === 2 || i === totalPages - 3) {
      html += `<span>...</span>`;
    }
  }
  html += `<button onclick="changeAdminProductPage(${pageNumber + 1})" ${pageData.last ? "disabled" : ""}>Next</button>`;
  return html;
}

function applyAdminProductFilters() {
  readAdminProductFilters(true);
  loadProducts();
}

function updateAdminProductPageSize() {
  readAdminProductFilters(true);
  loadProducts();
}

function resetAdminProductFilters() {
  adminProductState = {
    keyword: "",
    minPrice: "",
    maxPrice: "",
    stockStatus: "all",
    sortBy: "id",
    sortDir: "asc",
    page: 0,
    size: 10,
  };
  loadProducts();
}

function changeAdminProductPage(page) {
  if (!adminProductPage) return;
  if (page < 0 || page >= adminProductPage.totalPages) return;
  adminProductState.page = page;
  loadProducts();
}

function downloadProductReport() {
  const params = buildAdminProductParams(false);
  const url = `${BASE_URL}/products/export?${params}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-report.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderProductImage(p, size) {
  if (!p.img) {
    return `<div style="width:${size}px;height:${size}px;background:var(--parchment);border:1px solid #e0d8cc;"></div>`;
  }
  return `<img src="${p.img}" alt="${getProductName(p)}" style="width:${size}px;height:${size}px;object-fit:cover;border:1px solid #e0d8cc;display:block;" onerror="this.replaceWith(noImg(${size}))" />`;
}

function noImg(size = 52) {
  const d = document.createElement("div");
  d.style.cssText = `width:${size}px;height:${size}px;background:var(--parchment);border:1px solid #e0d8cc;`;
  return d;
}

async function deleteProduct(id) {
  if (!(await confirmModal("Are you sure you want to delete this product?"))) return;
  await fetch(`${BASE_URL}/products/${id}`, { method: "DELETE" });
  loadProducts();
}

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
  });
}

async function editProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  const p = await res.json();

  const data = await openModal(
    "Edit Product",
    [
      { id: "product_name", label: "Name", value: getProductName(p) },
      { id: "price", label: "Price", value: p.price, type: "number" },
      { id: "quantity", label: "Quantity", value: p.quantity, type: "number" },
      { id: "description", label: "Description", value: p.description },
      { id: "img", label: "Image URL", value: p.img, placeholder: "https://..." },
    ],
    "Save Changes"
  );

  if (!data) return;

  await fetch(`${BASE_URL}/products/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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

async function loadUsers() {
  const res = await fetch(`${BASE_URL}/users/findall`);
  const data = await res.json();

  const section = document.getElementById("section-user-list");
  section.innerHTML = `
    <h1>Users</h1>
    <button class="btn-add" onclick="openAddModal('user')">+ Add User</button>
    <table class="data-table">
      <thead><tr><th>ID</th><th>Username</th><th>Phone</th><th>Role</th><th>Action</th></tr></thead>
      <tbody>
        ${data
          .map(
            (u) => `
          <tr>
            <td>${u.userId}</td>
            <td>${u.username}</td>
            <td>${u.phonenumber || ""}</td>
            <td>${u.role || ""}</td>
            <td><button onclick="editUser(${u.userId})">Edit</button></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  loadUsers();
}

async function openAddModal(type) {
  if (type === "product") {
    const data = await openModal(
      "Add Product",
      [
        { id: "product_name", label: "Product name", placeholder: "e.g. Walnut Coffee Table" },
        { id: "price", label: "Price", type: "number", placeholder: "0.00" },
        { id: "quantity", label: "Quantity", type: "number", placeholder: "0" },
        { id: "description", label: "Description", placeholder: "Short description..." },
        { id: "img", label: "Image URL", placeholder: "https://..." },
      ],
      "Add Product"
    );

    if (!data) return;

    await fetch(`${BASE_URL}/products/addproduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    loadUsers();
  }
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}

window.onload = () => {
  showSection("dashboard");
};
