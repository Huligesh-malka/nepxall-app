import React, { useState } from "react";
import axios from "axios";

// 🔥 YOUR PRODUCTION BACKEND
const API_URL = "https://nepxall-backend.onrender.com/api";

const AdminAddPG = () => {
  const [form, setForm] = useState({
    pg_name: "",
    address: "",
    city: "",
    contact_phone: "",
    contact_person: ""
  });

  const [loading, setLoading] = useState(false);

  //////////////////////////////////////////////////////
  // HANDLE INPUT
  //////////////////////////////////////////////////////
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  //////////////////////////////////////////////////////
  // SUBMIT
  //////////////////////////////////////////////////////
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("❌ Please login again");
        return;
      }

      // 🔥 CLEAN PHONE
      const cleanPhone = form.contact_phone.replace(/\D/g, "");

      const payload = {
        ...form,
        contact_phone: cleanPhone
      };

      const res = await axios.post(
        `${API_URL}/pg/add`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ PG Added Successfully");

      console.log("Response:", res.data);

      // 🔥 RESET FORM
      setForm({
        pg_name: "",
        address: "",
        city: "",
        contact_phone: "",
        contact_person: ""
      });

    } catch (err) {
      console.error("ERROR:", err);

      if (err.response) {
        alert(`❌ ${err.response.data.message}`);
      } else {
        alert("❌ Network error");
      }

    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div style={container}>
      <h2 style={title}>Admin Add PG</h2>

      <input
        name="pg_name"
        placeholder="PG Name"
        value={form.pg_name}
        onChange={handleChange}
        style={input}
      />

      <input
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
        style={input}
      />

      <input
        name="city"
        placeholder="City"
        value={form.city}
        onChange={handleChange}
        style={input}
      />

      <input
        name="contact_person"
        placeholder="Owner Name"
        value={form.contact_person}
        onChange={handleChange}
        style={input}
      />

      <input
        name="contact_phone"
        placeholder="Owner Phone (10 digits)"
        value={form.contact_phone}
        onChange={handleChange}
        style={input}
      />

      <button onClick={handleSubmit} style={button} disabled={loading}>
        {loading ? "Adding..." : "Add PG"}
      </button>
    </div>
  );
};

export default AdminAddPG;

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = {
  padding: 30,
  maxWidth: 400,
  margin: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const title = {
  textAlign: "center",
  marginBottom: 10
};

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const button = {
  padding: 12,
  borderRadius: 8,
  background: "#0B5ED7",
  color: "#fff",
  border: "none",
  cursor: "pointer"
};