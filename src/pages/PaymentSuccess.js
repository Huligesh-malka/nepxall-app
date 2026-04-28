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

        console.log("ORDER ID:", orderId);

        if (!orderId) {

          alert("Invalid payment");

          return navigate("/user/bookings");

        }

        // VERIFY PAYMENT
        const res = await api.get(
          `/payments/verify/${orderId}`
        );

        console.log("VERIFY RESPONSE:", res.data);

        if (res.data.success && res.data.isPaid) {

          alert("✅ Payment successful");

        } else {

          alert("❌ Payment not completed");

        }

      } catch (err) {

        console.error("VERIFY ERROR:", err);

        alert("❌ Payment verification failed");

      }

      navigate("/user/bookings");

    };

    verifyPayment();

  }, [params, navigate]);

  return (
    <h2 style={{ padding: 40 }}>
      Processing payment...
    </h2>
  );

}