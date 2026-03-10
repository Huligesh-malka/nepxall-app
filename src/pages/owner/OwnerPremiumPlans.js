import React, { useState, useEffect } from "react";
import api from "../api/api";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "₹0",
    listings: "1 PG",
    photos: "10 Photos",
    videos: "1 Video",
    featured: "No",
    boost: "No",
    analytics: "Basic",
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: "₹299 / month",
    listings: "3 PG",
    photos: "15 Photos",
    videos: "2 Videos",
    featured: "7 Days Featured",
    boost: "1 Boost",
    analytics: "Basic Analytics",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "₹999 / month",
    listings: "10 PG",
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
    listings: "Unlimited PG",
    photos: "25 Photos",
    videos: "5 Videos",
    featured: "Priority Featured",
    boost: "Unlimited Boost",
    analytics: "Full Dashboard",
  },
];

export default function OwnerPremiumPlans() {

  const [currentPlan, setCurrentPlan] = useState("free");

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
    try {
      const res = await api.post("/owner/buy-plan", { plan: planId });

      alert("Plan activated successfully");

      setCurrentPlan(planId);

    } catch (err) {
      alert("Payment failed");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 30 }}>

      <h1 style={{ textAlign: "center", marginBottom: 40 }}>
        🚀 Upgrade Your PG Listing
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
          gap: 25,
        }}
      >

        {plans.map((plan) => (

          <div
            key={plan.id}
            style={{
              border: plan.highlight ? "2px solid #007bff" : "1px solid #ddd",
              borderRadius: 12,
              padding: 25,
              background: plan.highlight ? "#f3f8ff" : "#fff",
              boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
            }}
          >

            <h2>{plan.name}</h2>

            <h1 style={{ margin: "10px 0" }}>{plan.price}</h1>

            <ul style={{ lineHeight: "28px", paddingLeft: 18 }}>
              <li>{plan.listings}</li>
              <li>{plan.photos}</li>
              <li>{plan.videos}</li>
              <li>{plan.featured}</li>
              <li>{plan.boost}</li>
              <li>{plan.analytics}</li>
            </ul>

            {currentPlan === plan.id ? (

              <button
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: 10,
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Current Plan
              </button>

            ) : (

              <button
                onClick={() => buyPlan(plan.id)}
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: 10,
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Upgrade Plan
              </button>

            )}

          </div>

        ))}
      </div>

    </div>
  );
}