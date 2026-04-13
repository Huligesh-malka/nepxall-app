import React, { useState, useEffect } from "react";
import api from "../api/api";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "₹0",
    bookings: "10 Bookings",
    contacts: "30 Owner Contacts",
    visits: "10 Visit Schedules",
    ads: "Ads Enabled",
    support: "Standard Support"
  },
  {
    id: "silver",
    name: "Silver Plan",
    price: "₹49 / month",
    bookings: "20 Bookings",
    contacts: "100 Owner Contacts",
    visits: "20 Visit Schedules",
    ads: "No Ads",
    support: "Priority Support"
  },
  {
    id: "gold",
    name: "Gold Plan",
    price: "₹99 / month",
    bookings: "50 Bookings",
    contacts: "Unlimited Contacts",
    visits: "50 Visit Schedules",
    ads: "No Ads",
    support: "Premium Support",
    highlight: true
  }
];

export default function UserPremiumPlans() {

  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
     const res = await userAPI.get("/user/plan");
      setCurrentPlan(res.data.plan || "free");
    } catch {
      setCurrentPlan("free");
    }
  };

  const upgradePlan = async (planId) => {

    if (planId === currentPlan) return;

    try {

      setLoading(true);

      await api.post("/user/buy-plan", { plan: planId });

      alert("✅ Plan activated successfully");

      setCurrentPlan(planId);

    } catch {

      alert("❌ Payment failed");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div style={container}>

      <h1 style={title}>💎 Nepxall Premium</h1>

      <p style={subtitle}>
        Upgrade to unlock more bookings and owner contacts
      </p>

      <div style={grid}>

        {plans.map((plan) => {

          const isCurrent = currentPlan === plan.id;

          return (

            <div
              key={plan.id}
              style={{
                ...card,
                border: plan.highlight
                  ? "2px solid #0B5ED7"
                  : "1px solid #ddd",
                background: plan.highlight ? "#f5f9ff" : "#fff"
              }}
            >

              {plan.highlight && (
                <div style={badge}>⭐ MOST POPULAR</div>
              )}

              <h2>{plan.name}</h2>

              <h1 style={{ margin: "10px 0" }}>{plan.price}</h1>

              <ul style={features}>
                <li>{plan.bookings}</li>
                <li>{plan.contacts}</li>
                <li>{plan.visits}</li>
                <li>{plan.ads}</li>
                <li>{plan.support}</li>
              </ul>

              {isCurrent ? (

                <button style={currentButton}>
                  Current Plan
                </button>

              ) : (

                <button
                  onClick={() => upgradePlan(plan.id)}
                  disabled={loading}
                  style={upgradeButton}
                >
                  {loading ? "Processing..." : "Upgrade"}
                </button>

              )}

            </div>

          );
        })}

      </div>

    </div>
  );
}

/* ---------- Styles ---------- */

const container = {
  maxWidth: 1100,
  margin: "auto",
  padding: 40
};

const title = {
  textAlign: "center"
};

const subtitle = {
  textAlign: "center",
  marginBottom: 40,
  color: "#64748b"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
  gap: 25
};

const card = {
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  position: "relative"
};

const badge = {
  position: "absolute",
  top: -10,
  right: 10,
  background: "#0B5ED7",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12
};

const features = {
  lineHeight: "28px",
  paddingLeft: 18,
  marginBottom: 20
};

const upgradeButton = {
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#0B5ED7",
  color: "#fff",
  cursor: "pointer"
};

const currentButton = {
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#16a34a",
  color: "#fff"
};