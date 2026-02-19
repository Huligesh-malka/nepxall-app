import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PGLocationMap = ({ pg }) => {
  const navigate = useNavigate();

  if (!pg.latitude || !pg.longitude) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>📍 PG Location</h3>

      <MapContainer
        center={[pg.latitude, pg.longitude]}
        zoom={15}
        style={{ height: "300px", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={[pg.latitude, pg.longitude]}>
          <Popup>
            <strong>{pg.pg_name}</strong>
            <br />
            {pg.area}
            <br />
            <button
              style={{
                marginTop: 6,
                padding: "6px 10px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
              onClick={() => navigate(`/pg/${pg.id}`)}
            >
              View PG →
            </button>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default PGLocationMap;
