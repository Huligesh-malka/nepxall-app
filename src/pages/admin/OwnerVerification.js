import React, { useEffect, useState } from "react";

const API = "https://nepxall-backend.onrender.com/api/admin/owners";

const OwnerVerification = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  //////////////////////////////////////////////////////
  // 🔥 FETCH PENDING OWNERS
  //////////////////////////////////////////////////////
  const fetchOwners = async () => {
    try {
      const res = await fetch(`${API}/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setOwners(data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  //////////////////////////////////////////////////////
  // ✅ APPROVE
  //////////////////////////////////////////////////////
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/approve/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Owner Approved");
        fetchOwners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  //////////////////////////////////////////////////////
  // ❌ REJECT
  //////////////////////////////////////////////////////
  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/reject/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        alert("❌ Rejected");
        fetchOwners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Owner Verification</h2>

      {owners.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {owners.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.email}</td>
                  <td>{o.phone}</td>

                  <td>
                    <button
                      style={approveBtn}
                      onClick={() => handleApprove(o.id)}
                    >
                      Approve
                    </button>

                    <button
                      style={rejectBtn}
                      onClick={() => handleReject(o.id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerVerification;

//////////////////////////////////////////////////////
// 🎨 STYLES
//////////////////////////////////////////////////////

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 20
};

const approveBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  marginRight: 8,
  borderRadius: 6,
  cursor: "pointer"
};

const rejectBtn = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer"
};