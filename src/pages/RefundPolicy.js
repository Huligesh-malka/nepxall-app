import React from "react";

const RefundPolicy = () => {
  return (
    <div style={container}>
      <h1>Refund & Cancellation Policy</h1>

      <h3>Tenant Cancellation</h3>
      <p>
        Once a booking is confirmed, the advance payment is non-refundable.
      </p>

      <h3>Owner Rejection</h3>
      <p>
        If the PG owner rejects your booking, the full amount will be refunded
        within 5–7 working days to the original payment method.
      </p>

      <h3>Duplicate Payment</h3>
      <p>
        Any extra amount paid due to technical error will be refunded
        automatically.
      </p>

      <h3>Refund Processing Time</h3>
      <p>
        Refunds are processed within 5–7 business days.
      </p>
    </div>
  );
};

export default RefundPolicy;

const container = {
  maxWidth: 900,
  margin: "auto",
  padding: 20,
  lineHeight: 1.7,
};