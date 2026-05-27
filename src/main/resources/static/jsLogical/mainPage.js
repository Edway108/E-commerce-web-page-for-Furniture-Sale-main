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

const API = `${API_ORIGIN}/products`;
const CART_API = `${API_ORIGIN}/cart`;

let editId = null;
let deleteId = null;
let viewProduct = null;
let allProducts = [];
let activeCategory = "all";

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

async function openChat() {
  if (!(await checkAuth())) return;
  window.location.href = "chatWebSocket.html";
}

async function reload() {
  window.location.href = "mainPage.html";
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}

function productName(p) {
  return p?.product_name || p?.productName || p?.name || "Untitled product";
}

function productCategoryName(p) {
  return (p?.category?.name || p?.categoryName || "").toString();
}

function productSearchText(p) {
  const tags = Array.isArray(p?.tags) ? p.tags.map(t => t.name || t).join(" ") : "";
  return [
    productName(p),
    p?.description,
    p?.material,
    p?.color,
    productCategoryName(p),
    tags
  ].filter(Boolean).join(" ").toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setEmptyState(show, title = "No pieces found", message = "Try another search keyword or category.") {
  const empty = document.getElementById("emptyState");
  if (!empty) return;
  empty.style.display = show ? "block" : "none";
  const h2 = empty.querySelector("h2");
  const p = empty.querySelector("p");
  if (h2) h2.textContent = title;
  if (p) p.textContent = message;
}

function setActiveCategoryButton(button) {
  document.querySelectorAll(".category-tile").forEach(btn => btn.classList.remove("active"));
  if (button) button.classList.add("active");
}

function applyCurrentFilters() {
  const keyword = (document.getElementById("productsearching")?.value || "").trim().toLowerCase();
  let filtered = [...allProducts];

  if (activeCategory && activeCategory !== "all") {
    filtered = filtered.filter(p => productSearchText(p).includes(activeCategory));
  }

  if (keyword) {
    filtered = filtered.filter(p => productSearchText(p).includes(keyword));
  }

  renderGrid(filtered);
}

function filterCategory(category, button) {
  activeCategory = category || "all";
  const searchInput = document.getElementById("productsearching");
  if (searchInput) searchInput.value = "";
  setActiveCategoryButton(button || document.querySelector(`[data-category="${activeCategory}"]`));
  applyCurrentFilters();
}

function resetProductFilters() {
  activeCategory = "all";
  const searchInput = document.getElementById("productsearching");
  if (searchInput) searchInput.value = "";
  setActiveCategoryButton(document.querySelector('[data-category="all"]'));
  renderGrid(allProducts);
}

async function fetchAll() {
  if (!(await checkAuth())) return;

  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("grid").innerHTML = "";
  setEmptyState(false);

  try {
    const res = await fetch(`${API}/findall`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }

    const data = await readJsonSafely(res);
    allProducts = Array.isArray(data) ? data.filter(p => p?.active !== false && (p?.status || "ACTIVE").toUpperCase() !== "INACTIVE") : [];
    applyCurrentFilters();
    await updateCartBadge();
  } catch (error) {
    console.error("Fetch error:", error);
    showToast(error.message || "Failed to load products", "error");
  } finally {
    document.getElementById("loadingState").style.display = "none";
  }
}

function renderGrid(products) {
  const safeProducts = Array.isArray(products) ? products : [];
  document.getElementById("productCount").textContent = safeProducts.length;
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  if (safeProducts.length === 0) {
    setEmptyState(true, "No pieces found", "Try selecting All pieces or using a different keyword.");
    return;
  }

  setEmptyState(false);
  grid.innerHTML = safeProducts
    .map((p) => {
      const name = productName(p);
      const img = p.img ? escapeHtml(p.img) : "";
      const price = Number(p.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
      const quantity = p.quantity ?? 0;
      const desc = p.description || "A curated furniture piece for your space.";
      return `
        <div class="card">
          ${img
            ? `<img src="${img}" class="card-img" onclick='openViewById(${p.id})' alt="${escapeHtml(name)}">`
            : `<div class="card-img-placeholder" onclick='openViewById(${p.id})'><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="10" width="18" height="8" rx="1"/><rect x="6" y="6" width="12" height="4" rx="1"/><line x1="7" y1="18" x2="7" y2="21"/><line x1="17" y1="18" x2="17" y2="21"/></svg><span>No Image</span></div>`}
          <div class="card-body">
            <div class="card-tag">${escapeHtml(productCategoryName(p) || "Furniture")}</div>
            <div class="card-name" onclick='openViewById(${p.id})'>${escapeHtml(name)}</div>
            <div class="card-desc">${escapeHtml(desc)}</div>
            <div class="card-footer">
              <div class="card-price"><span>$</span>${price}</div>
              <div class="card-qty">Qty: ${quantity}</div>
            </div>
            <div class="card-actions">
              <button class="btn-icon btn-edit" onclick='addToCartById(${p.id})'>Add to Cart</button>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

function findProduct(id) {
  return allProducts.find(p => Number(p.id) === Number(id));
}

function openViewById(id) {
  const p = findProduct(id);
  if (p) openView(p);
}

async function addToCartById(id) {
  const p = findProduct(id);
  if (p) await addToCart(p);
}

async function handleSave() {
  if (!(await checkAuth())) return;

  const payload = {
    product_name: document.getElementById("fName").value,
    price: parseFloat(document.getElementById("fPrice").value),
    quantity: parseInt(document.getElementById("fQty").value),
    img: document.getElementById("fImg").value,
    description: document.getElementById("fDesc").value,
  };

  try {
    const res = await fetch(!editId ? `${API}/addproduct` : `${API}/update/${editId}`, {
      method: !editId ? "POST" : "PUT",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || "Operation failed");
    }

    showToast(!editId ? "Product added successfully" : "Product updated");
    closeFormModal();
    fetchAll();
  } catch (error) {
    showToast(error.message || "Operation failed", "error");
  }
}

async function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  if (!badge || !getToken()) return;

  try {
    const res = await fetch(`${CART_API}/getcart`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (!res.ok) {
      badge.textContent = "0";
      return;
    }
    const cart = await readJsonSafely(res);
    const items = cart?.cartItems || [];
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    badge.textContent = totalQty;
  } catch {
    badge.textContent = "0";
  }
}

async function addToCart(p) {
  if (!(await checkAuth())) return;

  const payload = {
    productId: p.id,
    productQuantity: 1,
  };

  try {
    const res = await fetch(`${CART_API}/addcart`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await readJsonSafely(res).catch(() => ({}));
      throw new Error(err.message || "Add to cart failed");
    }

    await updateCartBadge();
    showToast("Added to cart");
  } catch (error) {
    showToast(error.message || "Error", "error");
  }
}

async function search() {
  applyCurrentFilters();
}

async function confirmDelete() {
  if (!(await checkAuth())) return;
  try {
    const res = await fetch(`${API}/${deleteId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Delete failed");
    showToast("Product removed");
    closeDeleteModal();
    fetchAll();
  } catch (error) {
    showToast(error.message || "Delete failed", "error");
  }
}

function openAdd() {
  editId = null;
  document.getElementById("fName").value = "";
  document.getElementById("fPrice").value = "";
  document.getElementById("fQty").value = "";
  document.getElementById("fImg").value = "";
  document.getElementById("fDesc").value = "";
  document.getElementById("formTitle").textContent = "New Piece";
  document.getElementById("formSubtitle").textContent = "Add to catalog";
  document.getElementById("saveBtn").textContent = "Add to Catalog";
  document.getElementById("formOverlay").classList.add("active");
}

function openEdit(p) {
  editId = p.id;
  document.getElementById("fName").value = productName(p) || "";
  document.getElementById("fPrice").value = p.price || "";
  document.getElementById("fQty").value = p.quantity || "";
  document.getElementById("fImg").value = p.img || "";
  document.getElementById("fDesc").value = p.description || "";
  document.getElementById("formTitle").textContent = "Edit Piece";
  document.getElementById("formSubtitle").textContent = "Update details";
  document.getElementById("saveBtn").textContent = "Save Changes";
  document.getElementById("viewOverlay").classList.remove("active");
  document.getElementById("formOverlay").classList.add("active");
}

function closeFormModal() {
  document.getElementById("formOverlay").classList.remove("active");
}
function closeViewModal() {
  document.getElementById("viewOverlay").classList.remove("active");
}
function switchToEdit() {
  if (viewProduct) openEdit(viewProduct);
}
function openView(p) {
  viewProduct = p;
  document.getElementById("viewName").textContent = productName(p);
  document.getElementById("viewPrice").textContent =
    "$" + Number(p.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
  document.getElementById("viewDesc").textContent =
    p.description || "No description.";
  document.getElementById("viewQty").textContent = (p.quantity || 0) + " units";
  document.getElementById("viewId").textContent = "#" + p.id;
  document.getElementById("viewImgWrap").innerHTML = p.img
    ? `<img id="viewImg" src="${escapeHtml(p.img)}" style="width:100%;height:260px;object-fit:cover;display:block"/>`
    : `<div class="view-img-placeholder" style="height:160px"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="10" width="18" height="8" rx="1"/><rect x="6" y="6" width="12" height="4" rx="1"/></svg></div>`;
  document.getElementById("viewOverlay").classList.add("active");
}
function openDelete(id, name) {
  deleteId = id;
  document.getElementById("deleteName").textContent = name;
  document.getElementById("deleteOverlay").classList.add("active");
}
function closeDeleteModal() {
  document.getElementById("deleteOverlay").classList.remove("active");
}
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.className = `toast show ${type}`;
  t.innerHTML = (type === "success" ? "✓ " : "✕ ") + escapeHtml(msg);
  setTimeout(() => {
    t.className = "toast";
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async function () {
  const searchInput = document.getElementById("productsearching");
  if (searchInput) {
    searchInput.addEventListener("input", () => applyCurrentFilters());
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") search();
    });
  }
  await fetchAll();
});
