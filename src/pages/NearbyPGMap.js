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

  // Facebook States
  const [facebookUrl, setFacebookUrl] = useState("");
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookProperty, setFacebookProperty] = useState(null);

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

  /*
  --------------------------------------------------
  FACEBOOK IMPORT FUNCTION - ONLY PREVIEW
  --------------------------------------------------
  */

  const importFacebookPost = async () => {

    try {

      if (!facebookUrl) {

        alert("Paste Facebook URL");

        return;

      }

      setFacebookLoading(true);

      /*
      =========================================
      ONLY PREVIEW
      =========================================
      */

      const previewData = {

        facebook_url:
          facebookUrl,

        photos: [

          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",

          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"

        ],

        source:
          "facebook"

      };

      /*
      =========================================
      SHOW PREVIEW
      =========================================
      */

      setFacebookProperty(previewData);

    } catch (error) {

      console.log(error);

      alert("Import Failed");

    } finally {

      setFacebookLoading(false);

    }

  };

  /*
  --------------------------------------------------
  ACCEPT PROPERTY (GOOGLE)
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
  HANDLE EDIT & ADD PROPERTY - FIXED!
  --------------------------------------------------
  */

  const handleEditAddProperty = async () => {

    try {

      /*
      =========================================
      SAVE TEMP PROPERTY OR GET EXISTING
      =========================================
      */

      const response =
        await axios.post(

          `${API_BASE_URL}/api/nearby-pg/accept-facebook-property`,

          {

            property: {

              pg_name:
                "Facebook Imported Property",

              address:
                "Bengaluru",

              area:
                "Whitefield",

              description:
                "Imported From Facebook",

              facebook_url:
                facebookProperty.facebook_url,

              photos:
                facebookProperty.photos,

              pg_category:
                "to_let"

            }

          }

        );

      /*
      =========================================
      CHECK RESPONSE HAS property_id
      =========================================
      */

      if (response.data.success && response.data.property_id) {

        const propertyId = response.data.property_id;

        console.log("Property ID:", propertyId);

        /*
        =========================================
        FIXED: Use /admin/pg/ route NOT /admin/add-property
        =========================================
        */

        window.location.href = `/admin/pg/${propertyId}`;

      } else {

        console.error("No property_id in response:", response.data);
        alert("Failed to get property ID. Please try again.");

      }

    } catch (error) {

      console.log("Error in handleEditAddProperty:", error);
      alert("Failed To Open Edit Page: " + (error.response?.data?.message || error.message));

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
        Property Management Dashboard
      </h1>

      {/* FACEBOOK IMPORT SECTION */}
      
      <div style={styles.facebookBox}>

        <h2 style={styles.facebookTitle}>
          Import Facebook Property
        </h2>

        <div style={styles.searchContainer}>

          <input
            type="text"
            placeholder="Paste Facebook Post URL..."
            value={facebookUrl}
            onChange={(e) =>
              setFacebookUrl(e.target.value)
            }
            style={styles.searchInput}
          />

          <button
            style={styles.facebookBtn}
            onClick={importFacebookPost}
          >

            {
              facebookLoading
                ? "Importing..."
                : "Import"
            }

          </button>

        </div>

      </div>

      {/* SHOW IMPORTED FACEBOOK CARD - PREVIEW ONLY */}

      {
        facebookProperty && (

          <div style={styles.previewCard}>

            <div style={styles.previewHeader}>

              <span style={styles.facebookBadge}>
                Facebook Preview
              </span>

            </div>

            {/* PHOTO SLIDER */}

            <Slider {...sliderSettings}>

              {facebookProperty.photos.map(
                (photo, index) => (

                  <div key={index}>

                    <img
                      src={photo}
                      alt=""
                      style={styles.previewImage}
                    />

                  </div>

                )
              )}

            </Slider>

            {/* LINK */}

            <a
              href={facebookProperty.facebook_url}
              target="_blank"
              rel="noreferrer"
              style={styles.facebookLink}
            >

              Open Facebook Post

            </a>

            {/* EDIT BUTTON - FIXED ROUTE */}

            <button
              style={styles.acceptBtn}
              onClick={handleEditAddProperty}
            >

              Edit & Add Property

            </button>

          </div>

        )
      }

      {/* GOOGLE SEARCH SECTION */}

      <h2 style={styles.googleSectionTitle}>
        Google Property Search
      </h2>

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
                      📞 {pg.phone.replace(/\D/g, "")}
                    </p>

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

  googleSectionTitle: {
    marginTop: 30,
    marginBottom: 15,
    color: "#0B5ED7",
    fontSize: 24
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    flexDirection: "column"
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

  // Facebook Styles
  facebookBox: {
    background: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
  },

  facebookTitle: {
    marginBottom: 15,
    color: "#1877F2"
  },

  facebookBtn: {
    background: "#1877F2",
    color: "#fff",
    border: "none",
    padding: "0 25px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  previewCard: {
    background: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
  },

  previewHeader: {
    padding: 15
  },

  facebookBadge: {
    background: "#1877F2",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold"
  },

  previewImage: {
    width: "100%",
    height: 250,
    objectFit: "cover"
  },

  facebookLink: {
    display: "block",
    padding: 15,
    color: "#1877F2",
    fontWeight: "bold",
    textDecoration: "none"
  }

};

export default GooglePropertySearch;