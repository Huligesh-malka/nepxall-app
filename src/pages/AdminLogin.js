import React from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();

  const login = () => {
    // TEMP – later real auth
    navigate("/admin/dashboard");
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Admin Login</h2>

      <input placeholder="Username" style={inputStyle} />
      <input type="password" placeholder="Password" style={inputStyle} />

      <button onClick={login} style={btnStyle}>
        Login
      </button>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
};

const btnStyle = {
  width: "100%",
  padding: 10,
};

export default AdminLogin;
