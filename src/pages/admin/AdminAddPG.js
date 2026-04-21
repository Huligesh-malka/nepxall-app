import React, { useState } from "react";
import axios from "axios";

const AdminAddPG = () => {
  const [form, setForm] = useState({
    pg_name: "",
    address: "",
    city: "",
    contact_phone: "",
    contact_person: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/pg/add",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ PG Added Successfully");
      console.log(res.data);

    } catch (err) {
      console.error(err);
      alert("❌ Error adding PG");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Add PG</h2>

      <input name="pg_name" placeholder="PG Name" onChange={handleChange} /><br/><br/>
      <input name="address" placeholder="Address" onChange={handleChange} /><br/><br/>
      <input name="city" placeholder="City" onChange={handleChange} /><br/><br/>
      <input name="contact_person" placeholder="Owner Name" onChange={handleChange} /><br/><br/>
      <input name="contact_phone" placeholder="Owner Phone" onChange={handleChange} /><br/><br/>

      <button onClick={handleSubmit}>Add PG</button>
    </div>
  );
};

export default AdminAddPG;