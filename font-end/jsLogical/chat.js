let stompClient = null;
let username = null;
let counter = 1;

// to hide JOIN button
function handleClick() {
  if (counter > 0) {
    counter--;
    document.getElementById("btn-join").style.display = "none";
    connect();
  }
}

function sendMess() {
  document.getElementById("btn-send").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      console.log("Message sent");
      sendMessage();
    }
  });
}

async function checkAuth() {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}
async function connect() {
  if (!(await checkAuth())) return;
  const token = localStorage.getItem("token") || "";

  username = localStorage.getItem("username");

  const socket = new SockJS("http://127.0.0.1:8080/ws");
  stompClient = Stomp.over(socket);

  stompClient.connect({}, function () {
    console.log("Connected");

    // subscribe đúng với backend của bạn
    stompClient.subscribe("/topic/public", function (msg) {
      showMessage(JSON.parse(msg.body));
    });

    // gửi JOIN
    stompClient.send(
      "/app/chat.join",
      {},
      JSON.stringify({
        Authorization: `Bearer ${token}`,
        sender: username,
        type: "JOIN",
      })
    );
  });
}

async function reload() {
  window.location.href = "mainPage.html";
}
function sendMessage() {
  const content = document.getElementById("messageInput").value;
  if (!content | (content.trim() === "")) {
    alert("Input the message first");
  } else {
    stompClient.send(
      "/app/chat.send",
      {},
      JSON.stringify({
        sender: username,
        content: content,
        type: "CHAT",
      })
    );

    document.getElementById("messageInput").value = "";
  }
}
function showMessage(message) {
  const messagesDiv = document.getElementById("messages");

  const div = document.createElement("div");

  if (message.type === "JOIN") {
    div.classList.add("join");
    div.innerText = message.sender + " joined the chat";
  } else {
    div.classList.add("message");
    div.innerText = message.sender + ": " + message.content;
  }

  messagesDiv.appendChild(div);

  // auto scroll xuống dưới
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
