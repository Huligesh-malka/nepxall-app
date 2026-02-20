import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { auth } from "../../firebase";

const API = "http://localhost:5000/api/admin";
const FILES = "http://localhost:5000";

export default function AdminOwnerVerification() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Get Firebase token safely
  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
  };

  // 🔹 Load data
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get(`${API}/owner-verifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setList(res.data.data || []);
    } catch (err) {
      console.error("Load error:", err);
      alert("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 🔹 Approve
  const approve = async (id) => {
    try {
      const token = await getToken();

      await axios.patch(
        `${API}/owner-verifications/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      load();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Approval failed");
    }
  };

  // 🔹 Reject
  const reject = async (id) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;

    try {
      const token = await getToken();

      await axios.patch(
        `${API}/owner-verifications/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      load();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Rejection failed");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Owner Verification Requests
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : list.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>Name</th>
              <th>ID Proof</th>
              <th>Property</th>
              <th>Signature</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t text-center">
                <td>{v.name}</td>

                <td>
                  <a
                    href={`${FILES}${v.id_proof_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </td>

                <td>
                  <a
                    href={`${FILES}${v.property_proof_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </td>

                <td>
                  <a
                    href={`${FILES}${v.digital_signature_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </td>

                <td className="capitalize">{v.status}</td>

                <td>
                  {v.status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(v.id)}
                        className="mr-2 text-green-600 font-semibold"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => reject(v.id)}
                        className="text-red-600 font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}