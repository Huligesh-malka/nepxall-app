import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";

const AgreementForm = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams(); // Get booking ID from URL params

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

  const [previews, setPreviews] = useState({
    aadhaar_front: "",
    aadhaar_back: "",
    pan_card: "",
    signature: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;
    
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Please upload less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload only image files");
      return;
    }

    setFiles({
      ...files,
      [fieldName]: file
    });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews({
        ...previews,
        [fieldName]: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fieldName) => {
    setFiles({
      ...files,
      [fieldName]: null
    });
    setPreviews({
      ...previews,
      [fieldName]: ""
    });
  };

  const validateStep = (step) => {
    setError("");

    switch(step) {
      case 1: // Personal Details
        if (!formData.full_name) return "Full name is required";
        if (!formData.dob) return "Date of birth is required";
        if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) return "Valid 10-digit mobile number is required";
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Valid email is required";
        break;
      
      case 2: // Address Details
        if (!formData.address) return "Address is required";
        if (!formData.city) return "City is required";
        if (!formData.state) return "State is required";
        if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) return "Valid 6-digit pincode is required";
        break;
      
      case 3: // ID Proofs
        if (!formData.aadhaar_number || !/^\d{12}$/.test(formData.aadhaar_number)) return "Valid 12-digit Aadhaar number is required";
        if (!formData.aadhaar_last4 || !/^\d{4}$/.test(formData.aadhaar_last4)) return "Last 4 digits of Aadhaar are required";
        if (!formData.pan_number || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) return "Valid PAN number is required (e.g., ABCDE1234F)";
        if (!files.aadhaar_front) return "Aadhaar front image is required";
        if (!files.aadhaar_back) return "Aadhaar back image is required";
        if (!files.pan_card) return "PAN card image is required";
        break;
      
      case 4: // Rental Details
        if (!formData.checkin_date) return "Check-in date is required";
        if (!formData.agreement_months) return "Agreement duration is required";
        if (!formData.rent || formData.rent <= 0) return "Valid rent amount is required";
        if (!formData.deposit || formData.deposit <= 0) return "Valid deposit amount is required";
        if (!files.signature) return "Signature is required";
        break;
      
      default:
        return null;
    }
    return null;
  };

  const nextStep = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setCurrentStep(prev => prev + 1);
    setError("");
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const validationError = validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const data = new FormData();
    
    // Append form data
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // Append booking ID if available
    if (bookingId) {
      data.append("bookingId", bookingId);
    }

    // Append files
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

      if (!res.ok) {
        throw new Error(result.message || "Submission failed");
      }

      setSuccess(true);
      
      // Show success message and redirect
      setTimeout(() => {
        navigate("/user/bookings");
      }, 3000);

    } catch (error) {
      console.error(error);
      setError(error.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Agreement Submitted Successfully!</h2>
          <p style={styles.successMessage}>
            Your rental agreement has been submitted. The owner will review and 
            confirm your booking shortly. You will be redirected to your bookings page.
          </p>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.redirectText}>Redirecting in 3 seconds...</p>
          <button 
            style={styles.successButton}
            onClick={() => navigate("/user/bookings")}
          >
            Go to Bookings Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Rental Agreement Form</h1>
        <p style={styles.subtitle}>
          Please fill in your details to complete the rental agreement
        </p>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${(currentStep / 4) * 100}%`
            }}
          />
        </div>
        <div style={styles.steps}>
          {["Personal", "Address", "ID Proofs", "Rental"].map((step, index) => (
            <div 
              key={step}
              style={{
                ...styles.step,
                ...(index + 1 <= currentStep ? styles.stepCompleted : {}),
                ...(index + 1 === currentStep ? styles.stepActive : {})
              }}
            >
              <div style={styles.stepNumber}>{index + 1}</div>
              <span style={styles.stepLabel}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div style={styles.stepContent}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Father's Name</label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter father's name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Software Engineer, Student"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Company / College</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Where do you work/study?"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address Details */}
        {currentStep === 2 && (
          <div style={styles.stepContent}>
            <h3 style={styles.sectionTitle}>Address Details</h3>
            
            <div style={styles.formGrid}>
              <div style={styles.fullWidth}>
                <label style={styles.label}>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter your complete address"
                  rows="3"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="City"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="State"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="6-digit pincode"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: ID Proofs */}
        {currentStep === 3 && (
          <div style={styles.stepContent}>
            <h3 style={styles.sectionTitle}>Identity Proofs</h3>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Aadhaar Number *</label>
                <input
                  type="text"
                  name="aadhaar_number"
                  value={formData.aadhaar_number}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="12-digit Aadhaar number"
                  pattern="[0-9]{12}"
                  maxLength="12"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Last 4 Digits *</label>
                <input
                  type="text"
                  name="aadhaar_last4"
                  value={formData.aadhaar_last4}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Last 4 digits"
                  pattern="[0-9]{4}"
                  maxLength="4"
                  required
                />
              </div>

              <div style={styles.fileUploadGroup}>
                <label style={styles.label}>Aadhaar Front Image *</label>
                <div style={styles.fileUploadArea}>
                  <input
                    type="file"
                    name="aadhaar_front"
                    id="aadhaar_front"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                  />
                  {!files.aadhaar_front ? (
                    <label htmlFor="aadhaar_front" style={styles.fileUploadLabel}>
                      <span style={styles.uploadIcon}>📄</span>
                      <span>Click to upload Aadhaar Front</span>
                      <span style={styles.uploadHint}>PNG, JPG up to 5MB</span>
                    </label>
                  ) : (
                    <div style={styles.previewContainer}>
                      <img 
                        src={previews.aadhaar_front} 
                        alt="Aadhaar Front Preview" 
                        style={styles.previewImage}
                      />
                      <button 
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeFile("aadhaar_front")}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.fileUploadGroup}>
                <label style={styles.label}>Aadhaar Back Image *</label>
                <div style={styles.fileUploadArea}>
                  <input
                    type="file"
                    name="aadhaar_back"
                    id="aadhaar_back"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                  />
                  {!files.aadhaar_back ? (
                    <label htmlFor="aadhaar_back" style={styles.fileUploadLabel}>
                      <span style={styles.uploadIcon}>📄</span>
                      <span>Click to upload Aadhaar Back</span>
                      <span style={styles.uploadHint}>PNG, JPG up to 5MB</span>
                    </label>
                  ) : (
                    <div style={styles.previewContainer}>
                      <img 
                        src={previews.aadhaar_back} 
                        alt="Aadhaar Back Preview" 
                        style={styles.previewImage}
                      />
                      <button 
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeFile("aadhaar_back")}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>PAN Number *</label>
                <input
                  type="text"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., ABCDE1234F"
                  style={{...styles.input, textTransform: "uppercase"}}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                  required
                />
              </div>

              <div style={styles.fileUploadGroup}>
                <label style={styles.label}>PAN Card Image *</label>
                <div style={styles.fileUploadArea}>
                  <input
                    type="file"
                    name="pan_card"
                    id="pan_card"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                  />
                  {!files.pan_card ? (
                    <label htmlFor="pan_card" style={styles.fileUploadLabel}>
                      <span style={styles.uploadIcon}>📄</span>
                      <span>Click to upload PAN Card</span>
                      <span style={styles.uploadHint}>PNG, JPG up to 5MB</span>
                    </label>
                  ) : (
                    <div style={styles.previewContainer}>
                      <img 
                        src={previews.pan_card} 
                        alt="PAN Card Preview" 
                        style={styles.previewImage}
                      />
                      <button 
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeFile("pan_card")}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Rental Details */}
        {currentStep === 4 && (
          <div style={styles.stepContent}>
            <h3 style={styles.sectionTitle}>Rental Details</h3>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Check-in Date *</label>
                <input
                  type="date"
                  name="checkin_date"
                  value={formData.checkin_date}
                  onChange={handleChange}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Agreement Duration (Months) *</label>
                <input
                  type="number"
                  name="agreement_months"
                  value={formData.agreement_months}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 11"
                  min="1"
                  max="36"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="rent"
                  value={formData.rent}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Amount in ₹"
                  min="0"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Security Deposit (₹) *</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Amount in ₹"
                  min="0"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Maintenance (₹)</label>
                <input
                  type="number"
                  name="maintenance"
                  value={formData.maintenance}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Amount in ₹"
                  min="0"
                />
              </div>

              <div style={styles.fileUploadGroup}>
                <label style={styles.label}>Signature *</label>
                <div style={styles.fileUploadArea}>
                  <input
                    type="file"
                    name="signature"
                    id="signature"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                  />
                  {!files.signature ? (
                    <label htmlFor="signature" style={styles.fileUploadLabel}>
                      <span style={styles.uploadIcon}>✍️</span>
                      <span>Click to upload your signature</span>
                      <span style={styles.uploadHint}>PNG, JPG with transparent background preferred</span>
                    </label>
                  ) : (
                    <div style={styles.previewContainer}>
                      <img 
                        src={previews.signature} 
                        alt="Signature Preview" 
                        style={styles.signaturePreview}
                      />
                      <button 
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeFile("signature")}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.buttonGroup}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              style={styles.secondaryButton}
              disabled={isSubmitting}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              style={styles.primaryButton}
              disabled={isSubmitting}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span style={styles.buttonSpinner}></span>
                  Submitting...
                </>
              ) : (
                "Submit Agreement"
              )}
            </button>
          )}
        </div>
      </form>

      {/* Animation Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
    </div>
  );
};

// Modern Styles
const styles = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    animation: "slideIn 0.5s ease-out",
  },
  
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  
  title: {
    fontSize: "clamp(28px, 5vw, 36px)",
    fontWeight: 800,
    color: "#fff",
    marginBottom: 8,
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    letterSpacing: "-0.5px",
  },
  
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 400,
  },
  
  progressContainer: {
    marginBottom: 40,
    background: "rgba(255,255,255,0.1)",
    padding: "24px",
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  
  progressBar: {
    height: 4,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  
  steps: {
    display: "flex",
    justifyContent: "space-between",
  },
  
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    opacity: 0.7,
    transition: "all 0.3s ease",
  },
  
  stepActive: {
    opacity: 1,
    transform: "translateY(-2px)",
  },
  
  stepCompleted: {
    opacity: 1,
  },
  
  stepNumber: {
    width: 32,
    height: 32,
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.3s ease",
    ...(document.querySelector(`[data-completed="true"]`) && {
      background: "#10b981",
    }),
  },
  
  stepLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  form: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    padding: "32px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    animation: "slideIn 0.5s ease-out",
  },
  
  stepContent: {
    animation: "fadeIn 0.3s ease",
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: "2px solid #e5e7eb",
  },
  
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20,
    marginBottom: 24,
  },
  
  fullWidth: {
    gridColumn: "span 2",
  },
  
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  
  input: {
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none",
    ":focus": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102,126,234,0.1)",
    },
    ":hover": {
      borderColor: "#9ca3af",
    }
  },
  
  textarea: {
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: 100,
    ":focus": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102,126,234,0.1)",
    }
  },
  
  fileUploadGroup: {
    gridColumn: "span 2",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  
  fileUploadArea: {
    width: "100%",
  },
  
  hiddenInput: {
    display: "none",
  },
  
  fileUploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "24px",
    background: "#f9fafb",
    border: "2px dashed #e5e7eb",
    borderRadius: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      borderColor: "#667eea",
      background: "#f3f4f6",
    }
  },
  
  uploadIcon: {
    fontSize: 32,
  },
  
  uploadHint: {
    fontSize: 12,
    color: "#9ca3af",
  },
  
  previewContainer: {
    position: "relative",
    display: "inline-block",
    width: "100%",
  },
  
  previewImage: {
    width: "100%",
    maxHeight: 200,
    objectFit: "contain",
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    background: "#f9fafb",
  },
  
  signaturePreview: {
    width: "100%",
    maxHeight: 100,
    objectFit: "contain",
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    background: "#f9fafb",
    padding: "10px",
  },
  
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ":hover": {
      transform: "scale(1.1)",
      background: "#dc2626",
    }
  },
  
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 32,
  },
  
  primaryButton: {
    flex: 1,
    padding: "16px 24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 16,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  secondaryButton: {
    flex: 1,
    padding: "16px 24px",
    background: "#fff",
    border: "2px solid #e5e7eb",
    borderRadius: 16,
    color: "#4b5563",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      background: "#f9fafb",
      borderColor: "#9ca3af",
      transform: "translateY(-2px)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  submitButton: {
    flex: 1,
    padding: "16px 24px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: 16,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(16,185,129,0.3)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  buttonSpinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid #fff",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  
  errorAlert: {
    padding: "16px 20px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 16,
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#991b1b",
    fontSize: 14,
    fontWeight: 500,
  },
  
  errorIcon: {
    fontSize: 20,
  },
  
  successContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  
  successCard: {
    maxWidth: 500,
    background: "#fff",
    borderRadius: 32,
    padding: "48px 32px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    animation: "slideIn 0.5s ease",
  },
  
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
    animation: "pulse 2s infinite",
  },
  
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: 12,
  },
  
  successMessage: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  
  redirectText: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 20,
  },
  
  successButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 40,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    }
  },
  
  loadingSpinner: {
    width: 40,
    height: 40,
    border: "3px solid #f3f4f6",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px auto",
  },
};

AgreementForm.propTypes = {
  // Add any props if needed
};

export default AgreementForm;