// =============================
// 📁 frontend/src/components/Dashboard.jsx
// =============================
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject("Unauthorized"))
      .then(data => setUsername(data.username))
      .catch(err => {
        console.error(err);
        localStorage.removeItem("token");
        window.location.href = "/";
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="container">
      <h1>Welcome, <span>{username}</span>!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}