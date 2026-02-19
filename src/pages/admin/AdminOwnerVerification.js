import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";

const API = "http://localhost:5000/api/admin";
const FILES = "http://localhost:5000";

export default function AdminOwnerVerification() {
  const [list, setList] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await axios.get(`${API}/owner-verifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setList(res.data.data);
  };

  const approve = async (id) => {
    const token = await auth.currentUser.getIdToken();
    await axios.patch(
      `${API}/owner-verifications/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    load();
  };

  const reject = async (id) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;

    const token = await auth.currentUser.getIdToken();
    await axios.patch(
      `${API}/owner-verifications/${id}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    load();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Owner Verification Requests</h2>

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
          {list.map(v => (
            <tr key={v.id} className="border-t text-center">
              <td>{v.name}</td>

              <td>
                <a href={`${FILES}${v.id_proof_file}`} target="_blank">View</a>
              </td>

              <td>
                <a href={`${FILES}${v.property_proof_file}`} target="_blank">View</a>
              </td>

              <td>
                <a href={`${FILES}${v.digital_signature_file}`} target="_blank">View</a>
              </td>

              <td>{v.status}</td>

              <td>
                {v.status === "pending" && (
                  <>
                    <button
                      onClick={() => approve(v.id)}
                      className="mr-2 text-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(v.id)}
                      className="text-red-600"
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
    </div>
  );
}
