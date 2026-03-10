import React, { useState, useEffect } from "react";
import api from "../../api/api";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "₹0",
    listings: "1 PG Listing",
    photos: "10 Photos",
    videos: "1 Video",
    featured: "No Featured",
    boost: "No Boost",
    analytics: "Basic Analytics"
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: "₹299 / month",
    listings: "3 PG Listings",
    photos: "15 Photos",
    videos: "2 Videos",
    featured: "7 Days Featured",
    boost: "1 Boost",
    analytics: "Basic Analytics"
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "₹999 / month",
    listings: "10 PG Listings",
    photos: "20 Photos",
    videos: "3 Videos",
    featured: "30 Days Featured",
    boost: "5 Boosts",
    analytics: "Advanced Analytics",
    highlight: true
  },
  {
    id: "business",
    name: "Business Plan",
    price: "₹2999 / month",
    listings: "Unlimited PG Listings",
    photos: "25 Photos",
    videos: "5 Videos",
    featured: "Priority Featured",
    boost: "Unlimited Boost",
    analytics: "Full Dashboard"
  }
];

export default function OwnerPremiumPlans() {

  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const res = await api.get("/owner/current-plan");
      setCurrentPlan(res.data.plan || "free");
    } catch {
      setCurrentPlan("free");
    }
  };

  const buyPlan = async (planId) => {

    if (planId === currentPlan) return;

    try {

      setLoading(true);

      await api.post("/owner/buy-plan", { plan: planId });

      alert("✅ Plan activated successfully");

      setCurrentPlan(planId);

    } catch (err) {

      alert("❌ Payment failed");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div style={container}>

      <h1 style={title}>
        🚀 Upgrade Your PG Listing
      </h1>

      <p style={subtitle}>
        Choose the best plan to grow your PG business
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
                background: plan.highlight ? "#f3f8ff" : "#fff"
              }}
            >

              {plan.highlight && (
                <div style={badge}>⭐ MOST POPULAR</div>
              )}

              <h2 style={planName}>{plan.name}</h2>

              <h1 style={price}>{plan.price}</h1>

              <ul style={features}>
                <li>{plan.listings}</li>
                <li>{plan.photos}</li>
                <li>{plan.videos}</li>
                <li>{plan.featured}</li>
                <li>{plan.boost}</li>
                <li>{plan.analytics}</li>
              </ul>

              {isCurrent ? (

                <button style={currentButton}>
                  Current Plan
                </button>

              ) : (

                <button
                  disabled={loading}
                  onClick={() => buyPlan(plan.id)}
                  style={upgradeButton}
                >
                  {loading ? "Processing..." : "Upgrade Plan"}
                </button>

              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const container = {
  maxWidth: 1200,
  margin: "auto",
  padding: 40
};

const title = {
  textAlign: "center",
  marginBottom: 10
};

const subtitle = {
  textAlign: "center",
  color: "#64748b",
  marginBottom: 40
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
  gap: 25
};

const card = {
  borderRadius: 12,
  padding: 25,
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  position: "relative"
};

const badge = {
  position: "absolute",
  top: -10,
  right: 15,
  background: "#0B5ED7",
  color: "#fff",
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 20
};

const planName = {
  marginBottom: 5
};

const price = {
  marginBottom: 15
};

const features = {
  lineHeight: "28px",
  paddingLeft: 18,
  marginBottom: 20
};

const upgradeButton = {
  width: "100%",
  padding: 12,
  background: "#0B5ED7",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const currentButton = {
  width: "100%",
  padding: 12,
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8
};