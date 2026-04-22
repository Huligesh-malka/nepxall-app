import React, { useState } from "react";
import api from "../api/api";

export default function AddPGPublic() {
  const [form, setForm] = useState({
    pg_name: "",
    contact_phone: "",
    city: "",
    address: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!form.pg_name || !form.contact_phone || !form.city) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/pg/add-public", form);

      if (res.data.success) {
        alert("✅ PG submitted successfully!\nWe will contact you soon.");

        setForm({
          pg_name: "",
          contact_phone: "",
          city: "",
          address: ""
        });
      } else {
        alert("❌ " + res.data.message);
      }

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      <h2>➕ Add PG (No Login)</h2>

      <input
        name="pg_name"
        placeholder="PG Name"
        value={form.pg_name}
        onChange={handleChange}
        style={input}
      />

      <input
        name="contact_phone"
        placeholder="Phone Number"
        value={form.contact_phone}
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

      <textarea
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
        style={input}
      />

      <button onClick={handleSubmit} style={btn}>
        {loading ? "Submitting..." : "Submit PG"}
      </button>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px"
};

const btn = {
  width: "100%",
  padding: "12px",
  background: "green",
  color: "white",
  border: "none",
  cursor: "pointer"
};