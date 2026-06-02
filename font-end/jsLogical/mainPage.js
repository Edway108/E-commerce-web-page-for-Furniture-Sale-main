const API = "http://127.0.0.1:8080/products";
const CART_API = "http://127.0.0.1:8080/cart";
const CATEGORY_API = "http://127.0.0.1:8080/categories";

let editId = null;
let deleteId = null;
let viewProduct = null;
let currentPageData = null;
let categories = [];
let filterState = {
  keyword: "",
  minPrice: "",
  maxPrice: "",
  stockStatus: "all",
  categoryId: "",
  sortBy: "id",
  sortDir: "asc",
  page: 0,
  size: 10,
};

async function checkAuth() {
  const user = localStorage.getItem("user");
  if (!user) {
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

function reload() {
  window.location.href = "mainPage.html";
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}

function getProductName(p) {
  return p.product_name || p.productName || "Unnamed product";
}


function getCategoryName(p) {
  return p.category?.name || "Uncategorized";
}

async function loadCategories() {
  try {
    const res = await fetch(`${CATEGORY_API}/findall`);
    if (!res.ok) throw new Error("Failed to load categories");
    categories = await res.json();
    populateCategorySelects();
  } catch (error) {
    console.error("Category load error:", error);
    categories = [];
  }
}

function populateCategorySelects() {
  const filterSelect = document.getElementById("categoryFilter");
  const formSelect = document.getElementById("fCategory");
  const options = categories
    .filter((c) => (c.status || "ACTIVE") === "ACTIVE")
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="">All categories</option>${options}`;
    filterSelect.value = filterState.categoryId || "";
  }
  if (formSelect) {
    formSelect.innerHTML = `<option value="">No category</option>${options}`;
  }
}

function validateProductPayload(payload) {
  const errors = [];
  if (!payload.product_name) errors.push("Product name is required");
  if (Number.isNaN(payload.price) || payload.price < 0) errors.push("Price must be 0 or greater");
  if (Number.isNaN(payload.quantity) || payload.quantity < 0) errors.push("Quantity must be 0 or greater");
  if (payload.description && payload.description.length > 1000) errors.push("Description is too long");
  if (payload.img && payload.img.length > 500) errors.push("Image URL is too long");
  return errors;
}

async function extractErrorMessage(res) {
  try {
    const data = await res.json();
    if (data.fieldErrors) {
      return Object.values(data.fieldErrors)[0] || data.message || "Request failed";
    }
    return data.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

function buildFilterParams(includePagination = true) {
  const params = new URLSearchParams();

  if (filterState.keyword) params.append("keyword", filterState.keyword);
  if (filterState.minPrice !== "") params.append("minPrice", filterState.minPrice);
  if (filterState.maxPrice !== "") params.append("maxPrice", filterState.maxPrice);
  if (filterState.stockStatus && filterState.stockStatus !== "all") {
    params.append("stockStatus", filterState.stockStatus);
  }
  if (filterState.categoryId) params.append("categoryId", filterState.categoryId);

  params.append("sortBy", filterState.sortBy);
  params.append("sortDir", filterState.sortDir);

  if (includePagination) {
    params.append("page", filterState.page);
    params.append("size", filterState.size);
  }

  return params;
}

function readFilterInputs(resetPage = true) {
  filterState.keyword = document.getElementById("productsearching").value.trim();
  filterState.minPrice = document.getElementById("minPrice").value;
  filterState.maxPrice = document.getElementById("maxPrice").value;
  filterState.stockStatus = document.getElementById("stockStatus").value;
  filterState.categoryId = document.getElementById("categoryFilter")?.value || "";
  filterState.sortBy = document.getElementById("sortBy").value;
  filterState.sortDir = document.getElementById("sortDir").value;
  filterState.size = Number(document.getElementById("pageSize").value) || 10;
  if (resetPage) filterState.page = 0;
}

async function fetchAll() {
  return fetchProducts();
}

async function fetchProducts() {
  if (!(await checkAuth())) return;

  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("grid").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
  document.getElementById("emptyState").style.display = "none";

  try {
    const res = await fetch(`${API}/filter?${buildFilterParams(true)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to load products");
    }

    const pageData = await res.json();
    currentPageData = pageData;

    console.log("Products loaded:", pageData.totalElements);
    renderGrid(pageData.content || []);
    renderResultStats(pageData);
    renderPagination(pageData);
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Failed to load products", "error");
  } finally {
    document.getElementById("loadingState").style.display = "none";
  }
}

function applyFilters() {
  readFilterInputs(true);
  fetchProducts();
}

function search() {
  applyFilters();
}

function updatePageSize() {
  readFilterInputs(true);
  fetchProducts();
}

function resetFilters() {
  document.getElementById("productsearching").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("stockStatus").value = "all";
  if (document.getElementById("categoryFilter")) document.getElementById("categoryFilter").value = "";
  document.getElementById("sortBy").value = "id";
  document.getElementById("sortDir").value = "asc";
  document.getElementById("pageSize").value = "10";

  filterState = {
    keyword: "",
    minPrice: "",
    maxPrice: "",
    stockStatus: "all",
    categoryId: "",
    sortBy: "id",
    sortDir: "asc",
    page: 0,
    size: 10,
  };

  fetchProducts();
}

function changePage(page) {
  if (!currentPageData) return;
  if (page < 0 || page >= currentPageData.totalPages) return;
  filterState.page = page;
  fetchProducts();
}

function renderResultStats(pageData) {
  const total = pageData.totalElements || 0;
  const pageNumber = pageData.number || 0;
  const size = pageData.size || filterState.size;
  const count = pageData.numberOfElements || 0;
  const start = total === 0 ? 0 : pageNumber * size + 1;
  const end = total === 0 ? 0 : start + count - 1;

  document.getElementById("productCount").textContent = total;
  document.getElementById("resultStats").textContent =
    total === 0
      ? "Showing 0 products"
      : `Showing ${start}-${end} of ${total} products`;
}

function renderPagination(pageData) {
  const pagination = document.getElementById("pagination");
  const totalPages = pageData.totalPages || 0;

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const pageNumber = pageData.number || 0;
  const maxButtons = 5;
  let start = Math.max(0, pageNumber - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages - 1, start + maxButtons - 1);
  start = Math.max(0, end - maxButtons + 1);

  let buttons = `
    <button onclick="changePage(${pageNumber - 1})" ${pageData.first ? "disabled" : ""}>Prev</button>
  `;

  for (let i = start; i <= end; i++) {
    buttons += `<button class="${i === pageNumber ? "active" : ""}" onclick="changePage(${i})">${i + 1}</button>`;
  }

  buttons += `
    <button onclick="changePage(${pageNumber + 1})" ${pageData.last ? "disabled" : ""}>Next</button>
  `;

  pagination.innerHTML = buttons;
}

function renderGrid(products) {
  const grid = document.getElementById("grid");

  if (products.length === 0) {
    document.getElementById("emptyState").style.display = "block";
    grid.innerHTML = "";
    return;
  }

  document.getElementById("emptyState").style.display = "none";
  grid.innerHTML = products
    .map((p) => {
      const name = getProductName(p);
      const productJson = encodeURIComponent(JSON.stringify(p));
      const isOutOfStock = Number(p.quantity || 0) <= 0;

      return `
        <div class="card">
          ${
            p.img
              ? `<img src="${p.img}" class="card-img" onclick="openViewFromEncoded('${productJson}')">`
              : `<div class="card-img-placeholder" onclick="openViewFromEncoded('${productJson}')"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="10" width="18" height="8" rx="1"/><rect x="6" y="6" width="12" height="4" rx="1"/><line x1="7" y1="18" x2="7" y2="21"/><line x1="17" y1="18" x2="17" y2="21"/></svg><span>No Image</span></div>`
          }
          <div class="card-body">
            <div class="card-tag">${getCategoryName(p)}</div>
            <div class="card-name" onclick="openViewFromEncoded('${productJson}')">${name}</div>
            <div class="card-desc">${p.description || "No description available."}</div>
            <div class="card-footer">
              <div class="card-price"><span>$</span>${Number(p.price || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}</div>
              <div class="card-qty ${isOutOfStock ? "out" : ""}">${isOutOfStock ? "Out of stock" : `Qty: ${p.quantity}`}</div>
            </div>
            <div class="card-actions">
              <button class="btn-icon btn-edit" ${isOutOfStock ? "disabled" : ""} onclick="addToCartFromEncoded('${productJson}')">
                ${isOutOfStock ? "Unavailable" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function openViewFromEncoded(encodedProduct) {
  openView(JSON.parse(decodeURIComponent(encodedProduct)));
}

function addToCartFromEncoded(encodedProduct) {
  addToCart(JSON.parse(decodeURIComponent(encodedProduct)));
}

async function handleSave() {
  if (!(await checkAuth())) return;
  const token = localStorage.getItem("token") || "";

  const payload = {
    product_name: document.getElementById("fName").value.trim(),
    price: parseFloat(document.getElementById("fPrice").value),
    quantity: parseInt(document.getElementById("fQty").value),
    img: document.getElementById("fImg").value.trim(),
    description: document.getElementById("fDesc").value.trim(),
    categoryId: document.getElementById("fCategory")?.value ? Number(document.getElementById("fCategory").value) : null,
  };

  const validationErrors = validateProductPayload(payload);
  if (validationErrors.length > 0) {
    showToast(validationErrors[0], "error");
    return;
  }

  try {
    if (!editId) {
      const res = await fetch(`${API}/addproduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res));
      showToast("Product added successfully");
    } else {
      const res = await fetch(`${API}/update/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res));
      showToast("Product updated");
    }
    closeFormModal();
    fetchProducts();
  } catch (error) {
    showToast(error.message || "Operation failed", "error");
  }
}

async function addToCart(p) {
  if (!(await checkAuth())) return;

  const token = localStorage.getItem("token") || "";
  if (!token) {
    alert("Please login again!");
    localStorage.clear();
    window.location.href = "login.html";
    return;
  }

  const payload = {
    productId: p.id,
    productQuantity: 1,
  };

  try {
    const res = await fetch(`${CART_API}/addcart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast("Added to cart");
    } else if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      alert("Your login session expired. Please login again!");
      window.location.href = "login.html";
    } else {
      showToast("Add failed", "error");
    }
  } catch {
    showToast("Error", "error");
  }
}

