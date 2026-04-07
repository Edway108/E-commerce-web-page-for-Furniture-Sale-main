/**
 * The above JavaScript code consists of functions for handling authentication, fetching, adding, updating, and deleting products, as well as displaying product information and handling modals for product actions.
 * @returns The code provided is a JavaScript code snippet that includes functions for handling authentication, fetching, rendering, saving, searching, deleting, and managing products in a web application. It also includes functions for opening modals, displaying toasts, and initializing the page.
 */
const API = "http://127.0.0.1:8080/products"; // ← ĐÚNG endpoint
let editId = null;
let deleteId = null;
let viewProduct = null;
let keyword = null;
let stompClient = null;
let username = null;

//  AUTH CHECK + TOKEN HANDLER
async function checkAuth() {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

//to chat to the public room
async function openChat() {
  if (!(await checkAuth())) return;
  const token = localStorage.getItem("token") || ""; // ← lấy token

  window.location.href = "chatWebSocket.html";
  connect();
}

async function reload() {
  const token = localStorage.getItem("token") || ""; // ← lấy token

  window.location.href = "mainPage.html";
}
// ── FETCH ALL (với auth) ──────────────────────────────────────
async function fetchAll() {
  if (!(await checkAuth())) return;
  const token = localStorage.getItem("token") || "";
  // console.log(localStorage.getItem("token"));

  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("grid").innerHTML = "";
  document.getElementById("emptyState").style.display = "none";

  try {
    const res = await fetch(`${API}/findall`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // Fallback JWT
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    console.log("Products loaded:", data.length);
    renderGrid(data);
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Failed to load products", "error");
  } finally {
    document.getElementById("loadingState").style.display = "none";
  }
}

function logout() {
  localStorage.removeItem("user");
  localStorage.clear;
  window.location = "login.html";
}

function renderGrid(products) {
  document.getElementById("productCount").textContent = products.length;
  const grid = document.getElementById("grid");
  if (products.length === 0) {
    document.getElementById("emptyState").style.display = "block";
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
            <div class="card">
                ${
                  p.img
                    ? `<img src="${
                        p.img
                      }" class="card-img" onclick='openView(${JSON.stringify(
                        p
                      )})'>`
                    : `<div class="card-img-placeholder" onclick='openView(${JSON.stringify(
                        p
                      )})'><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="10" width="18" height="8" rx="1"/><rect x="6" y="6" width="12" height="4" rx="1"/><line x1="7" y1="18" x2="7" y2="21"/><line x1="17" y1="18" x2="17" y2="21"/></svg><span>No Image</span></div>`
                }
                <div class="card-body">
                    <div class="card-tag">Furniture</div>
                    <div class="card-name" onclick='openView(${JSON.stringify(
                      p
                    )})'>${p.product_name}</div>
                    <div class="card-desc">${
                      p.description || "No description available."
                    }</div>
                    <div class="card-footer">
                        <div class="card-price"><span>$</span>${Number(
                          p.price
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}</div>
                        <div class="card-qty">Qty: ${p.quantity}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-edit" onclick='addToCart(${JSON.stringify(
                          p
                        )})'>Add to Cart</button>
                        
                    </div>
                </div>
            </div>
        `
    )
    .join("");
}

// ── SAVE (với auth) ───────────────────────────────────────────
async function handleSave() {
  if (!(await checkAuth())) return;
  const token = localStorage.getItem("token") || "";

  const payload = {
    product_name: document.getElementById("fName").value,
    price: parseFloat(document.getElementById("fPrice").value),
    quantity: parseInt(document.getElementById("fQty").value),
    img: document.getElementById("fImg").value,
    description: document.getElementById("fDesc").value,
  };

  try {
    if (!editId) {
      await fetch(`${API}/addproduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      showToast("Product added successfully");
    } else {
      await fetch(`${API}/update/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      showToast("Product updated");
    }
    closeFormModal();
    fetchAll();
  } catch {
    showToast("Operation failed", "error");
  }
}
//add to Cart
const CART_API = "http://127.0.0.1:8080/cart";

async function addToCart(p) {
  if (!(await checkAuth())) return;

  const token = localStorage.getItem("token") || "";

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
    } else {
      showToast("Add failed");
    }
  } catch {
    showToast("Error");
  }
}

//Seach in search Bar
async function search() {
  const token = localStorage.getItem("token") || "";

  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("grid").innerHTML = "";
  document.getElementById("emptyState").style.display = "none";
  keyword = document.getElementById("productsearching").value;

  try {
    const res = await fetch(`${API}/search?keyword=${keyword}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // Fallback JWT
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    console.log("Products loaded:", data.length);
    renderGrid(data);
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Failed to load products", "error");
  } finally {
    document.getElementById("loadingState").style.display = "none";
  }
}

// ── DELETE (với auth) ─────────────────────────────────────────
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
    fetchAll();
  } catch {
    showToast("Delete failed", "error");
  }
}

//
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
  document.getElementById("fName").value = p.product_name || "";
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
  document.getElementById("viewName").textContent = p.product_name;
  document.getElementById("viewPrice").textContent =
    "$" + Number(p.price).toLocaleString("en-US", { minimumFractionDigits: 2 });
  document.getElementById("viewDesc").textContent =
    p.description || "No description.";
  document.getElementById("viewQty").textContent = p.quantity + " units";
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

// ── INIT (chờ DOM + check auth) ───────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Main page loaded!");
  await fetchAll(); // Tự load products sau login
});
