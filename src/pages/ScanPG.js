import React from "react";
import { useParams } from "react-router-dom";

const ScanPG = () => {

  const { id } = useParams();

  return (
    <div style={{ padding: 40 }}>
      <h1>QR Scan Page</h1>
      <p>Property ID: {id}</p>
    </div>
  );

};

export default ScanPG;