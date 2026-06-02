async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const repassword = document.getElementById("repassword").value;

  if (password === repassword) {
    const res = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
    } else {
      alert("Successful register");
      window.location = "login.html";
    }
  } else {
    alert("Mật khẩu không khớp");
  }
}
