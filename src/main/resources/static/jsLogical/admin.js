const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:")
  ? "http://localhost:8080"
  : "";

const BASE_URL = API_ORIGIN;
let adminStompClient = null;
let activeChatUser = null;
let chatRooms = new Map();
let chatSubscriptions = new Set();

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { message: text || `HTTP ${response.status}` }; }
}

function token() { return localStorage.getItem("token") || ""; }
function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${token()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}
function role() { return (localStorage.getItem("role") || "").toUpperCase(); }
function requireAdmin() {
  if (!["ADMIN", "MANAGER"].includes(role())) {
    alert("Admin/Manager access required");
    window.location.href = "login.html";
  }
}
function getName(p) { return p.productName || p.product_name || "Unnamed product"; }
function noImg() {
  const d = document.createElement("div");
  d.style.cssText = "width:52px;height:52px;background:var(--parchment);border:1px solid #e0d8cc;";
  return d;
}
function imageUrl(src) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `${API_ORIGIN}/${src}`;
}

function toggleSidebar() { document.getElementById("sidebar").classList.toggle("collapsed"); }
function toggleDropdown(id, el) {
  document.getElementById(id).classList.toggle("open");
  el.classList.toggle("open");
}

function showSection(name) {
  document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.add("active");
  document.getElementById("page-title").innerText = name.replace("-", " ").toUpperCase();
  if (name === "dashboard") loadDashboard();
  if (name === "product-list") loadProducts();
  if (name === "user-list") loadUsers();
  if (name === "chat") connectAdminChat();
}

function injectModalStyles() {
  if (document.getElementById("modal-styles")) return;
  const style = document.createElement("style");
  style.id = "modal-styles";
  style.textContent = `
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 999; }
    .modal-box { background: var(--white); width: 440px; max-width: 92vw; padding: 34px 30px; border: 1px solid #e0d8cc; }
    .modal-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:var(--walnut); margin-bottom:20px; }
    .modal-field { margin-bottom:14px; }
    .modal-label { display:block; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--mist); margin-bottom:6px; }
    .modal-input { width:100%; padding:10px 12px; border:1px solid #e0d8cc; background:var(--white); font-size:13px; color:var(--ink); outline:none; }
    .modal-actions { display:flex; gap:10px; margin-top:22px; }
    .btn-modal-confirm { flex:1; padding:11px; background:var(--walnut); color:var(--white); border:none; cursor:pointer; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
    .btn-modal-cancel { flex:1; padding:11px; background:none; color:var(--walnut); border:1px solid #e0d8cc; cursor:pointer; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
  `;
  document.head.appendChild(style);
}

function openModal(title, fields, confirmLabel = "Save") {
  injectModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        ${fields.map((f) => `
          <div class="modal-field">
            <label class="modal-label" for="mf-${f.id}">${f.label}</label>
            <input class="modal-input" id="mf-${f.id}" type="${f.type || "text"}" placeholder="${f.placeholder || ""}" value="${f.value || ""}" />
          </div>`).join("")}
        <div class="modal-actions">
          <button class="btn-modal-cancel" id="modal-cancel">Cancel</button>
          <button class="btn-modal-confirm" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = (data) => { overlay.remove(); resolve(data); };
    overlay.querySelector("#modal-cancel").onclick = () => close(null);
    overlay.querySelector("#modal-confirm").onclick = () => {
      const result = {};
      fields.forEach((f) => result[f.id] = overlay.querySelector(`#mf-${f.id}`).value);
      close(result);
    };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(null); if (e.key === "Enter") overlay.querySelector("#modal-confirm").click(); });
    const first = overlay.querySelector(".modal-input");
    if (first) first.focus();
  });
}