async function confirmDelete() {
  const token = localStorage.getItem("token") || "";

  if (!(await checkAuth())) return;
  try {
    await fetch(`${API}/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    showToast("Product removed");
    closeDeleteModal();
    fetchProducts();
  } catch {
    showToast("Delete failed", "error");
  }
}

function openAdd() {
  editId = null;
  document.getElementById("fName").value = "";
  document.getElementById("fPrice").value = "";
  document.getElementById("fQty").value = "";
  document.getElementById("fImg").value = "";
  document.getElementById("fDesc").value = "";
  if (document.getElementById("fCategory")) document.getElementById("fCategory").value = "";
  document.getElementById("formTitle").textContent = "New Piece";
  document.getElementById("formSubtitle").textContent = "Add to catalog";
  document.getElementById("saveBtn").textContent = "Add to Catalog";
  document.getElementById("formOverlay").classList.add("active");
}

function openEdit(p) {
  editId = p.id;
  document.getElementById("fName").value = getProductName(p);
  document.getElementById("fPrice").value = p.price || "";
  document.getElementById("fQty").value = p.quantity || "";
  document.getElementById("fImg").value = p.img || "";
  document.getElementById("fDesc").value = p.description || "";
  if (document.getElementById("fCategory")) document.getElementById("fCategory").value = p.category?.id || "";
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
  document.getElementById("viewName").textContent = getProductName(p);
  document.getElementById("viewPrice").textContent =
    "$" + Number(p.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
  document.getElementById("viewDesc").textContent = p.description || "No description.";
  document.getElementById("viewQty").textContent = (p.quantity || 0) + " units";
  document.getElementById("viewCategory").textContent = getCategoryName(p);
  document.getElementById("viewId").textContent = "#" + p.id;
  document.getElementById("viewImgWrap").innerHTML = p.img
    ? `<img id="viewImg" src="${p.img}" style="width:100%;height:260px;object-fit:cover;display:block"/>`
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
  t.className = `toast show ${type}`;
  t.innerHTML = (type === "success" ? "✓ " : "✕ ") + msg;
  setTimeout(() => {
    t.className = "toast";
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Main page loaded!");
  await loadCategories();
  await fetchProducts();
});
