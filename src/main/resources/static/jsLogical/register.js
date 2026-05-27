const API_ORIGIN = (window.location.port === "5500" || window.location.protocol === "file:")
  ? "http://localhost:8080"
  : "";

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text || `HTTP ${response.status}` };
  }
}

async function register() {
  const username = document.getElementById("username").value.trim();
  const fullName = document.getElementById("fullName")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const phonenumber = document.getElementById("phonenumber")?.value.trim() || "";
  const password = document.getElementById("password").value;
  const repassword = document.getElementById("repassword").value;

  if (!username) {
    alert("Username is required");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  if (password !== repassword) {
    alert("Mật khẩu không khớp");
    return;
  }

  try {
    const res = await fetch(`${API_ORIGIN}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        fullName: fullName || null,
        email: email || null,
        phonenumber: phonenumber ? Number(phonenumber) : 0,
      }),
    });

    const data = await readJsonSafely(res);

    if (!res.ok) {
      alert(data.message || `Register failed with status ${res.status}`);
      return;
    }

    alert("Successful register");
    window.location = "login.html";
  } catch (error) {
    alert(`Network error: ${error.message}`);
  }
}
