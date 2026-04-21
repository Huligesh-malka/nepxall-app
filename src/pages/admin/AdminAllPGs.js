import React, { useEffect, useState } from "react";

const API_BASE = "https://nepxall-backend.onrender.com/api";

const AdminAllPGs = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  /* ================= FETCH PGs ================= */
  const fetchPGs = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/admin/pgs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔥 HANDLE AUTH ERROR
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      // 🔥 SAFE PARSE
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success) {
        setPgs(data.data);
      } else {
        setError("Failed to load PGs");
      }
    } catch (err) {
      console.error("Error fetching PGs:", err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchPGs();
  }, []);

  /* ================= APPROVE ================= */
  const handleApprove = async (id) => {
    try {
      await fetch(`${API_BASE}/admin/pg/${id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPGs();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  /* ================= REJECT ================= */
  const handleReject = async (id) => {
    try {
      await fetch(`${API_BASE}/admin/pg/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPGs();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <p style={{ padding: 20 }}>Loading PGs...</p>;
  }

  if (error) {
    return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>🏠 All PGs</h2>

      {pgs.length === 0 && <p>No PGs found</p>}

      <div style={{ display: "grid", gap: 15 }}>
        {pgs.map((pg) => (
          <div
            key={pg.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 15,
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginBottom: 5 }}>{pg.name}</h3>
            <p style={{ color: "#64748b" }}>{pg.area}</p>

            <p>
              <strong>Owner:</strong> {pg.owner_name}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color:
                    pg.status === "active"
                      ? "green"
                      : pg.status === "pending"
                      ? "orange"
                      : "red",
                  fontWeight: "bold",
                }}
              >
                {pg.status}
              </span>
            </p>

            <p>
              <strong>Price:</strong> ₹{pg.single_sharing || "N/A"}
            </p>

            {/* IMAGE */}
            {pg.photos?.[0] && (
              <img
                src={`${API_BASE.replace("/api", "")}${pg.photos[0]}`}
                alt="pg"
                style={{
                  width: 200,
                  borderRadius: 10,
                  marginTop: 10,
                }}
              />
            )}

            {/* ACTION BUTTONS */}
            {pg.status === "pending" && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => handleApprove(pg.id)}
                  style={{
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    marginRight: 10,
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  ✅ Approve
                </button>

                <button
                  onClick={() => handleReject(pg.id)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAllPGs;