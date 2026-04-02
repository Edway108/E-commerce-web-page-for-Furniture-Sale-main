/* =============================================================
   app.js — Furnituree Admin Dashboard
   Chỉnh BASE_URL theo địa chỉ Spring Boot của bạn
============================================================= */

const BASE_URL = "http://localhost:8080";

/* ==================== SECTION ROUTING ==================== */
function logout() {
  localStorage.removeItem("user");
  localStorage.clear;
  window.location = "login.html";
}

function showSection(name) {
  // hide all
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));

  document.getElementById("section-" + name).classList.add("active");
  document.getElementById("page-title").textContent = capitalize(
    name.replace("-", " ")
  );

  // clear search
  document.getElementById("search-input").value = "";

  if (name === "dashboard") loadDashboard();
  if (name === "product-list") loadProducts();
  if (name === "user-list") loadUsers();
}

function capitalize(str) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ==================== SIDEBAR DROPDOWN ==================== */

function toggleDropdown(menuId, toggleId) {
  const menu = document.getElementById(menuId);
  const toggle = document.getElementById(toggleId);

  const isOpen = menu.classList.contains("open");

  // close all other dropdowns first
  document
    .querySelectorAll(".nav-dropdown.open")
    .forEach((m) => m.classList.remove("open"));
  document
    .querySelectorAll(".nav-parent.open")
    .forEach((t) => t.classList.remove("open"));

  if (!isOpen) {
    menu.classList.add("open");
    toggle.classList.add("open");
  }
}

/* ==================== DASHBOARD ==================== */

async function loadDashboard() {
  try {
    const [products, users] = await Promise.all([
      fetch(`${BASE_URL}/products/findall`).then((r) => r.json()),
      fetch(`${BASE_URL}/users/findall`).then((r) => r.json()),
    ]);
    document.getElementById("stat-products").textContent = products.length;
    document.getElementById("stat-users").textContent = users.length;
  } catch (e) {
    document.getElementById("stat-products").textContent = "—";
    document.getElementById("stat-users").textContent = "—";
  }
}

/* ==================== PRODUCTS ==================== */

async function loadProducts(keyword = "") {
  const loading = document.getElementById("product-loading");
  const tableWrap = document.getElementById("product-table-wrap");
  const empty = document.getElementById("product-empty");
  const tbody = document.getElementById("product-tbody");

  loading.style.display = "flex";
  tableWrap.style.display = "none";
  empty.style.display = "none";

  try {
    const url = keyword
      ? `${BASE_URL}/products/search?keyword=${encodeURIComponent(keyword)}`
      : `${BASE_URL}/products/findall`;

    const products = await fetch(url).then((r) => r.json());

    loading.style.display = "none";

    if (!products || products.length === 0) {
      empty.style.display = "block";
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>${p.id}</td>
        <td>
          ${
            p.img
              ? `<img class="table-img" src="${p.img}" alt="${p.product_name}" onerror="this.style.display='none'">`
              : `<div class="table-img-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               </div>`
          }
        </td>
        <td><span class="table-name">${p.product_name || "—"}</span></td>
        <td><span class="table-price">${
          p.price ? Number(p.price).toLocaleString("vi-VN") + " ₫" : "—"
        }</span></td>
        <td>${p.quantity ?? "—"}</td>
        <td><span class="table-desc" title="${p.description || ""}">${
          p.description || "—"
        }</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon btn-edit" onclick="openEditProduct(${
              p.id
            })">Edit</button>
            <button class="btn-icon btn-delete" onclick="confirmDelete('product', ${
              p.id
            }, '${(p.product_name || "").replace(
          /'/g,
          "\\'"
        )}')">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");

    tableWrap.style.display = "block";
  } catch (e) {
    loading.style.display = "none";
    showToast("Failed to load products", "error");
  }
}

async function openEditProduct(id) {
  try {
    const p = await fetch(`${BASE_URL}/products/${id}`).then((r) => r.json());
    document.getElementById("product-modal-title").textContent = "Edit Product";
    document.getElementById("product-id").value = p.id;
    document.getElementById("product-name").value = p.product_name || "";
    document.getElementById("product-price").value = p.price || "";
    document.getElementById("product-qty").value = p.quantity || "";
    document.getElementById("product-img").value = p.img || "";
    document.getElementById("product-desc").value = p.description || "";
    openModal("product-modal-overlay");
  } catch (e) {
    showToast("Could not load product", "error");
  }
}

