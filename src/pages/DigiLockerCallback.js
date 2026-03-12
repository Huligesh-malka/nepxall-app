import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function DigiLockerCallback() {

  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {

    const fetchData = async () => {

      try {

        const params = new URLSearchParams(window.location.search);

        const client_id = params.get("client_id");

        if (!client_id) {
          setStatus("Verification failed");
          return;
        }

        const res = await axios.post(
          `${API}/api/digilocker/fetch`,
          { client_id },
          { withCredentials: true }
        );

        if (res.data.success) {
          setStatus("Verification successful");
        } else {
          setStatus("Verification failed");
        }

      } catch (err) {

        console.error(err);
        setStatus("Verification error");

      }

    };

    fetchData();

  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>{status}</h2>
    </div>
  );
}