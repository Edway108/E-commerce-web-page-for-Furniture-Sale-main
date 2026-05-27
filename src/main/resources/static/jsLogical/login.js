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

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await readJsonSafely(res);

    if (res.ok) {
      console.log("LOGIN OK:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.token);
      localStorage.setItem("username", username);
      localStorage.setItem("role", data.role);

      role = localStorage.getItem("role");
      if ((role || "").toUpperCase() === "ADMIN" || (role || "").toUpperCase() === "MANAGER") {
        window.location.href = "adminPage.html";
      } else {
        window.location.href = "mainPage.html";
      }

      // console.log(data.token);
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    alert("Network error: " + error.message);
  }
}
