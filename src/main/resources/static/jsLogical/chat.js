const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:") ? "http://localhost:8080" : "";
let stompClient = null;
let username = null;
let roomId = null;

async function checkAuth() {
  if (!localStorage.getItem("user") || !localStorage.getItem("token")) {
    alert("Please login first!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function connect() {
  if (!(await checkAuth())) return;
  username = localStorage.getItem("username") || "customer";
  roomId = username;
  const socket = new SockJS(`${API_ORIGIN}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.debug = null;
  stompClient.connect({}, function () {
    stompClient.subscribe(`/topic/chat/${roomId}`, function (msg) { showMessage(JSON.parse(msg.body)); });
    stompClient.send("/app/chat.join", {}, JSON.stringify({ sender: username, roomId, type: "JOIN" }));
  });
}

function reload() { window.location.href = "mainPage.html"; }

function sendMessage() {
  const input = document.getElementById("messageInput");
  const content = input.value.trim();
  if (!content) return alert("Input the message first");
  if (!stompClient || !stompClient.connected) return connect().then(() => setTimeout(sendMessage, 300));
  stompClient.send("/app/chat.send", {}, JSON.stringify({ sender: username, recipient: "admin", roomId, content, type: "CHAT" }));
  input.value = "";
}

function showMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const div = document.createElement("div");
  if (message.type === "JOIN") {
    div.className = "join";
    div.innerText = message.sender + " joined the chat";
  } else {
    div.className = message.sender === username ? "message mine" : "message theirs";
    div.innerHTML = `<strong>${message.sender}</strong><span>${message.content || ""}</span>`;
  }
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.addEventListener("DOMContentLoaded", connect);
