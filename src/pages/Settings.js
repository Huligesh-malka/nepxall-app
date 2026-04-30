import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Settings() {
  const [user, setUser] = useState({
    name: "",
    phone: "",
    area: "",
    road: "",
    pg_address: ""
  });

  const token = localStorage.getItem("token");

  // GET SETTINGS
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        "https://nepxall-backend.onrender.com/api/settings",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser(res.data.user);

    } catch (err) {
      console.error(err);
    }
  };

  // UPDATE SETTINGS
  const updateSettings = async () => {
    try {
      await axios.put(
        "https://nepxall-backend.onrender.com/api/settings",
        user,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Settings Updated Successfully");

    } catch (err) {
      console.error(err);
      alert("Update Failed");
    }
  };

  return (
    <div style={{ padding: 20 }}>

      <h2>Settings</h2>

      <input
        type="text"
        placeholder="Name"
        value={user.name || ""}
        onChange={(e) =>
          setUser({ ...user, name: e.target.value })
        }
      />

      <br /><br />

      <input
        type="text"
        placeholder="Phone"
        value={user.phone || ""}
        onChange={(e) =>
          setUser({ ...user, phone: e.target.value })
        }
      />

      <br /><br />

      <input
        type="text"
        placeholder="Area"
        value={user.area || ""}
        onChange={(e) =>
          setUser({ ...user, area: e.target.value })
        }
      />

      <br /><br />

      <input
        type="text"
        placeholder="Road"
        value={user.road || ""}
        onChange={(e) =>
          setUser({ ...user, road: e.target.value })
        }
      />

      <br /><br />

      <textarea
        placeholder="Address"
        value={user.pg_address || ""}
        onChange={(e) =>
          setUser({ ...user, pg_address: e.target.value })
        }
      />

      <br /><br />

      <button onClick={updateSettings}>
        Save Settings
      </button>

    </div>
  );
}