async function saveProduct() {
  const id = document.getElementById("product-id").value;
  const body = {
    product_name: document.getElementById("product-name").value.trim(),
    price: parseFloat(document.getElementById("product-price").value) || 0,
    quantity: parseInt(document.getElementById("product-qty").value) || 0,
    img: document.getElementById("product-img").value.trim(),
    description: document.getElementById("product-desc").value.trim(),
  };

  if (!body.product_name) {
    showToast("Product name is required", "error");
    return;
  }

  try {
    if (id) {
      await fetch(`${BASE_URL}/products/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showToast("Product updated ✓");
    } else {
      await fetch(`${BASE_URL}/products/addproduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showToast("Product added ✓");
    }
    closeModal("product-modal-overlay");
    loadProducts();
  } catch (e) {
    showToast("Save failed", "error");
  }
}

/* ==================== USERS ==================== */

async function loadUsers() {
  const loading = document.getElementById("user-loading");
  const tableWrap = document.getElementById("user-table-wrap");
  const empty = document.getElementById("user-empty");
  const tbody = document.getElementById("user-tbody");

  loading.style.display = "flex";
  tableWrap.style.display = "none";
  empty.style.display = "none";

  try {
    const users = await fetch(`${BASE_URL}/users/findall`).then((r) =>
      r.json()
    );

    loading.style.display = "none";

    if (!users || users.length === 0) {
      empty.style.display = "block";
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.id}</td>
        <td><span class="table-name">${u.username || "—"}</span></td>
        <td>${u.phonenumber || "—"}</td>
        <td>${u.address || "—"}</td>
        <td><span class="badge ${u.role === "ADMIN" ? "admin" : ""}">${
          u.role || "USER"
        }</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon btn-edit" onclick="openEditUser(${
              u.id
            })">Edit</button>
            <button class="btn-icon btn-delete" onclick="confirmDelete('user', ${
              u.id
            }, '${(u.username || "").replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");

    tableWrap.style.display = "block";
  } catch (e) {
    loading.style.display = "none";
    showToast("Failed to load users", "error");
  }
}

async function openEditUser(id) {
  try {
    // Spring Boot chưa có GET /users/{id}, dùng findall rồi filter
    const users = await fetch(`${BASE_URL}/users/findall`).then((r) =>
      r.json()
    );
    const u = users.find((x) => x.id === id);
    if (!u) {
      showToast("User not found", "error");
      return;
    }

    document.getElementById("user-modal-title").textContent = "Edit User";
    document.getElementById("user-id").value = u.id;
    document.getElementById("user-name").value = u.username || "";
    document.getElementById("user-pass").value = "";
    document.getElementById("user-phone").value = u.phonenumber || "";
    document.getElementById("user-address").value = u.address || "";
    openModal("user-modal-overlay");
  } catch (e) {
    showToast("Could not load user", "error");
  }
}

async function saveUser() {
  const id = document.getElementById("user-id").value;
  const body = {
    username: document.getElementById("user-name").value.trim(),
    password: document.getElementById("user-pass").value,
    phonenumber: document.getElementById("user-phone").value.trim(),
    address: document.getElementById("user-address").value.trim(),
  };

  if (!body.username) {
    showToast("Username is required", "error");
    return;
  }

  try {
    if (id) {
      await fetch(`${BASE_URL}/users/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showToast("User updated ✓");
    } else {
      await fetch(`${BASE_URL}/users/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showToast("User added ✓");
    }
    closeModal("user-modal-overlay");
    loadUsers();
  } catch (e) {
    showToast("Save failed", "error");
  }
}

/* ==================== DELETE ==================== */

let _deleteCallback = null;

function confirmDelete(type, id, name) {
  const text = `Are you sure you want to delete "${name}"? This cannot be undone.`;
  document.getElementById("delete-confirm-text").textContent = text;

  const btn = document.getElementById("confirm-del-btn");
  btn.onclick = async () => {
    try {
      const endpoint =
        type === "product"
          ? `${BASE_URL}/products/${id}`
          : `${BASE_URL}/users/${id}`;

      await fetch(endpoint, { method: "DELETE" });
      showToast(`${capitalize(type)} deleted`);
      closeModal("delete-modal-overlay");
      if (type === "product") loadProducts();
      else loadUsers();
    } catch (e) {
      showToast("Delete failed", "error");
    }
  };

  openModal("delete-modal-overlay");
}

/* ==================== SEARCH ==================== */

let _searchTimer = null;

function handleSearch(value) {
  // only search when product-list section is active
  const productActive = document
    .getElementById("section-product-list")
    .classList.contains("active");
  if (!productActive) return;

  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => loadProducts(value), 350);
}

/* ==================== MODAL HELPERS ==================== */

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function openAddModal(type) {
  if (type === "product") {
    document.getElementById("product-modal-title").textContent = "Add Product";
    document.getElementById("product-id").value = "";
    document.getElementById("product-name").value = "";
    document.getElementById("product-price").value = "";
    document.getElementById("product-qty").value = "";
    document.getElementById("product-img").value = "";
    document.getElementById("product-desc").value = "";
    openModal("product-modal-overlay");
  } else {
    document.getElementById("user-modal-title").textContent = "Add User";
    document.getElementById("user-id").value = "";
    document.getElementById("user-name").value = "";
    document.getElementById("user-pass").value = "";
    document.getElementById("user-phone").value = "";
    document.getElementById("user-address").value = "";
    openModal("user-modal-overlay");
  }
}

/* ==================== TOAST ==================== */

let _toastTimer = null;

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ==================== CLOSE OVERLAY ON CLICK OUTSIDE ==================== */

document.querySelectorAll(".overlay").forEach((overlay) => {
  overlay.addEventListener("click", function (e) {
    if (e.target === this) closeModal(this.id);
  });
});

// Close user topbar dropdown when clicking outside
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("userDropdown");
  if (!dropdown) return;
  if (!e.target.closest(".user-menu") && !e.target.closest(".avatar")) {
    dropdown.classList.remove("show");
  }
});

/* ==================== INIT ==================== */

document.addEventListener("DOMContentLoaded", () => {
  showSection("dashboard");
});
