import React, { useEffect, useState } from "react";

const AdminAllPGs = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchPGs = async () => {
    try {
      const res = await fetch("https://nepxall.com/api/admin/pgs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setPgs(data.data);
      }
    } catch (err) {
      console.error("Error fetching PGs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPGs();
  }, []);

  const handleApprove = async (id) => {
    await fetch(`https://nepxall.com/api/admin/pg/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPGs();
  };

  const handleReject = async (id) => {
    await fetch(`https://nepxall.com/api/admin/pg/${id}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPGs();
  };

  if (loading) return <p>Loading PGs...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>All PGs</h2>

      <div style={{ display: "grid", gap: 15 }}>
        {pgs.map((pg) => (
          <div
            key={pg.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 15,
              background: "#fff",
            }}
          >
            <h3>{pg.name}</h3>
            <p>{pg.area}</p>
            <p>Owner: {pg.owner_name}</p>

            <p>
              Status:{" "}
              <strong
                style={{
                  color:
                    pg.status === "active"
                      ? "green"
                      : pg.status === "pending"
                      ? "orange"
                      : "red",
                }}
              >
                {pg.status}
              </strong>
            </p>

            <p>₹{pg.single_sharing || "N/A"}</p>

            {/* IMAGE */}
            {pg.photos?.[0] && (
              <img
                src={`https://nepxall.com${pg.photos[0]}`}
                alt=""
                style={{ width: 200, borderRadius: 8 }}
              />
            )}

            {/* ACTIONS */}
            {pg.status === "pending" && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleApprove(pg.id)}
                  style={{
                    background: "green",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    marginRight: 10,
                    borderRadius: 6,
                  }}
                >
                  Approve
                </button>

                <button
                  onClick={() => handleReject(pg.id)}
                  style={{
                    background: "red",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                  }}
                >
                  Reject
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