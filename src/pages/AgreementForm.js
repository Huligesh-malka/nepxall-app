import React, { useState } from "react";

const AgreementForm = () => {

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    dob: "",
    mobile: "",
    email: "",
    occupation: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_number: "",
    aadhaar_last4: "",
    pan_number: "",
    checkin_date: "",
    agreement_months: "",
    rent: "",
    deposit: "",
    maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    pan_card: null,
    signature: null
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    Object.keys(files).forEach((key) => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });

    try {
      const res = await fetch(
        "https://your-backend-url/api/agreements-form/submit",
        {
          method: "POST",
          body: data
        }
      );

      const result = await res.json();

      alert(result.message || "Agreement form submitted");

    } catch (error) {
      console.error(error);
      alert("Submission failed");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto" }}>
      <h2>Rental Agreement Form</h2>

      <form onSubmit={handleSubmit}>

        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />

        <input name="father_name" placeholder="Father Name" onChange={handleChange} />

        <input type="date" name="dob" onChange={handleChange} />

        <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required />

        <input name="email" placeholder="Email" onChange={handleChange} />

        <input name="occupation" placeholder="Occupation" onChange={handleChange} />

        <input name="company_name" placeholder="Company / College" onChange={handleChange} />

        <textarea name="address" placeholder="Address" onChange={handleChange} />

        <input name="city" placeholder="City" onChange={handleChange} />

        <input name="state" placeholder="State" onChange={handleChange} />

        <input name="pincode" placeholder="Pincode" onChange={handleChange} />

        <h4>Aadhaar Details</h4>

        <input name="aadhaar_number" placeholder="Aadhaar Number" onChange={handleChange} />

        <input name="aadhaar_last4" placeholder="Last 4 Digits Aadhaar" onChange={handleChange} />

        <label>Aadhaar Front</label>
        <input type="file" name="aadhaar_front" onChange={handleFileChange} />

        <label>Aadhaar Back</label>
        <input type="file" name="aadhaar_back" onChange={handleFileChange} />

        <h4>PAN Details</h4>

        <input name="pan_number" placeholder="PAN Number" onChange={handleChange} />

        <input type="file" name="pan_card" onChange={handleFileChange} />

        <h4>Rental Details</h4>

        <input type="date" name="checkin_date" onChange={handleChange} />

        <input name="agreement_months" placeholder="Agreement Months" onChange={handleChange} />

        <input name="rent" placeholder="Rent" onChange={handleChange} />

        <input name="deposit" placeholder="Deposit" onChange={handleChange} />

        <input name="maintenance" placeholder="Maintenance" onChange={handleChange} />

        <h4>Signature</h4>

        <input type="file" name="signature" onChange={handleFileChange} />

        <br /><br />

        <button type="submit">Submit Agreement</button>

      </form>
    </div>
  );
};

export default AgreementForm;