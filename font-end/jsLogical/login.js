const BASE_URL = "http://127.0.0.1:8080";

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log("LOGIN OK:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.token);
      localStorage.setItem("username", username);
      localStorage.setItem("role", data.role);

      role = localStorage.getItem("role");
      if (role === "admin") {
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
