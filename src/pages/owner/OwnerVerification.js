import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../../firebase";

const API = "http://localhost:5000/api/owner";

export default function OwnerVerification() {
  const [idType, setIdType] = useState("aadhaar");
  const [files, setFiles] = useState({});
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("loading"); // not_started | pending | verified | rejected
  const [rejectionReason, setRejectionReason] = useState("");

  const sigRef = useRef();

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API}/verification/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStatus(res.data.status);
        setRejectionReason(res.data.rejection_reason || "");
      } catch {
        setStatus("not_started");
      }
    };

    loadStatus();
  }, []);

  /* ================= UPLOAD ================= */
  const uploadDocs = async () => {
    if (!agree) {
      alert("Please accept the agreement consent to continue.");
      return;
    }

    if (!files.id || !files.property || sigRef.current.isEmpty()) {
      alert("All documents and digital signature are required.");
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      const form = new FormData();
      form.append("id_proof_type", idType);
      form.append("id_proof", files.id);
      form.append("property_proof", files.property);
      form.append("auto_agreement_consent", agree);

      const signatureBlob = await fetch(
        sigRef.current.toDataURL()
      ).then(res => res.blob());

      form.append("digital_signature", signatureBlob, "signature.png");

      await axios.post(`${API}/verification`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatus("pending");
      alert("✅ Documents submitted for verification");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATUS UI ================= */
  if (status === "loading") {
    return <div className="p-6">Loading verification status...</div>;
  }

  if (status === "pending") {
    return (
      <div className="bg-white p-8 rounded-xl shadow max-w-3xl text-center">
        <h2 className="text-2xl font-semibold mb-3">⏳ Verification Pending</h2>
        <p className="text-gray-600">
          Your documents are under admin review.
        </p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="bg-white p-8 rounded-xl shadow max-w-3xl text-center">
        <h2 className="text-2xl font-semibold text-green-600 mb-3">
          ✅ Verification Approved
        </h2>
        <p className="text-gray-600">
          Your documents and digital signature are verified.
        </p>

        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-700">
          🔒 These documents are locked and will be reused automatically for
          all future rent agreements.
        </div>
      </div>
    );
  }

  /* ================= FORM (not_started / rejected) ================= */
  return (
    <div className="bg-white p-8 rounded-xl shadow max-w-3xl">
      <h2 className="text-2xl font-semibold mb-8">Owner Verification</h2>

      {status === "rejected" && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-600 font-medium">❌ Verification Rejected</p>
          {rejectionReason && (
            <p className="text-sm text-red-500 mt-1">
              Reason: {rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* STEP 1 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm">
            1
          </span>
          <h3 className="font-medium">ID Proof</h3>
        </div>

        <select
          className="w-full border rounded-lg px-4 py-2 mb-3"
          value={idType}
          onChange={e => setIdType(e.target.value)}
        >
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
        </select>

        <input
          type="file"
          className="w-full border rounded-lg px-4 py-2"
          onChange={e =>
            setFiles(f => ({ ...f, id: e.target.files[0] }))
          }
        />
      </div>

      {/* STEP 2 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm">
            2
          </span>
          <h3 className="font-medium">Property Document</h3>
        </div>

        <input
          type="file"
          className="w-full border rounded-lg px-4 py-2"
          onChange={e =>
            setFiles(f => ({ ...f, property: e.target.files[0] }))
          }
        />
      </div>

      {/* STEP 3 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm">
            3
          </span>
          <h3 className="font-medium">Digital Signature</h3>
        </div>

        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 400,
            height: 160,
            className: "border rounded-lg w-full",
          }}
        />

        <button
          type="button"
          className="mt-2 text-sm text-red-600"
          onClick={() => sigRef.current.clear()}
        >
          Clear Signature
        </button>
      </div>

      {/* CONSENT */}
      <div className="mb-8 bg-gray-50 border rounded-lg p-4">
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={e => setAgree(e.target.checked)}
            className="mt-1"
          />
          <span className="text-gray-700 leading-relaxed">
            I confirm that this digital signature will be used to
            automatically generate and digitally sign the rent
            agreement with tenants on my behalf.
          </span>
        </label>
      </div>

      <button
        onClick={uploadDocs}
        disabled={loading || !agree}
        className={`w-full py-3 rounded-lg text-white transition ${
          agree
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Uploading..." : "Submit Documents"}
      </button>
    </div>
  );
}
