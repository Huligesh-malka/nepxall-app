import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const CLOUDINARY_URL =
"https://api.cloudinary.com/v1_1/dgr4iqtng/image/upload";

const CLOUDINARY_UPLOAD_PRESET = "nepxall_unsigned";

const AgreementForm = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading,setLoading] = useState(false);

  const [formData,setFormData] = useState({
    full_name:"",
    mobile:"",
    email:"",
    pan_number:""
  });

  const [files,setFiles] = useState({
    aadhaar_front:null,
    pan_card:null,
    signature:null
  });

  const handleChange = (e)=>{
    setFormData({...formData,[e.target.name]:e.target.value});
  };

  const handleFileChange = (e)=>{
    setFiles({...files,[e.target.name]:e.target.files[0]});
  };

  const uploadToCloudinary = async(file)=>{

    if(!file) return null;

    const data = new FormData();
    data.append("file",file);
    data.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL,{
      method:"POST",
      body:data
    });

    const result = await response.json();

    if(!response.ok){
      console.error(result);
      throw new Error(result.error.message);
    }

    return result.secure_url;
  };

  const handleSubmit = async(e)=>{

    e.preventDefault();
    setLoading(true);

    try{

      /* Upload images in parallel */

      const [aadhaar_url,pan_url,sign_url] = await Promise.all([
        uploadToCloudinary(files.aadhaar_front),
        uploadToCloudinary(files.pan_card),
        uploadToCloudinary(files.signature)
      ]);

      /* Send only URLs to backend */

      await api.post("/agreements-form/submit",{

        booking_id:id,
        ...formData,

        aadhaar_front:aadhaar_url,
        pan_card:pan_url,
        signature:sign_url

      });

      alert("Agreement submitted successfully");

      navigate("/");

    }catch(err){

      console.error("Upload Error:",err);
      alert("Upload failed");

    }

    setLoading(false);
  };

  return(

    <form onSubmit={handleSubmit}>

      <input
        name="full_name"
        placeholder="Full Name"
        onChange={handleChange}
        required
      />

      <input
        name="mobile"
        placeholder="Mobile"
        onChange={handleChange}
        required
      />

      <input
        name="pan_number"
        placeholder="PAN Number"
        onChange={handleChange}
      />

      <input
        type="file"
        name="aadhaar_front"
        onChange={handleFileChange}
      />

      <input
        type="file"
        name="pan_card"
        onChange={handleFileChange}
      />

      <input
        type="file"
        name="signature"
        onChange={handleFileChange}
      />

      <button type="submit">
        {loading ? "Uploading..." : "Submit Agreement"}
      </button>

    </form>

  );
};

export default AgreementForm;