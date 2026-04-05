import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../api/api";

const OwnerReviewReply = () => {
  const { pgId } = useParams();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD REVIEWS ================= */
  const loadReviews = useCallback(async () => {
    if (!pgId) return;

    try {
      setPageLoading(true);

      const res = await api.get(`/reviews/${pgId}`);

      if (res.data?.success) {
        setReviews(res.data.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load reviews");
    } finally {
      setPageLoading(false);
    }
  }, [pgId]);

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner" && pgId) {
      loadReviews();
    }
  }, [user, role, authLoading, pgId, navigate, loadReviews]);

  /* ================= SUBMIT / UPDATE REPLY ================= */
  const submitReply = async (reviewId) => {
    const text = replyText[reviewId];

    if (!text?.trim()) return alert("Write reply first");

    try {
      await api.post("/reviews/reply", {
        review_id: reviewId,
        reply: text
      });

      setEditingId(null);
      setReplyText({});

      // Optimistic reload
      loadReviews();
    } catch {
      alert("Reply failed ❌");
    }
  };

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "red", padding: 20 }}>
        {error}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={page}>
      <h2>👑 Owner Replies — PG #{pgId}</h2>

      {reviews.length === 0 && (
        <p style={{ color: "#666" }}>No reviews for this PG yet</p>
      )}

      {reviews.map((r) => (
        <div key={r.id} style={reviewCard}>
          <b>{r.user_name}</b>

          <div style={{ color: "#facc15", marginTop: 4 }}>
            {"★".repeat(r.rating)}
            <span style={{ color: "#d1d5db" }}>
              {"★".repeat(5 - r.rating)}
            </span>
          </div>

          <p style={{ marginTop: 8 }}>{r.comment}</p>

          {/* OWNER REPLY VIEW */}
          {r.owner_reply && editingId !== r.id ? (
            <div style={ownerReplyCard}>
              <div style={replyHeader}>
                <span>👑 Your Reply</span>

                <button
                  style={editBtn}
                  onClick={() => {
                    setEditingId(r.id);
                    setReplyText({ [r.id]: r.owner_reply });
                  }}
                >
                  ✏ Edit
                </button>
              </div>

              <p>{r.owner_reply}</p>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <textarea
                placeholder="Write your reply..."
                style={textarea}
                value={replyText[r.id] || ""}
                onChange={(e) =>
                  setReplyText({
                    ...replyText,
                    [r.id]: e.target.value
                  })
                }
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={replyBtn}
                  onClick={() => submitReply(r.id)}
                >
                  {editingId === r.id ? "Update Reply" : "Reply"}
                </button>

                {editingId === r.id && (
                  <button
                    style={cancelBtn}
                    onClick={() => {
                      setEditingId(null);
                      setReplyText({});
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ================= STYLES ================= */

const page = {
  maxWidth: 900,
  margin: "auto",
  padding: 20
};

const reviewCard = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  marginBottom: 15,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};

const textarea = {
  width: "100%",
  minHeight: 70,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const replyBtn = {
  marginTop: 8,
  padding: "8px 16px",
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const cancelBtn = {
  marginTop: 8,
  padding: "8px 16px",
  background: "#9ca3af",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const editBtn = {
  background: "transparent",
  border: "none",
  color: "#1976d2",
  cursor: "pointer",
  fontSize: 14
};

const ownerReplyCard = {
  marginTop: 10,
  padding: 12,
  background: "#f0f9ff",
  borderLeft: "4px solid #0284c7",
  borderRadius: 8
};

const replyHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontWeight: 600,
  marginBottom: 6
};

export default OwnerReviewReply;