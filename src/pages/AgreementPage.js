import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";

const FILES = "http://localhost:5000";

export default function AgreementPage() {
  const { bookingId } = useParams();

  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [moveInDate, setMoveInDate] = useState("");
  const [duration, setDuration] = useState("");

  /* ================= LOAD AGREEMENT ================= */
  const loadAgreement = useCallback(async () => {
    if (!bookingId) return;

    try {
      setLoading(true);

      const res = await api.get(`/agreement/booking/${bookingId}`);

      const data = res.data.data;
      setAgreement(data || null);

      if (data?.move_in_date) {
        setMoveInDate(data.move_in_date.split("T")[0]);
      }

      if (data?.agreement_duration_months) {
        setDuration(data.agreement_duration_months);
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load agreement");
      setAgreement(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) loadAgreement();
      else setLoading(false);
    });

    return unsub;
  }, [loadAgreement]);

  /* ================= ACTIONS ================= */

  const requestAgreement = async () => {
    try {
      await api.post(`/agreement/request/${bookingId}`);
      alert("Agreement requested successfully");
      loadAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const generateDraft = async () => {
    if (!moveInDate || !duration) {
      return alert("Enter move-in date & duration");
    }

    try {
      await api.post(`/agreement/generate/${bookingId}`, {
        move_in_date: moveInDate,
        duration_months: duration,
      });

      alert("Draft generated successfully");
      loadAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  /* ================= STATES ================= */

  if (loading) return <div className="p-6">Loading agreement...</div>;

  if (error)
    return (
      <div className="p-6 text-red-600 text-center">{error}</div>
    );

  /* ================= NO AGREEMENT ================= */

  if (!agreement) {
    return (
      <div className="bg-white p-8 rounded shadow max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Rent Agreement</h2>
        <p className="text-gray-600 mb-6">
          No agreement created for this booking.
        </p>

        <button
          onClick={requestAgreement}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Request Rent Agreement
        </button>
      </div>
    );
  }

  /* ================= REQUESTED ================= */

  if (agreement.status === "requested") {
    return (
      <div className="bg-white p-8 rounded shadow max-w-xl">
        <h2 className="text-xl font-semibold mb-6">
          Generate Agreement Draft
        </h2>

        <label className="block mb-2">Move-in Date</label>
        <input
          type="date"
          className="border px-3 py-2 rounded w-full mb-4"
          value={moveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
        />

        <label className="block mb-2">
          Agreement Duration (months)
        </label>
        <input
          type="number"
          className="border px-3 py-2 rounded w-full mb-6"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button
          onClick={generateDraft}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          Generate Draft Agreement
        </button>
      </div>
    );
  }

  /* ================= DRAFT ================= */

  if (agreement.status === "draft") {
    return (
      <div className="bg-white p-8 rounded shadow max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">
          Agreement Draft
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <p><b>Rent:</b> ₹{agreement.rent_amount}</p>
          <p><b>Deposit:</b> ₹{agreement.security_deposit}</p>
          <p><b>Move-in:</b> {agreement.move_in_date}</p>
          <p>
            <b>Duration:</b>{" "}
            {agreement.agreement_duration_months} months
          </p>
        </div>

        {agreement.agreement_file && (
          <iframe
            src={`${FILES}${agreement.agreement_file}`}
            className="w-full h-[600px] border mb-6"
            title="Agreement PDF"
          />
        )}

        <button className="bg-blue-600 text-white px-6 py-2 rounded">
          Proceed to Payment
        </button>
      </div>
    );
  }

  /* ================= COMPLETED ================= */

  if (agreement.status === "completed") {
    return (
      <div className="bg-white p-8 rounded shadow max-w-xl text-center">
        <h2 className="text-xl font-semibold text-green-600 mb-3">
          Agreement Completed
        </h2>

        <a
          href={`${FILES}${agreement.agreement_file}`}
          target="_blank"
          rel="noreferrer"
          className="bg-green-600 text-white px-6 py-2 rounded inline-block"
        >
          Download Agreement
        </a>
      </div>
    );
  }

  return null;
}
