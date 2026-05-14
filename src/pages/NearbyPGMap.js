import React, { useEffect, useState } from "react";
import axios from "axios";

const NearbyPGMap = () => {
  const [pgs, setPgs] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLocation({ lat, lng });

      try {
        const res = await axios.get(
          `http://localhost:5000/api/pg/nearby?lat=${lat}&lng=${lng}`
        );

        setPgs(res.data.pgs);
      } catch (err) {
        console.log(err);
      }
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Nearby PGs</h2>

      {pgs.map((pg) => (
        <div
          key={pg._id}
          style={{
            border: "1px solid #ddd",
            marginBottom: 20,
            padding: 15,
            borderRadius: 10,
          }}
        >
          <img
            src={pg.photos?.[0]}
            alt={pg.name}
            style={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />

          <h3>{pg.name}</h3>
          <p>₹ {pg.price}</p>
          <p>{pg.address}</p>

          <a
            href={`https://wa.me/${pg.phone}?text=I want PG details`}
            target="_blank"
            rel="noreferrer"
          >
            <button>Book Now</button>
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${pg.location.coordinates[1]},${pg.location.coordinates[0]}`}
            target="_blank"
            rel="noreferrer"
          >
            <button style={{ marginLeft: 10 }}>Navigate</button>
          </a>
        </div>
      ))}
    </div>
  );
};

export default NearbyPGMap;