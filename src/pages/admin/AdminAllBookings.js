import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminAllBookings() {

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {

      const res = await api.get(
        "/admin/all-bookings"
      );

      setBookings(res.data.data || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>
        All PG Bookings
      </h2>

      <div style={styles.grid}>

        {bookings.map((b) => (

          <div
            key={b.id}
            style={styles.card}
          >

            <div style={styles.row}>
              <strong>Booking ID:</strong>
              <span>#{b.id}</span>
            </div>

            <div style={styles.row}>
              <strong>Status:</strong>
              <span>{b.status}</span>
            </div>

            <div style={styles.row}>
              <strong>Payment:</strong>
              <span>{b.payment_status || "pending"}</span>
            </div>

            <hr />

            <div style={styles.section}>
              USER DETAILS
            </div>

            <div style={styles.row}>
              <strong>Name:</strong>
              <span>{b.user_name}</span>
            </div>

            <div style={styles.row}>
              <strong>Phone:</strong>
              <span>{b.user_phone}</span>
            </div>

            <div style={styles.row}>
              <strong>Email:</strong>
              <span>{b.user_email}</span>
            </div>

            <hr />

            <div style={styles.section}>
              OWNER DETAILS
            </div>

            <div style={styles.row}>
              <strong>Name:</strong>
              <span>{b.owner_name}</span>
            </div>

            <div style={styles.row}>
              <strong>Phone:</strong>
              <span>{b.owner_phone}</span>
            </div>

            <div style={styles.row}>
              <strong>Email:</strong>
              <span>{b.owner_email}</span>
            </div>

            <hr />

            <div style={styles.section}>
              PG DETAILS
            </div>

            <div style={styles.row}>
              <strong>PG:</strong>
              <span>{b.pg_name}</span>
            </div>

            <div style={styles.row}>
              <strong>City:</strong>
              <span>{b.city}</span>
            </div>

            <div style={styles.row}>
              <strong>Area:</strong>
              <span>{b.area}</span>
            </div>

            <div style={styles.row}>
              <strong>PG Phone:</strong>
              <span>{b.contact_phone}</span>
            </div>

            <hr />

            <div style={styles.section}>
              BOOKING DETAILS
            </div>

            <div style={styles.row}>
              <strong>Room:</strong>
              <span>{b.room_type}</span>
            </div>

            <div style={styles.row}>
              <strong>Check In:</strong>
              <span>
                {new Date(
                  b.check_in_date
                ).toLocaleDateString()}
              </span>
            </div>

            <div style={styles.row}>
              <strong>Rent:</strong>
              <span>₹{b.rent_amount}</span>
            </div>

            <div style={styles.row}>
              <strong>Deposit:</strong>
              <span>
                ₹{b.security_deposit}
              </span>
            </div>

            <div style={styles.row}>
              <strong>Maintenance:</strong>
              <span>
                ₹{b.maintenance_amount}
              </span>
            </div>

            <div style={styles.row}>
              <strong>Paid:</strong>
              <span>
                ₹{b.paid_amount || 0}
              </span>
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

const styles = {

  container: {
    padding: 20,
    background: "#f5f5f5",
    minHeight: "100vh"
  },

  title: {
    marginBottom: 20
  },

  loading: {
    padding: 40,
    textAlign: "center"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(350px,1fr))",
    gap: 20
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)"
  },

  section: {
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10
  }

};