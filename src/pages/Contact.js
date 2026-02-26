import React from "react";

const Terms = () => {
  return (
    <div style={container}>
      <h1>Terms & Conditions</h1>

      <p>
        Nepxall is a smart PG & coliving booking platform that connects tenants
        with property owners.
      </p>

      <h3>User Responsibilities</h3>
      <ul>
        <li>Provide accurate personal details during booking.</li>
        <li>Respect PG rules and property guidelines.</li>
        <li>Complete payment using our secure payment gateway.</li>
      </ul>

      <h3>Booking & Payments</h3>
      <ul>
        <li>Booking is confirmed only after successful payment.</li>
        <li>All payments are processed securely via Cashfree.</li>
        <li>Prices are listed in INR (₹).</li>
      </ul>

      <h3>Platform Rights</h3>
      <p>
        Nepxall reserves the right to suspend accounts in case of misuse or
        fraudulent activity.
      </p>
    </div>
  );
};

export default Terms;

const container = {
  maxWidth: 900,
  margin: "auto",
  padding: 20,
  lineHeight: 1.7,
};