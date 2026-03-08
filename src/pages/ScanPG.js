import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

const ScanPG = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchPG();
  }, []);

  const fetchPG = async () => {

    try {

      const res = await axios.get(
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

      if(res.data.success){
        setPg(res.data.data);
      }

    } catch(err){
      console.error(err);
    }

  };

  const goToPayment = () => {

    if(!selectedRoom){
      alert("Please select a room");
      return;
    }

    navigate(`/booking/${id}?room=${selectedRoom}`);

  };

  if(!pg){
    return <div style={{padding:40}}>Loading PG...</div>;
  }

  return (

    <div style={{maxWidth:500,margin:"40px auto"}}>

      <h2>{pg.pg_name}</h2>

      <p>
        📍 {pg.area}, {pg.city}
      </p>

      <h3>
        Starting Rent: ₹{pg.rent_amount}
      </h3>

      <hr/>

      <h3>Available Rooms</h3>

      {pg.single_sharing && (
        <div>
          <input
            type="radio"
            name="room"
            onChange={()=>setSelectedRoom("single")}
          />
          Single Sharing – ₹{pg.single_sharing}
        </div>
      )}

      {pg.double_sharing && (
        <div>
          <input
            type="radio"
            name="room"
            onChange={()=>setSelectedRoom("double")}
          />
          Double Sharing – ₹{pg.double_sharing}
        </div>
      )}

      {pg.triple_sharing && (
        <div>
          <input
            type="radio"
            name="room"
            onChange={()=>setSelectedRoom("triple")}
          />
          Triple Sharing – ₹{pg.triple_sharing}
        </div>
      )}

      {pg.four_sharing && (
        <div>
          <input
            type="radio"
            name="room"
            onChange={()=>setSelectedRoom("four")}
          />
          Four Sharing – ₹{pg.four_sharing}
        </div>
      )}

      <br/>

      <button
        onClick={goToPayment}
        style={{
          width:"100%",
          padding:12,
          background:"#4f46e5",
          color:"#fff",
          border:"none",
          borderRadius:8
        }}
      >
        Continue to Payment
      </button>

      <br/><br/>

      {pg.contact_phone && (
        <a href={`tel:${pg.contact_phone}`}>
          <button
            style={{
              width:"100%",
              padding:12,
              background:"#22c55e",
              color:"#fff",
              border:"none",
              borderRadius:8
            }}
          >
            Call Owner
          </button>
        </a>
      )}

    </div>

  );

};

export default ScanPG;