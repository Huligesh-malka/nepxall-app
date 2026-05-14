import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  "https://nepxall-backend.onrender.com";

const NearbyPGMap = () => {
  const [pgs, setPgs] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation({ lat, lng });

        try {

          const res = await axios.get(
            `${API_BASE_URL}/api/pg/nearby?lat=${lat}&lng=${lng}&radius=5`
          );

          if (res.data.success) {
            setPgs(res.data.pgs || []);
          }

        } catch (err) {

          console.log(err);

          setError("Failed to load nearby PGs");

        } finally {

          setLoading(false);

        }

      },
      (err) => {

        console.log(err);

        setError("Location permission denied");
        setLoading(false);

      }
    );

  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Loading Nearby PGs...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.heading}>
        Nearby PGs
      </h1>

      {pgs.length === 0 ? (
        <div style={styles.center}>
          <h3>No Nearby PGs Found</h3>
        </div>
      ) : (
        <div style={styles.grid}>
          {pgs.map((pg) => {

            const image =
              pg.main_image ||
              pg.image ||
              pg.photos ||
              "https://via.placeholder.com/400x250?text=No+Image";

            return (
              <div
                key={pg.id}
                style={styles.card}
              >

                <img
                  src={image}
                  alt={pg.name}
                  style={styles.image}
                />

                <div style={styles.content}>

                  <h2 style={styles.name}>
                    {pg.name}
                  </h2>

                  <p style={styles.price}>
                    ₹ {pg.price || pg.rent}
                  </p>

                  <p style={styles.address}>
                    {pg.address}
                  </p>

                  {pg.distance && (
                    <p style={styles.distance}>
                      📍 {Number(pg.distance).toFixed(1)} KM Away
                    </p>
                  )}

                  <div style={styles.buttonContainer}>

                    <a
                      href={`https://wa.me/${pg.phone || "919999999999"}?text=Hi,%20I%20am%20interested%20in%20your%20PG`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <button style={styles.bookBtn}>
                        Book Now
                      </button>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <button style={styles.navBtn}>
                        Navigate
                      </button>
                    </a>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {

  container: {
    padding: 20,
    background: "#f5f7fb",
    minHeight: "100vh",
  },

  heading: {
    textAlign: "center",
    marginBottom: 30,
    color: "#0B5ED7",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    flexDirection: "column",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)",
  },

  image: {
    width: "100%",
    height: 220,
    objectFit: "cover",
  },

  content: {
    padding: 15,
  },

  name: {
    margin: 0,
    marginBottom: 10,
    color: "#222",
  },

  price: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 18,
  },

  address: {
    color: "#666",
    marginBottom: 10,
  },

  distance: {
    color: "#0B5ED7",
    fontWeight: "600",
  },

  buttonContainer: {
    display: "flex",
    gap: 10,
    marginTop: 15,
  },

  bookBtn: {
    background: "#25D366",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },

  navBtn: {
    background: "#0B5ED7",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },

};

export default NearbyPGMap;