async function loadDashboard() {
  try {
    const [prodRes, userRes] = await Promise.all([
      fetch(`${BASE_URL}/products/findall`, { headers: authHeaders(false) }),
      fetch(`${BASE_URL}/users/findall`, { headers: authHeaders(false) }),
    ]);
    const products = prodRes.ok ? await readJsonSafely(prodRes) : [];
    const users = userRes.ok ? await readJsonSafely(userRes) : [];
    const totalStock = products.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
    const outOfStock = products.filter((p) => Number(p.quantity) === 0).length;
    const recent = [...products].reverse().slice(0, 5);
    document.getElementById("section-dashboard").innerHTML = `
      <h1>Dashboard</h1>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${products.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value">${users.length}</div></div>
        <div class="stat-card"><div class="stat-label">Items in Stock</div><div class="stat-value">${totalStock.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">Out of Stock</div><div class="stat-value" style="color:var(--danger)">${outOfStock}</div></div>
      </div>
      <h2 class="admin-subtitle">Recent Products</h2>
      <table class="data-table"><thead><tr><th style="width:68px">Image</th><th>Name</th><th>Price</th><th>Quantity</th></tr></thead><tbody>
        ${recent.map((p) => `<tr><td>${p.img ? `<img src="${imageUrl(p.img)}" alt="${getName(p)}" style="width:48px;height:48px;object-fit:cover;border:1px solid #e0d8cc;display:block;" onerror="this.replaceWith(noImg())" />` : `<div style="width:48px;height:48px;background:var(--parchment);border:1px solid #e0d8cc;"></div>`}</td><td>${getName(p)}</td><td>${Number(p.price || 0).toLocaleString()}</td><td>${p.quantity ?? 0}</td></tr>`).join("")}
      </tbody></table>`;
  } catch (error) {
    showToast("Dashboard load failed", "error");
  }
}

async function loadProducts(keyword = "") {
  const section = document.getElementById("section-product-list");
  section.innerHTML = `<h1>Products</h1><div class="admin-toolbar"><input id="adminProductSearch" placeholder="Search product by name..." value="${keyword}" onkeydown="if(event.key==='Enter') searchAdminProducts()"><button class="btn-add" onclick="searchAdminProducts()">Search</button><button class="btn-light" onclick="loadProducts()">Reset</button><button class="btn-add" onclick="openAddModal('product')">+ Add Product</button></div><div class="loading">Loading products...</div>`;
  try {
    const url = keyword ? `${BASE_URL}/products/search?keyword=${encodeURIComponent(keyword)}` : `${BASE_URL}/products/findall`;
    const res = await fetch(url, { headers: authHeaders(false) });
    const data = await readJsonSafely(res);
    const products = Array.isArray(data) ? data : [];
    renderProductTable(products, keyword);
  } catch (error) {
    section.innerHTML += `<p class="error-text">Failed to load products.</p>`;
  }
}

function searchAdminProducts() {
  const keyword = document.getElementById("adminProductSearch")?.value.trim() || "";
  loadProducts(keyword);
}

function renderProductTable(data, keyword = "") {
  const section = document.getElementById("section-product-list");
  const rows = data.map((p) => `
    <tr>
      <td>${p.img ? `<img src="${imageUrl(p.img)}" alt="${getName(p)}" style="width:52px;height:52px;object-fit:cover;border:1px solid #e0d8cc;display:block;" onerror="this.replaceWith(noImg())" />` : `<div style="width:52px;height:52px;background:var(--parchment);border:1px solid #e0d8cc;"></div>`}</td>
      <td>${p.id}</td><td>${getName(p)}</td><td>${p.price}</td><td>${p.quantity}</td>
      <td><button onclick="editProduct(${p.id})">Edit</button><button onclick="deleteProduct(${p.id})">Delete</button></td>
    </tr>`).join("");
  section.innerHTML = `
    <h1>Products</h1>
    <div class="admin-toolbar"><input id="adminProductSearch" placeholder="Search product by name..." value="${keyword}" onkeydown="if(event.key==='Enter') searchAdminProducts()"><button class="btn-add" onclick="searchAdminProducts()">Search</button><button class="btn-light" onclick="loadProducts()">Reset</button><button class="btn-add" onclick="openAddModal('product')">+ Add Product</button></div>
    <div class="result-count">Showing ${data.length} product(s)</div>
    <table class="data-table"><thead><tr><th style="width:72px">Image</th><th>ID</th><th>Name</th><th>Price</th><th>Quantity</th><th>Action</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No products found.</td></tr>`}</tbody></table>`;
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const res = await fetch(`${BASE_URL}/products/${id}`, { method: "DELETE", headers: authHeaders(false) });
  if (!res.ok) return showToast("Delete failed", "error");
  showToast("Product deleted", "success");
  loadProducts();
}

async function editProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, { headers: authHeaders(false) });
  const p = await readJsonSafely(res);
  const data = await openModal("Edit Product", [
    { id: "product_name", label: "Name", value: getName(p) },
    { id: "price", label: "Price", value: p.price, type: "number" },
    { id: "quantity", label: "Quantity", value: p.quantity, type: "number" },
    { id: "description", label: "Description", value: p.description || "" },
    { id: "img", label: "Image URL", value: p.img || "", placeholder: "https://..." },
  ], "Save Changes");
  if (!data) return;
  await fetch(`${BASE_URL}/products/update/${id}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify({ product_name: data.product_name, price: Number(data.price), quantity: Number(data.quantity), description: data.description, img: data.img }) });
  loadProducts();
}

