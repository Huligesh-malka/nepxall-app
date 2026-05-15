import React, { useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/*
--------------------------------------------------
CONFIG
--------------------------------------------------
*/
const API_BASE_URL = "https://nepxall-backend.onrender.com";

/*
--------------------------------------------------
SLIDER SETTINGS
--------------------------------------------------
*/
const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 2500,
  arrows: false
};

/*
--------------------------------------------------
COMPONENT
--------------------------------------------------
*/
const GooglePropertySearch = () => {

  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  // STEP 1 — ADD NEW STATE
  const [googleLink, setGoogleLink] = useState("");

  /*
  --------------------------------------------------
  SEARCH GOOGLE PROPERTIES
  --------------------------------------------------
  */

  const searchProperties = async () => {

    try {

      if (!search) {

        alert("Enter search");

        return;

      }

      setLoading(true);

      const res =
        await axios.get(

          `${API_BASE_URL}/api/nearby-pg/google-search?query=${search}`

        );

      console.log(
        "Search Result:",
        res.data
      );

      if (res.data.success) {

        setPgs(res.data.pgs || []);

      } else {

        setError("No Properties Found");

      }

    } catch (error) {

      console.log(error);

      setError(
        "Failed To Search Properties"
      );

    } finally {

      setLoading(false);

    }

  };

  // STEP 2 — ADD LINK SEARCH FUNCTION
  /*
  --------------------------------------------------
  SEARCH GOOGLE MAPS LINK
  --------------------------------------------------
  */

  const searchGoogleLink = async () => {

    try {

      if (!googleLink) {

        alert("Paste Google Maps Link");

        return;

      }

      setLoading(true);

      const res =
        await axios.post(

          `${API_BASE_URL}/api/nearby-pg/google-link-search`,

          {
            url: googleLink
          }

        );

      console.log(
        "Google Link Result:",
        res.data
      );

      if (res.data.success) {

        setPgs([res.data.property]);

        setError("");

      } else {

        setError(
          "Property Not Found"
        );

      }

    } catch (error) {

      console.log(error);

      setError(
        "Failed To Search Google Link"
      );

    } finally {

      setLoading(false);

    }

  };

  /*
  --------------------------------------------------
  ACCEPT PROPERTY
  --------------------------------------------------
  */

  const handleAcceptProperty = async (pg) => {

    try {

      const response = await axios.post(

        `${API_BASE_URL}/api/nearby-pg/accept-google-property`,

        {
          property: pg
        }

      );

      if (response.data.success) {

        alert("Property Stored Successfully ✅");

      } else {

        alert("Failed to Store Property");

      }

    } catch (error) {

      console.log(error);

      alert("Error storing property");

    }

  };

  /*
  --------------------------------------------------
  LOADING
  --------------------------------------------------
  */

  if (loading) {

    return (

      <div style={styles.center}>
        <h2>Searching Properties...</h2>
      </div>

    );

  }

  /*
  --------------------------------------------------
  UI
  --------------------------------------------------
  */

  return (

    <div style={styles.container}>

      <h1 style={styles.heading}>
        Google Property Search
      </h1>

      {/* STEP 3 — ADD GOOGLE MAPS LINK INPUT UI */}
      {/* GOOGLE MAPS LINK */}

      <div style={styles.linkContainer}>

        <input
          type="text"
          placeholder="Paste Google Maps Property Link..."
          value={googleLink}
          onChange={(e) =>
            setGoogleLink(e.target.value)
          }
          style={styles.searchInput}
        />

        <button
          style={styles.linkBtn}
          onClick={searchGoogleLink}
        >
          Load Link
        </button>

      </div>

      {/* SEARCH BAR */}

      <div style={styles.searchContainer}>

        <input
          type="text"
          placeholder="Search Bangalore PG, Hyderabad Coliving, Mumbai 1 BHK..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={styles.searchInput}
        />

        <button
          style={styles.searchBtn}
          onClick={searchProperties}
        >
          Search
        </button>

      </div>

      {/* ERROR */}

      {error && (

        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>

      )}

      {/* PG LIST */}

      {pgs.length === 0 && !error ? (

        <div style={styles.center}>
          <h3>Search for properties above</h3>
          <p style={{ color: "#666", marginTop: 10 }}>
            Try: "Bangalore PG", "Hyderabad Coliving", "Mumbai Apartments"
          </p>
          <p style={{ color: "#666", marginTop: 10 }}>
            Or paste a Google Maps link to import a specific property
          </p>
        </div>

      ) : (

        <div style={styles.grid}>

          {pgs.map((pg) => {

            let image =
              "https://via.placeholder.com/400x250?text=No+Image";

            let allPhotos = [];

            try {

              /*
              =========================================
              STRING PHOTOS
              =========================================
              */

              if (
                pg.photos &&
                typeof pg.photos === "string"
              ) {

                const parsed =
                  JSON.parse(pg.photos);

                if (
                  Array.isArray(parsed)
                ) {

                  allPhotos = parsed;

                  if (parsed.length > 0) {

                    image = parsed[0];

                  }

                }

              }

              /*
              =========================================
              ARRAY PHOTOS
              =========================================
              */

              else if (
                pg.photos &&
                Array.isArray(pg.photos)
              ) {

                allPhotos = pg.photos;

                if (
                  pg.photos.length > 0
                ) {

                  image = pg.photos[0];

                }

              }

              /*
              =========================================
              SINGLE IMAGE
              =========================================
              */

              else if (pg.image) {

                image = pg.image;

                allPhotos = [pg.image];

              }

            } catch (e) {

              console.log(e);

              image =
                pg.image ||
                "https://via.placeholder.com/400x250?text=No+Image";

              allPhotos = [image];

            }

            return (

              <div
                key={pg.id || pg.place_id}
                style={styles.card}
              >

                {/* IMAGE SLIDER */}

                <Slider {...sliderSettings}>

                  {(allPhotos.length > 0
                    ? allPhotos
                    : [image]
                  ).map((photo, index) => (

                    <div key={index}>

                      <img
                        src={photo}
                        alt={`Property ${index}`}
                        style={styles.image}
                        onError={(e) => {

                          e.target.src =
                            "https://via.placeholder.com/400x250?text=No+Image";

                        }}
                      />

                    </div>

                  ))}

                </Slider>

                {/* CONTENT */}

                <div style={styles.content}>

                  {/* BADGE */}

                  <div style={{ marginBottom: 10 }}>

                    <span style={styles.googleBadge}>
                      Google Maps Property
                    </span>

                  </div>

                  {/* NAME */}

                  <h2 style={styles.name}>
                    {pg.pg_name || pg.name}
                  </h2>

                  {/* PRICE */}

                  <p style={styles.price}>

                    ₹ {
                      pg.price ||
                      pg.rent_amount ||
                      "Contact"
                    }

                  </p>

                  {/* ADDRESS */}

                  <p style={styles.address}>
                    {pg.address}
                  </p>

                  {/* RATING */}

                  {pg.rating && (

                    <p style={styles.rating}>
                      ⭐ {pg.rating}
                    </p>

                  )}

                  {/* PHONE */}

                  {pg.phone && (

                    <p style={styles.phone}>
                      📞 {pg.phone}
                    </p>

                  )}

                  {/* STEP 5 — ADD GOOGLE MAPS BUTTON */}
                  {/* MAP BUTTON */}

                  {pg.maps_url && (

                    <a
                      href={pg.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.mapBtn}
                    >
                      Open In Google Maps
                    </a>

                  )}

                  {/* BUTTON */}

                  <div style={styles.buttonContainer}>

                    <button
                      style={styles.acceptBtn}
                      onClick={() =>
                        handleAcceptProperty(pg)
                      }
                    >
                      Accept Property
                    </button>

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
    minHeight: "100vh"
  },

  heading: {
    textAlign: "center",
    marginBottom: 20,
    color: "#0B5ED7"
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    flexDirection: "column"
  },

  // STEP 4 — ADD NEW STYLES
  linkContainer: {
    display: "flex",
    gap: 10,
    marginBottom: 25
  },

  linkBtn: {
    background: "#34A853",
    color: "#fff",
    border: "none",
    padding: "0 25px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  searchContainer: {
    display: "flex",
    gap: 10,
    marginBottom: 25
  },

  searchInput: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 16
  },

  searchBtn: {
    background: "#0B5ED7",
    color: "#fff",
    border: "none",
    padding: "0 25px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  errorBox: {
    background: "#FFE5E5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    color: "#D32F2F",
    textAlign: "center"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: 20
  },

  card: {
    background: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)"
  },

  image: {
    width: "100%",
    height: 220,
    objectFit: "cover"
  },

  content: {
    padding: 15
  },

  name: {
    margin: 0,
    marginBottom: 10,
    color: "#222",
    fontSize: 18
  },

  price: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 18
  },

  address: {
    color: "#666",
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 1.4
  },

  rating: {
    color: "#FFA000",
    fontWeight: "600",
    marginTop: 5
  },

  phone: {
    color: "#444",
    fontWeight: "600",
    marginTop: 5
  },

  buttonContainer: {
    display: "flex",
    gap: 10,
    marginTop: 15,
    flexWrap: "wrap"
  },

  acceptBtn: {
    background: "#0B5ED7",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%"
  },

  googleBadge: {
    background: "#FFF3E0",
    color: "#EF6C00",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold"
  },

  // STEP 6 — ADD BUTTON STYLE
  mapBtn: {
    display: "block",
    textAlign: "center",
    background: "#fff",
    border: "1px solid #0B5ED7",
    color: "#0B5ED7",
    padding: "10px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: "bold",
    marginTop: 10
  }

};

export default GooglePropertySearch;