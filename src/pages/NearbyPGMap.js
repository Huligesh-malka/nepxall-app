import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript
} from "@react-google-maps/api";

const API_BASE_URL =
  "https://nepxall-backend.onrender.com";

const mapContainerStyle = {
  width: "100%",
  height: "350px",
  borderRadius: "15px",
  marginBottom: "20px",
};

const NearbyPGMap = () => {

  const [pgs, setPgs] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPG, setSelectedPG] =
    useState(null);

  /*
  --------------------------------------------------
  GOOGLE MAP LOAD
  --------------------------------------------------
  */
  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  /*
  --------------------------------------------------
  GET LOCATION + PGS
  --------------------------------------------------
  */
  useEffect(() => {

    if (!navigator.geolocation) {

      setError(
        "Geolocation not supported"
      );

      setLoading(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setLocation({ lat, lng });

        try {

          const res =
            await axios.get(
              `${API_BASE_URL}/api/pg/nearby?lat=${lat}&lng=${lng}&radius=5`
            );

          if (res.data.success) {

            setPgs(
              res.data.pgs || []
            );

          }

        } catch (err) {

          console.log(err);

          setError(
            "Failed to load nearby PGs"
          );

        } finally {

          setLoading(false);

        }

      },

      (err) => {

        console.log(err);

        setError(
          "Location permission denied"
        );

        setLoading(false);

      }

    );

  }, []);

  /*
  --------------------------------------------------
  LOADING
  --------------------------------------------------
  */
  if (loading || !isLoaded) {

    return (
      <div style={styles.center}>
        <h2>Loading Nearby PGs...</h2>
      </div>
    );

  }

  /*
  --------------------------------------------------
  ERROR
  --------------------------------------------------
  */
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

      {/* -------------------------------- */}
      {/* GOOGLE MAP */}
      {/* -------------------------------- */}

      {location && (

        <GoogleMap
          zoom={13}
          center={location}
          mapContainerStyle={
            mapContainerStyle
          }
        >

          {/* USER LOCATION */}
          <Marker
            position={location}
          />

          {/* PG MARKERS */}
          {pgs.map((pg) => (

            <Marker
              key={pg.id}
              position={{
                lat: Number(
                  pg.latitude
                ),
                lng: Number(
                  pg.longitude
                ),
              }}
              onClick={() =>
                setSelectedPG(pg)
              }
            />

          ))}

          {/* INFO WINDOW */}
          {selectedPG && (

            <InfoWindow
              position={{
                lat: Number(
                  selectedPG.latitude
                ),
                lng: Number(
                  selectedPG.longitude
                ),
              }}
              onCloseClick={() =>
                setSelectedPG(null)
              }
            >

              <div
                style={{
                  maxWidth: 220,
                }}
              >

                <h3>
                  {selectedPG.name}
                </h3>

                <p>
                  {selectedPG.address}
                </p>

                <p>
                  ₹{" "}
                  {selectedPG.price ||
                    selectedPG.rent ||
                    "N/A"}
                </p>

              </div>

            </InfoWindow>

          )}

        </GoogleMap>

      )}

      {/* -------------------------------- */}
      {/* PG LIST */}
      {/* -------------------------------- */}

      {pgs.length === 0 ? (

        <div style={styles.center}>
          <h3>
            No Nearby PGs Found
          </h3>
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

                {/* IMAGE */}
                <img
                  src={image}
                  alt={pg.name}
                  style={styles.image}
                />

                <div style={styles.content}>

                  {/* SOURCE */}
                  <div
                    style={{
                      marginBottom: 10,
                    }}
                  >

                    {pg.source ===
                    "website" ? (

                      <span
                        style={
                          styles.websiteBadge
                        }
                      >
                        Verified by Nepxall
                      </span>

                    ) : (

                      <span
                        style={
                          styles.googleBadge
                        }
                      >
                        Google Nearby
                      </span>

                    )}

                  </div>

                  {/* NAME */}
                  <h2 style={styles.name}>
                    {pg.name}
                  </h2>

                  {/* PRICE */}
                  <p style={styles.price}>
                    ₹{" "}
                    {pg.price ||
                      pg.rent ||
                      "Contact"}
                  </p>

                  {/* ADDRESS */}
                  <p style={styles.address}>
                    {pg.address}
                  </p>

                  {/* DISTANCE */}
                  {pg.distance && (

                    <p
                      style={
                        styles.distance
                      }
                    >
                      📍{" "}
                      {Number(
                        pg.distance
                      ).toFixed(1)}{" "}
                      KM Away
                    </p>

                  )}

                  {/* RATING */}
                  {pg.rating && (

                    <p>
                      ⭐ {pg.rating}
                    </p>

                  )}

                  {/* BUTTONS */}
                  <div
                    style={
                      styles.buttonContainer
                    }
                  >

                    {/* WEBSITE PG */}
                    {pg.source ===
                    "website" ? (

                      <a
                        href={`https://wa.me/${pg.phone || "919999999999"}?text=Hi,%20I%20am%20interested%20in%20your%20PG`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration:
                            "none",
                        }}
                      >
                        <button
                          style={
                            styles.bookBtn
                          }
                        >
                          Book Now
                        </button>
                      </a>

                    ) : (

                      <a
                        href={
                          pg.maps_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration:
                            "none",
                        }}
                      >
                        <button
                          style={
                            styles.bookBtn
                          }
                        >
                          View Place
                        </button>
                      </a>

                    )}

                    {/* NAVIGATION */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration:
                          "none",
                      }}
                    >

                      <button
                        style={
                          styles.navBtn
                        }
                      >
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

/*
--------------------------------------------------
STYLES
--------------------------------------------------
*/
const styles = {

  container: {
    padding: 20,
    background: "#f5f7fb",
    minHeight: "100vh",
  },

  heading: {
    textAlign: "center",
    marginBottom: 20,
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
    flexWrap: "wrap",
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

  websiteBadge: {
    background: "#E8F5E9",
    color: "#2E7D32",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },

  googleBadge: {
    background: "#FFF3E0",
    color: "#EF6C00",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },

};

export default NearbyPGMap;