import React, { useState } from "react";
import axios from "axios";

const AdminInstagramAI = () => {

  const [businessType, setBusinessType] = useState("");
  const [offer, setOffer] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");

  const generatePost = async () => {
    try {

      const res = await axios.post(
        "https://nepxall-backend.onrender.com/api/social/generate-post",
        {
          businessType,
          offer
        }
      );

      setGeneratedPost(res.data.caption);

    } catch (err) {
      console.error(err);
      alert("Failed to generate post");
    }
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>Instagram AI Marketing</h1>

      <input
        type="text"
        placeholder="Business Type"
        value={businessType}
        onChange={(e) => setBusinessType(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10
        }}
      />

      <input
        type="text"
        placeholder="Offer"
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10
        }}
      />

      <button
        onClick={generatePost}
        style={{
          padding: 12,
          background: "#0B5ED7",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Generate AI Post
      </button>

      {generatedPost && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            border: "1px solid #ddd",
            borderRadius: 10
          }}
        >
          <h3>Generated Caption</h3>

          <p>{generatedPost}</p>
        </div>
      )}

    </div>
  );
};

export default AdminInstagramAI;