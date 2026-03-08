import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPG();
  }, [id]);

  const fetchPG = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

      if (res.data.success) {
        setPg(res.data.data);
      }

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    if (!selectedRoom) {
      alert("Please select a room");
      return;
    }

    navigate(
      `/booking/${id}?roomId=${selectedRoom.room_number}&type=${selectedRoom.sharing_type}&price=${selectedRoom.price}`
    );
  };

  if (loading) {
    return <div style={styles.center}>Loading property...</div>;
  }

  if (!pg) {
    return <div style={styles.center}>Property not found.</div>;
  }

  return (
    <div style={styles.container}>
      
      {/* PG TITLE */}
      <h2 style={styles.title}>{pg.pg_name}</h2>
      <p style={styles.address}>📍 {pg.area}, {pg.city}</p>

      {/* PHOTOS */}
      {pg.photos && pg.photos.length > 0 && (
        <div style={styles.photoContainer}>
          <img
            src={pg.photos[0]}
            alt="PG"
            style={styles.photo}
          />
        </div>
      )}

      {/* DESCRIPTION */}
      {pg.description && (
        <p style={styles.description}>{pg.description}</p>
      )}

      {/* PRICE INFO */}
      <div style={styles.priceBox}>
        <div>
          <b>Starting Rent</b>
          <p>₹{pg.rent_amount}</p>
        </div>

        <div>
          <b>Deposit</b>
          <p>₹{pg.deposit_amount || 0}</p>
        </div>
      </div>

      {/* AMENITIES */}
      <div style={styles.amenities}>
        {pg.wifi_available && <span style={styles.tag}>WiFi</span>}
        {pg.food_available && <span style={styles.tag}>Food</span>}
        {pg.ac_available && <span style={styles.tag}>AC</span>}
        {pg.parking_available && <span style={styles.tag}>Parking</span>}
        {pg.laundry_available && <span style={styles.tag}>Laundry</span>}
        {pg.cctv && <span style={styles.tag}>CCTV</span>}
        {pg.power_backup && <span style={styles.tag}>Power Backup</span>}
      </div>

      {/* SUMMARY */}
      <div style={styles.summaryBox}>
        <b>Availability</b>
        <div style={{ marginTop: 5 }}>
          {Object.entries(pg.availability_summary || {}).map(([type, count]) => (
            <span key={type} style={styles.badge}>
              {type}: {count}
            </span>
          ))}
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Select Room</h3>

      {/* ROOMS */}
      {pg.available_room_details && pg.available_room_details.length > 0 ? (
        <div style={styles.roomList}>
          {pg.available_room_details.map((room, index) => (
            <label
              key={index}
              style={{
                ...styles.roomItem,
                borderColor:
                  selectedRoom?.room_number === room.room_number
                    ? "#4f46e5"
                    : "#ddd"
              }}
            >
              <input
                type="radio"
                name="room"
                style={styles.radio}
                onChange={() => setSelectedRoom(room)}
              />

              <div style={styles.roomInfo}>
                <b>Room {room.room_number}</b>
                <p style={styles.roomType}>{room.sharing_type}</p>
              </div>

              <div style={styles.priceInfo}>
                <b style={styles.price}>₹{room.price}</b>
                <p style={styles.beds}>{room.available_beds} beds left</p>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p style={{ color: "red" }}>No rooms available</p>
      )}

      {/* BUTTONS */}
      <div style={styles.footer}>
        <button onClick={goToPayment} style={styles.payBtn}>
          Continue Booking
        </button>

        {pg.contact_phone && (
          <a href={`tel:${pg.contact_phone}`}>
            <button style={styles.callBtn}>
              📞 Call Owner
            </button>
          </a>
        )}

        {pg.latitude && pg.longitude && (
          <a
            href={`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            <button style={styles.mapBtn}>
              🗺 View on Map
            </button>
          </a>
        )}
      </div>

    </div>
  );
};

const styles = {

container:{
maxWidth:500,
margin:"auto",
padding:20
},

center:{
textAlign:"center",
marginTop:100
},

title:{
marginBottom:5
},

address:{
color:"#6b7280"
},

photoContainer:{
marginTop:15
},

photo:{
width:"100%",
borderRadius:10
},

description:{
marginTop:10,
color:"#4b5563"
},

priceBox:{
display:"flex",
justifyContent:"space-between",
background:"#f3f4f6",
padding:12,
borderRadius:8,
marginTop:15
},

amenities:{
display:"flex",
flexWrap:"wrap",
gap:6,
marginTop:10
},

tag:{
background:"#e5e7eb",
padding:"5px 10px",
borderRadius:20,
fontSize:12
},

summaryBox:{
marginTop:20,
background:"#f3f4f6",
padding:10,
borderRadius:8
},

badge:{
display:"inline-block",
background:"#fff",
padding:"4px 10px",
borderRadius:20,
marginRight:6,
fontSize:12
},

sectionTitle:{
marginTop:25
},

roomList:{
display:"flex",
flexDirection:"column",
gap:10
},

roomItem:{
display:"flex",
alignItems:"center",
padding:12,
border:"2px solid #ddd",
borderRadius:10,
cursor:"pointer"
},

radio:{
marginRight:10
},

roomInfo:{
flex:1
},

roomType:{
fontSize:12,
color:"#6b7280"
},

priceInfo:{
textAlign:"right"
},

price:{
color:"#4f46e5"
},

beds:{
fontSize:12,
color:"#16a34a"
},

footer:{
marginTop:25,
display:"flex",
flexDirection:"column",
gap:10
},

payBtn:{
padding:14,
background:"#4f46e5",
color:"#fff",
border:"none",
borderRadius:10,
fontWeight:"bold",
cursor:"pointer"
},

callBtn:{
padding:14,
background:"#fff",
color:"#22c55e",
border:"2px solid #22c55e",
borderRadius:10,
fontWeight:"bold",
cursor:"pointer"
},

mapBtn:{
padding:14,
background:"#fff",
color:"#2563eb",
border:"2px solid #2563eb",
borderRadius:10,
fontWeight:"bold",
cursor:"pointer"
}

};

export default ScanPG;