async function loadUsers() {
  const section = document.getElementById("section-user-list");
  try {
    const res = await fetch(`${BASE_URL}/users/findall`, { headers: authHeaders(false) });
    const data = await readJsonSafely(res);
    if (!res.ok) throw new Error(data.message || "Cannot load users");
    section.innerHTML = `<h1>Users</h1><button class="btn-add" onclick="openAddModal('user')">+ Add User</button><table class="data-table"><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Phone</th><th>Action</th></tr></thead><tbody>${data.map((u) => `<tr><td>${u.userId}</td><td>${u.username}</td><td>${u.role || ""}</td><td>${u.phonenumber || ""}</td><td><button onclick="editUser(${u.userId})">Edit</button></td></tr>`).join("")}</tbody></table>`;
  } catch (error) {
    section.innerHTML = `<h1>Users</h1><p class="error-text">${error.message}. Only ADMIN can manage users.</p>`;
  }
}

async function editUser(id) {
  const data = await openModal("Edit User", [
    { id: "username", label: "Username" },
    { id: "phonenumber", label: "Phone", type: "tel" },
    { id: "address", label: "Address" },
  ], "Save Changes");
  if (!data) return;
  await fetch(`${BASE_URL}/users/update/${id}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify(data) });
  loadUsers();
}

async function openAddModal(type) {
  if (type === "product") {
    const data = await openModal("Add Product", [
      { id: "product_name", label: "Product name", placeholder: "e.g. Walnut Coffee Table" },
      { id: "price", label: "Price", type: "number", placeholder: "0.00" },
      { id: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { id: "description", label: "Description", placeholder: "Short description..." },
      { id: "img", label: "Image URL", placeholder: "https://..." },
    ], "Add Product");
    if (!data) return;
    const res = await fetch(`${BASE_URL}/products/addproduct`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ product_name: data.product_name, price: Number(data.price), quantity: Number(data.quantity), description: data.description, img: data.img }) });
    if (!res.ok) return showToast((await readJsonSafely(res)).message || "Add product failed", "error");
    showToast("Product added", "success");
    loadProducts();
  }
  if (type === "user") {
    const data = await openModal("Add User", [
      { id: "username", label: "Username" },
      { id: "password", label: "Password", type: "password" },
      { id: "phonenumber", label: "Phone", type: "tel" },
      { id: "address", label: "Address" },
    ], "Add User");
    if (!data) return;
    const res = await fetch(`${BASE_URL}/users/addUser`, { method: "POST", headers: authHeaders(true), body: JSON.stringify(data) });
    if (!res.ok) return showToast((await readJsonSafely(res)).message || "Add user failed", "error");
    showToast("User added", "success");
    loadUsers();
  }
}

function connectAdminChat() {
  if (adminStompClient && adminStompClient.connected) return;
  const socket = new SockJS(`${API_ORIGIN}/ws`);
  adminStompClient = Stomp.over(socket);
  adminStompClient.debug = null;
  adminStompClient.connect({}, () => {
    adminStompClient.subscribe("/topic/admin/chat-notifications", (msg) => {
      const n = JSON.parse(msg.body);
      addChatUser(n.roomId || n.sender, n.sender, true);
      showToast(`${n.sender} wants to chat`, "success");
    });
  });
}

function addChatUser(roomId, username, unread = false) {
  if (!roomId || !username) return;
  if (!chatRooms.has(roomId)) chatRooms.set(roomId, { username, messages: [], unread: 0 });
  const room = chatRooms.get(roomId);
  room.username = username;
  if (unread && activeChatUser !== roomId) room.unread += 1;
  renderChatUserList();
  updateChatBadge();
}

function renderChatUserList() {
  const list = document.getElementById("chatUserList");
  if (!list) return;
  const rooms = [...chatRooms.entries()];
  if (!rooms.length) {
    list.className = "chat-users-empty";
    list.innerHTML = "No chat request yet.";
    return;
  }
  list.className = "";
  list.innerHTML = rooms.map(([roomId, room]) => `<button class="chat-user-btn ${activeChatUser === roomId ? "active" : ""}" onclick="openAdminChat('${roomId}')"><span>${room.username}</span>${room.unread ? `<b>${room.unread}</b>` : ""}</button>`).join("");
}

function openAdminChat(roomId) {
  activeChatUser = roomId;
  const room = chatRooms.get(roomId) || { username: roomId, messages: [], unread: 0 };
  room.unread = 0;
  chatRooms.set(roomId, room);
  document.getElementById("chatRoomTitle").textContent = `Chat with ${room.username}`;
  if (adminStompClient && adminStompClient.connected && !chatSubscriptions.has(roomId)) {
    adminStompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
      const message = JSON.parse(msg.body);
      const current = chatRooms.get(roomId) || { username: roomId, messages: [], unread: 0 };
      current.messages.push(message);
      if (activeChatUser !== roomId) current.unread += 1;
      chatRooms.set(roomId, current);
      renderAdminMessages();
      renderChatUserList();
      updateChatBadge();
    });
    chatSubscriptions.add(roomId);
  }
  renderAdminMessages();
  renderChatUserList();
  updateChatBadge();
}

function renderAdminMessages() {
  const box = document.getElementById("adminMessages");
  if (!box || !activeChatUser) return;
  const room = chatRooms.get(activeChatUser);
  box.innerHTML = (room?.messages || []).map((m) => `<div class="admin-msg ${m.sender === (localStorage.getItem("username") || "admin") ? "mine" : "theirs"}"><strong>${m.sender}</strong><span>${m.content || ""}</span></div>`).join("");
  box.scrollTop = box.scrollHeight;
}

function sendAdminMessage() {
  if (!activeChatUser) return alert("Select a user first");
  const input = document.getElementById("adminChatInput");
  const content = input.value.trim();
  if (!content) return;
  connectAdminChat();
  adminStompClient.send("/app/chat.adminSend", {}, JSON.stringify({
    sender: localStorage.getItem("username") || "admin",
    recipient: activeChatUser,
    roomId: activeChatUser,
    content,
    type: "CHAT"
  }));
  input.value = "";
}

function updateChatBadge() {
  const badge = document.getElementById("adminChatBadge");
  if (!badge) return;
  const total = [...chatRooms.values()].reduce((sum, room) => sum + room.unread, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? "inline-flex" : "none";
}

async function logout() {
  try { await fetch(`${BASE_URL}/auth/logout`, { method: "POST", headers: authHeaders(false) }); } catch {}
  localStorage.clear();
  window.location.href = "login.html";
}

function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => (el.className = "toast"), 3000);
}

window.onload = () => {
  requireAdmin();
  connectAdminChat();
  showSection("dashboard");
};
