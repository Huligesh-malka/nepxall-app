import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const API = "http://localhost:5000/api/admin";
const BASE_URL = "http://localhost:5000";

const AdminPGDetails = () => {
  const { id } = useParams();

  const [pg, setPG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* ================= HELPERS ================= */
  const yesNo = (v) => (v ? "Yes" : "No");
  const money = (v) => (v ? `₹${Number(v).toLocaleString("en-IN")}` : "—");

  const normalizePhotos = (pgData) => {
    if (Array.isArray(pgData.photos)) return pgData.photos;
    if (typeof pgData.photos === "string") {
      try {
        return JSON.parse(pgData.photos);
      } catch {
        return [];
      }
    }
    return [];
  };

  /* ================= LOAD PG ================= */
  const loadPG = async (user) => {
    try {
      const token = await user.getIdToken(true);
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API}/pg/${id}`, { headers });

      setPG(res.data.data);
      setPhotos(normalizePhotos(res.data.data));
    } catch (err) {
      console.error("Load PG error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTH READY ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadPG(user); // 🔥 only load AFTER auth ready
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [id]);

  /* ================= ACTIONS ================= */
  const approve = async () => {
    if (!window.confirm("Approve this property?")) return;
    try {
      setActionLoading(true);
      const token = await auth.currentUser.getIdToken(true);
      await axios.patch(
        `${API}/pg/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPG(auth.currentUser);
    } catch {
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert("Enter rejection reason");
    try {
      setActionLoading(true);
      const token = await auth.currentUser.getIdToken(true);
      await axios.patch(
        `${API}/pg/${id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReject(false);
      loadPG(auth.currentUser);
    } catch {
      alert("Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!pg) return <div className="p-10 text-center">No data found</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">

        <Section title="1. Property Summary">
          <Row label="Property Name" value={pg.pg_name} />
          <Row label="Category" value={pg.pg_category} />
          <Row label="Type" value={pg.pg_type} />
          <Row label="Status" value={pg.status} />
        </Section>

        <Section title="2. Owner Details">
          <Row label="Owner UID" value={pg.owner_id} />
          <Row label="Contact Person" value={pg.contact_person} />
          <Row label="Phone" value={pg.contact_phone} />
          <Row label="Email" value={pg.contact_email} />
        </Section>

        <Section title="3. Location Details">
          <Row label="Address" value={pg.address} />
          <Row label="Area" value={pg.area} />
          <Row label="City" value={pg.city} />
          <Row label="State" value={pg.state} />
          <Row label="Pincode" value={pg.pincode} />
          <Row label="Latitude" value={pg.latitude} />
          <Row label="Longitude" value={pg.longitude} />
        </Section>

        <Section title="4. Pricing Details">
          <Row label="Single Sharing" value={money(pg.single_sharing)} />
          <Row label="Double Sharing" value={money(pg.double_sharing)} />
          <Row label="Triple Sharing" value={money(pg.triple_sharing)} />
        </Section>

        <Section title="5. Facilities & Amenities">
          <Row label="Food Available" value={yesNo(pg.food_available)} />
          <Row label="WiFi" value={yesNo(pg.wifi_available)} />
          <Row label="AC" value={yesNo(pg.ac_available)} />
          <Row label="Parking" value={yesNo(pg.parking_available)} />
          <Row label="Lift" value={yesNo(pg.lift_elevator)} />
          <Row label="Gym" value={yesNo(pg.gym)} />
        </Section>

        <Section title="6. Property Photos">
          {photos.length === 0 ? (
            <p className="text-gray-500">No photos uploaded</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((img, i) => (
                <img
                  key={i}
                  src={`${BASE_URL}${img}`}
                  alt={`PG ${i + 1}`}
                  className="rounded border object-cover h-40 w-full"
                />
              ))}
            </div>
          )}
        </Section>

        {pg.status === "pending" && (
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              onClick={() => setShowReject(true)}
              className="px-5 py-2 border border-red-500 text-red-600 rounded"
            >
              Reject
            </button>
            <button
              onClick={approve}
              className="px-5 py-2 bg-blue-600 text-white rounded"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <textarea
              className="w-full border p-2"
              rows="4"
              placeholder="Reason for rejection"
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowReject(false)}
                className="flex-1 border rounded py-2"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                className="flex-1 bg-red-600 text-white rounded py-2"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= UI HELPERS ================= */
const Section = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b pb-1">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value || "—"}</span>
  </div>
);

export default AdminPGDetails;
