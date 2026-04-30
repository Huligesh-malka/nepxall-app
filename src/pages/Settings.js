import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Settings() {
  const [user, setUser] = useState({
    name: "",
    phone: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSettings();
  }, []);

  // GET USER SETTINGS
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://nepxall-backend.onrender.com/api/settings",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUser({
        name: res.data.user.name || "",
        phone: res.data.user.phone || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE SETTINGS
  const updateSettings = async () => {
    setSaving(true);
    try {
      await axios.put(
        "https://nepxall-backend.onrender.com/api/settings",
        {
          name: user.name,
          phone: user.phone
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Settings Updated Successfully!");
    } catch (err) {
      console.error(err);
      alert("Update Failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Account Settings</h2>
          <p style={styles.subtitle}>Update your personal information</p>
        </div>

        <div style={styles.form}>
          {/* NAME FIELD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Full Name
              <span style={styles.optional}>(Optional)</span>
            </label>
            <input
              type="text"
              value={user.name}
              autoComplete="off"
              placeholder="Enter your full name"
              onChange={(e) =>
                setUser({ ...user, name: e.target.value })
              }
              style={styles.input}
            />
          </div>

          {/* PHONE FIELD */}
          <div style={styles.field}>
            <label style={styles.label}>
              Phone Number
              <span style={styles.required}>*</span>
            </label>
            <input
              type="tel"
              value={user.phone}
              autoComplete="off"
              placeholder="+977 9800000000"
              onChange={(e) =>
                setUser({ ...user, phone: e.target.value })
              }
              style={styles.input}
            />
            <p style={styles.hint}>
              This number will be used for account communication
            </p>
          </div>

          <button
            onClick={updateSettings}
            disabled={saving}
            style={{
              ...styles.button,
              ...(saving ? styles.buttonDisabled : {})
            }}
          >
            {saving ? (
              <>
                <span style={styles.buttonSpinner}></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 20px 35px -12px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  header: {
    padding: "32px 32px 0 32px",
    borderBottom: "1px solid #f0f0f0"
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.3px"
  },
  subtitle: {
    margin: "8px 0 24px 0",
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "400"
  },
  form: {
    padding: "32px"
  },
  field: {
    marginBottom: "28px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
    letterSpacing: "-0.2px"
  },
  optional: {
    fontSize: "12px",
    fontWeight: "400",
    color: "#9ca3af",
    marginLeft: "8px"
  },
  required: {
    color: "#ef4444",
    marginLeft: "4px",
    fontSize: "12px"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    backgroundColor: "#fafafa",
    boxSizing: "border-box"
  },
  inputFocus: {
    borderColor: "#4f46e5",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)"
  },
  hint: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "8px",
    marginBottom: 0
  },
  button: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(105deg, #4f46e5 0%, #7c3aed 100%)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
    transform: "scale(0.98)"
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#4b5563"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "16px"
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    display: "inline-block"
  }
};

// Add this to your global CSS or component
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);