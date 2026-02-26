import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = params.get("order_id");

        if (!orderId) {
          alert("Invalid payment");
          return navigate("/user/bookings");
        }

        const res = await api.get(`/payments/verify-payment/${orderId}`);

        if (res.data.data.order_status === "PAID") {
          alert("✅ Payment successful");
        } else {
          alert("❌ Payment not completed");
        }

      } catch (err) {
        console.error(err);
        alert("Payment verification failed");
      }

      navigate("/user/bookings");
    };

    verifyPayment();
  }, []);

  return <h2 style={{ padding: 40 }}>Processing payment...</h2>;
}