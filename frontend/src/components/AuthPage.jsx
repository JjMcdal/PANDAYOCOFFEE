// =============================
// 📁 frontend/src/components/AuthPage.jsx
// =============================
import { useState } from "react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("register");
  const [message, setMessage] = useState("");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage("");
  };

  const handleTogglePassword = (targetId) => {
    const input = document.getElementById(targetId);
    const type = input.getAttribute("type") === "password" ? "text" : "password";
    input.setAttribute("type", type);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password } = e.target;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      })
    });
    const data = await res.json();
    setMessage(res.ok ? "✅ Registered!" : `❌ ${data.error}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = e.target;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      setMessage("✅ Login successful!");
      window.location.reload();
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

  return (
    <div className="container">
      <h1>Pandayo Coffee</h1>
      <div className="tabs">
        <button className={activeTab === "register" ? "active" : ""} onClick={() => handleTabChange("register")}>Register</button>
        <button className={activeTab === "login" ? "active" : ""} onClick={() => handleTabChange("login")}>Login</button>
      </div>

      {activeTab === "register" && (
        <form onSubmit={handleRegister}>
          <label>Username</label>
          <input name="username" type="text" required placeholder="Username" />
          <label>Email</label>
          <input name="email" type="email" required placeholder="Email" />
          <label>Password</label>
          <div className="password-wrapper">
            <input id="reg-password" name="password" type="password" required placeholder="Password" />
            <button type="button" onClick={() => handleTogglePassword("reg-password")}>Show</button>
          </div>
          <button type="submit" className="btn">Register</button>
        </form>
      )}

      {activeTab === "login" && (
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input name="email" type="email" required placeholder="Email" />
          <label>Password</label>
          <div className="password-wrapper">
            <input id="login-password" name="password" type="password" required placeholder="Password" />
            <button type="button" onClick={() => handleTogglePassword("login-password")}>Show</button>
          </div>
          <button type="submit" className="btn">Login</button>
        </form>
      )}

      <p id="message">{message}</p>
    </div>
  );
}