
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";
import {
  MapPin, Navigation, ChevronLeft, ChevronRight, Check,
  Share2, Heart, ArrowUpRight, Phone, Sparkles, ArrowUp, Calendar, Eye
} from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ============ NEW THEME — Midnight Editorial ============ */
const T = {
  bg: "#0B0C0E",            // canvas
  bgSoft: "#121316",        // raised
  bgElev: "#191B1F",        // card
  bgGlass: "rgba(25,27,31,0.65)",
  ink: "#F2EFE8",           // primary text (cream)
  inkSoft: "#B7B2A6",       // secondary
  inkMute: "#7A7568",       // tertiary
  line: "#2A2C30",
  lineSoft: "#1F2125",
  gold: "#D9B26A",          // primary accent
  goldSoft: "#3A2F1B",
  emerald: "#7BB69A",        // success / available
  emeraldSoft: "#1A2A23",
  coral: "#E07856",          // heart / warn
  danger: "#D85A6C",
};

const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  if (photo.includes("/uploads/")) {
    const i = photo.indexOf("/uploads/");
    return `${BASE_URL}${photo.substring(i)}`;
  }
  if (photo.includes("/opt/render/")) {
    const m = photo.match(/\/uploads\/.*/);
    if (m) return `${BASE_URL}${m[0]}`;
  }
  return `${BASE_URL}${photo.startsWith("/") ? photo : "/" + photo}`;
};

const fmtINR = (price) => {
  if (price === null || price === undefined || price === "" || price === "0" || price === 0) return null;
  const n = Number(price);
  if (isNaN(n) || n <= 0) return null;
  return `₹${n.toLocaleString("en-IN")}`;
};

const getHighlightIcon = (category, type) => {
  const map = {
    college: "🎓", nearby_college: "🎓", school: "📚", nearby_school: "📚",
    hospital: "🏥", nearby_hospital: "🏥", clinic: "🩺", pharmacy: "💊",
    bank: "🏦", atm: "🏧", police: "🛡", restaurant: "🍽", supermarket: "🛒",
    grocery: "🥦", bus: "🚌", railway: "🚆", metro: "🚇", gym: "🏋",
    park: "🌳", mall: "🏬", temple: "🛕", mosque: "🕌", church: "⛪",
    it_park: "💻", office_hub: "🏢", main_road: "🛣",
  };
  return map[type] || map[type?.replace("nearby_", "")] || "📍";
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("all");
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const highlightCategories = [
    { id: "all", label: "All", icon: "✦" },
    { id: "education", label: "Education", icon: "🎓" },
    { id: "transport", label: "Transit", icon: "🚌" },
    { id: "healthcare", label: "Health", icon: "🏥" },
    { id: "shopping", label: "Shopping", icon: "🛒" },
    { id: "finance", label: "Finance", icon: "🏦" },
    { id: "recreation", label: "Leisure", icon: "🏃" },
    { id: "worship", label: "Worship", icon: "🛐" },
    { id: "safety", label: "Safety", icon: "🛡" },
    { id: "food", label: "Food", icon: "🍽" },
  ];

  const typeToCategory = {
    nearby_college: "education", nearby_school: "education", nearby_it_park: "education", nearby_office_hub: "education",
    nearby_metro: "transport", nearby_bus_stop: "transport", nearby_railway_station: "transport", distance_main_road: "transport",
    nearby_hospital: "healthcare", nearby_clinic: "healthcare", nearby_pharmacy: "healthcare",
    nearby_supermarket: "shopping", nearby_grocery_store: "shopping", nearby_mall: "shopping",
    nearby_bank: "finance", nearby_atm: "finance", nearby_post_office: "finance",
    nearby_gym: "recreation", nearby_park: "recreation",
    nearby_temple: "worship", nearby_mosque: "worship", nearby_church: "worship",
    nearby_police_station: "safety", nearby_restaurant: "food",
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = (e) => setIsMobile(e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowScrollTop(y > 400);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? Math.min((y / h) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch");
        const data = res.data.data;
        const photos = Array.isArray(data.photos) ? data.photos.map((p) => ({ type: "photo", src: getCorrectImageUrl(p) })) : [];
        let videos = [];
        if (data.videos) {
          if (Array.isArray(data.videos)) videos = data.videos.map((v) => ({ type: "video", src: getCorrectImageUrl(v) }));
          else if (typeof data.videos === "string") {
            try {
              const p = JSON.parse(data.videos);
              if (Array.isArray(p)) videos = p.map((v) => ({ type: "video", src: getCorrectImageUrl(v) }));
            } catch (e) {}
          }
        }
        setMedia([...photos, ...videos]);
        setPG(data);
        if (data.latitude && data.longitude) setMapCenter([data.latitude, data.longitude]);
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally { setLoading(false); }
    };
    if (id) fetchPGDetails(); else { setError("Invalid ID"); setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const processDBHighlights = () => {
      const fields = ["nearby_college","nearby_school","nearby_it_park","nearby_office_hub","nearby_metro","nearby_bus_stop","nearby_railway_station","distance_main_road","nearby_hospital","nearby_clinic","nearby_pharmacy","nearby_supermarket","nearby_grocery_store","nearby_restaurant","nearby_mall","nearby_bank","nearby_atm","nearby_post_office","nearby_gym","nearby_park","nearby_temple","nearby_mosque","nearby_church","nearby_police_station"];
      return fields.filter(f => pg[f]?.trim?.()).map(f => ({
        name: pg[f], type: f, category: typeToCategory[f] || "other",
        icon: getHighlightIcon(typeToCategory[f], f), source: "database", coordinates: null
      }));
    };

    const fetchAutoHighlights = async () => {
      try {
        setLoadingHighlights(true);
        const query = `[out:json];(node(around:1200,${pg.latitude},${pg.longitude})["amenity"="hospital"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="school"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="college"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="bank"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="atm"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="police"];node(around:1200,${pg.latitude},${pg.longitude})["railway"="station"];node(around:1200,${pg.latitude},${pg.longitude})["highway"="bus_stop"];node(around:1200,${pg.latitude},${pg.longitude})["shop"="supermarket"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="restaurant"];node(around:1200,${pg.latitude},${pg.longitude})["leisure"="park"];node(around:1200,${pg.latitude},${pg.longitude})["amenity"="place_of_worship"];);out tags 15;`;
        const res = await axios.post("https://overpass-api.de/api/interpreter", query, { headers: { "Content-Type": "text/plain" } });
        const places = res.data.elements.map(el => {
          const type = el.tags?.amenity || el.tags?.shop || el.tags?.railway || el.tags?.highway || el.tags?.leisure || "other";
          const cat = Object.keys(typeToCategory).find(k => type.includes(k.replace("nearby_",""))) || "other";
          return { name: el.tags?.name || `Unknown ${type}`, type, category: typeToCategory[cat] || "other", icon: getHighlightIcon(typeToCategory[cat], type), source: "osm", coordinates: el.lat && el.lon ? [el.lat, el.lon] : null };
        }).filter(p => p.name && !p.name.startsWith("Unknown"));
        const all = [...processDBHighlights(), ...places];
        setNearbyHighlights(Array.from(new Map(all.map(i => [i.name, i])).values()));
      } catch (err) { setNearbyHighlights(processDBHighlights()); }
      finally { setLoadingHighlights(false); }
    };

    const fetchNearbyPGs = async () => {
      try {
        setLoadingNearbyPGs(true);
        if (!id || id === "undefined") return setNearbyPGs([]);
        let response = null, success = false;
        try {
          response = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
          if (response.data?.success) success = true;
        } catch (e) {}
        if (!success) {
          try {
            response = await api.get(`/properties/nearby?lat=${pg.latitude}&lng=${pg.longitude}&radius=5&exclude=${id}`);
            if (response.data?.success) success = true;
          } catch (e) {}
        }
        if (success && response?.data?.data) {
          const list = Array.isArray(response.data.data) ? response.data.data : [];
          const withDist = list.filter(o => o.id !== parseInt(id)).map(o => ({
            ...o, distance: o.latitude && o.longitude ? calculateDistance(pg.latitude, pg.longitude, o.latitude, o.longitude) : 0
          }));
          setNearbyPGs(withDist.sort((a,b) => a.distance - b.distance).slice(0, 4));
        }
      } catch (err) { setNearbyPGs([]); }
      finally { setLoadingNearbyPGs(false); }
    };

    fetchAutoHighlights();
    fetchNearbyPGs();
  }, [pg, id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;
  const hasLocation = pg?.latitude && pg?.longitude;

  const getStartingPrice = () => {
    if (!pg) return null;
    if (isToLet) return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk;
    if (isCoLiving) return pg.co_living_single_room || pg.co_living_double_room || pg.coliving_three_sharing || pg.coliving_four_sharing;
    return pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room || pg.triple_room;
  };

  const handleViewOnMap = (h) => {
    if (h.coordinates) {
      setMapCenter(h.coordinates);
      setMapZoom(17);
      setSelectedHighlightCategory(h.category);
      setTimeout(() => document.getElementById("location-map")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  };

  const handleViewNearbyPG = (pgId) => {
    if (pgId && pgId !== "all") navigate(`/pg/${pgId}`);
    else if (pgId === "all" && pg?.area) navigate(`/properties?area=${encodeURIComponent(pg.area)}`);
    else if (pgId === "all" && pg?.city) navigate(`/properties?city=${encodeURIComponent(pg.city)}`);
    else navigate("/properties");
  };

  const getAllFacilities = () => {
    if (!pg) return [];
    const f = [];
    const push = (cond, label, group) => cond && f.push({ label, group });
    push(pg.wifi_available, "Wi-Fi", "Connectivity");
    push(pg.common_tv_lounge, "TV Lounge", "Connectivity");
    push(pg.study_room, "Study Room", "Connectivity");
    push(pg.ac_available, "Air Conditioning", "Appliances");
    push(pg.geyser, "Geyser", "Appliances");
    push(pg.tv, "Television", "Appliances");
    push(pg.refrigerator, "Refrigerator", "Appliances");
    push(pg.washing_machine, "Washing Machine", "Appliances");
    push(pg.microwave, "Microwave", "Appliances");
    push(pg.water_purifier, "Water Purifier", "Appliances");
    push(pg.bed_with_mattress, "Bed with Mattress", "Room & Comfort");
    push(pg.cupboard_available, "Wardrobe", "Room & Comfort");
    push(pg.table_chair_available, "Study Desk", "Room & Comfort");
    push(pg.dining_table_available, "Dining Table", "Room & Comfort");
    push(pg.sofa, "Sofa", "Room & Comfort");
    push(pg.attached_bathroom, "Attached Bathroom", "Room & Comfort");
    push(pg.balcony_available, "Balcony", "Room & Comfort");
    push(pg.fan_light, "Fan & Light", "Room & Comfort");
    push(pg.kitchen_room, "Kitchen", "Kitchen");
    push(pg.modular_kitchen, "Modular Kitchen", "Kitchen");
    push(pg.cctv, "CCTV", "Safety");
    push(pg.security_guard, "Security Guard", "Safety");
    push(pg.fire_safety, "Fire Safety", "Safety");
    push(pg.lock_system, "Secure Locks", "Safety");
    push(pg.parking_available, "Car Parking", "Parking");
    push(pg.bike_parking, "Bike Parking", "Parking");
    push(pg.power_backup, "Power Backup", "Utilities");
    push(pg.water_24x7, "24×7 Water", "Utilities");
    push(pg.lift_elevator, "Elevator", "Utilities");
    push(pg.gym, "Gym", "Wellness");
    push(pg.balcony_open_space, "Open Terrace", "Wellness");
    push(pg.housekeeping, "Housekeeping", "Services");
    push(pg.laundry_available, "Laundry", "Services");
    return f;
  };

  const facilities = getAllFacilities();
  const facGrouped = facilities.reduce((acc, f) => {
    (acc[f.group] = acc[f.group] || []).push(f);
    return acc;
  }, {});

  if (authLoading || loading) {
    return (
      <div style={S.bgWrap}>
        <BackgroundFX />
        <Fonts />
        <div style={S.center}>
          <div className="loader-orb" />
          <p style={{ marginTop: 24, color: T.inkMute, fontFamily: "'Inter Tight', sans-serif", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>Loading property</p>
          <style>{`.loader-orb{width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 30% 30%,${T.gold},transparent 60%);animation:orb 1.6s infinite ease-in-out;box-shadow:0 0 40px ${T.gold}40}@keyframes orb{0%,100%{transform:scale(.85);opacity:.5}50%{transform:scale(1.15);opacity:1}}`}</style>
        </div>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={S.bgWrap}>
        <BackgroundFX />
        <Fonts />
        <div style={S.center}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.gold, letterSpacing: "0.2em", fontSize: 11, marginBottom: 16 }}>ERROR · 404</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 48, color: T.ink, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>Property not found</h2>
          <p style={{ color: T.inkMute, marginTop: 12, fontFamily: "'Inter Tight', sans-serif" }}>{error || "This listing may have been removed."}</p>
          <button style={{ ...S.btnGhost, marginTop: 24 }} onClick={() => navigate("/")}>← Back home</button>
        </div>
      </div>
    );
  }

  const current = media[index];
  const startingPrice = getStartingPrice();

  return (
    <div style={S.bgWrap}>
      <Fonts />
      <BackgroundFX />

      {/* Scroll progress bar */}
      <div style={{ ...S.scrollBar, width: `${scrollProgress}%` }} />

      <div style={S.page}>
        {notification && <div style={S.toast}><Check size={16} /> {notification}</div>}

        {/* Top utility nav */}
        <nav style={S.topNav}>
          <div style={S.breadcrumb}>
            <span onClick={() => navigate("/")} style={S.crumb}>Home</span>
            <span style={S.crumbSep}>/</span>
            <span onClick={() => navigate("/properties")} style={S.crumb}>Properties</span>
            <span style={S.crumbSep}>/</span>
            <span style={S.crumbCurrent}>{pg.pg_name}</span>
          </div>
          <div style={S.topActions}>
            <IconBtn onClick={() => setFavorited(f => !f)} active={favorited}>
              <Heart size={16} fill={favorited ? T.coral : "none"} color={favorited ? T.coral : T.ink} />
            </IconBtn>
            <IconBtn><Share2 size={16} color={T.ink} /></IconBtn>
          </div>
        </nav>

        {/* ===== HERO: editorial split ===== */}
        <section style={S.heroEditorial}>
          {/* Left: meta + title */}
          <div style={S.heroLeft}>
            <div style={S.heroEyebrow}>
              <span style={S.heroEyebrowDot} />
              {isToLet ? "House · Flat" : isCoLiving ? "Co-Living" : "PG · Hostel"}
              <span style={{ color: T.line, margin: "0 8px" }}>·</span>
              <span>{pg.area || pg.city}</span>
            </div>

            <h1 style={S.heroTitle}>{pg.pg_name}</h1>

            <div style={S.heroAddr}>
              <MapPin size={15} strokeWidth={1.5} color={T.gold} />
              <span>{pg.address || `${pg.area}, ${pg.city}, ${pg.state || ""}`}</span>
            </div>

            <div style={S.heroBadges}>
              {!isToLet && !isCoLiving && pg.pg_type && (
                <span style={S.badge}>
                  {pg.pg_type === "boys" ? "Boys" : pg.pg_type === "girls" ? "Girls" : pg.pg_type === "coliving" ? "Co-Living" : "Mixed"}
                </span>
              )}
              {isToLet && pg.bhk_type && <span style={S.badge}>{pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}</span>}
              {!isToLet && pg.available_rooms !== undefined && (
                <span style={{ ...S.badge, ...(pg.available_rooms > 0 ? S.badgeOk : S.badgeWarn) }}>
                  {pg.available_rooms > 0 ? `${pg.available_rooms} available` : "Fully occupied"}
                </span>
              )}
              {isToLet && pg.ready_to_move && <span style={{ ...S.badge, ...S.badgeOk }}>Ready to move</span>}
              <span style={{ ...S.badge, ...S.badgeAccent }}>Zero brokerage</span>
            </div>

            {/* Price quick stat */}
            <div style={S.heroPriceRow}>
              <div>
                <div style={S.heroPriceLabel}>Starting from</div>
                <div style={S.heroPriceVal}>
                  {startingPrice ? <>{fmtINR(startingPrice)}<span style={S.heroPricePer}>/month</span></> : "On request"}
                </div>
              </div>
              {hasLocation && (
                <button style={S.btnGold}
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, "_blank")}>
                  <Navigation size={15} /> Directions
                </button>
              )}
            </div>
          </div>

          {/* Right: gallery */}
          <div style={S.heroRight}>
            {media.length > 0 ? (
              <div style={S.galleryStack}>
                <div style={S.galleryMain} onClick={() => setGalleryOpen(true)}>
                  {current.type === "photo" ? (
                    <img src={current.src} alt={pg.pg_name} style={S.galleryMainImg}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/1200x800?text=No+Image"; }} />
                  ) : (
                    <video src={current.src} controls style={S.galleryMainImg} />
                  )}
                  <div style={S.galleryFrame} />
                  <div style={S.galleryCounter}>
                    <span style={{ color: T.gold }}>{String(index + 1).padStart(2, "0")}</span>
                    <span style={{ color: T.inkMute, margin: "0 6px" }}>/</span>
                    <span>{String(media.length).padStart(2, "0")}</span>
                  </div>
                  {media.length > 1 && (
                    <>
                      <button style={{ ...S.galleryNav, left: 14 }} onClick={(e) => { e.stopPropagation(); setIndex(i => i === 0 ? media.length - 1 : i - 1); }}>
                        <ChevronLeft size={16} />
                      </button>
                      <button style={{ ...S.galleryNav, right: 14 }} onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % media.length); }}>
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
                {media.length > 1 && (
                  <div style={S.galleryThumbs}>
                    {media.slice(0, 4).map((m, i) => (
                      <div key={i} onClick={() => setIndex(i)} style={{
                        ...S.galleryThumb,
                        outline: i === index ? `1.5px solid ${T.gold}` : `1px solid ${T.line}`,
                        outlineOffset: i === index ? 2 : 0,
                      }}>
                        {m.type === "photo"
                          ? <img src={m.src} alt="" style={S.galleryThumbImg} />
                          : <div style={{ ...S.galleryThumbImg, background: T.bgElev, color: T.gold, display: "grid", placeItems: "center" }}>▶</div>}
                        {i === 3 && media.length > 4 && <div style={S.galleryMore}>+{media.length - 4}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={S.galleryEmpty}>📷 No photos available</div>
            )}
          </div>
        </section>

        {/* ===== Content grid ===== */}
        <section style={isMobile ? S.gridMobile : S.grid}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {pg.description && (
              <Panel title="About this place" eyebrow="01 · Overview">
                <p style={S.body}>{pg.description}</p>
              </Panel>
            )}

            {/* Quick stats bento */}
            <div style={S.bentoRow}>
              {pg.total_rooms > 0 && <BentoStat label="Total rooms" value={pg.total_rooms} />}
              {pg.available_rooms !== undefined && <BentoStat label="Available" value={pg.available_rooms} accent={pg.available_rooms > 0 ? T.emerald : T.danger} />}
              {pg.sqft_area && <BentoStat label="Built-up" value={`${pg.sqft_area} sqft`} />}
              {pg.floor && <BentoStat label="Floor" value={pg.floor} />}
            </div>

            {facilities.length > 0 && (
              <Panel title="What this place offers" eyebrow={`02 · ${facilities.length} amenities`}>
                <div style={S.amenityGroups}>
                  {Object.entries(facGrouped).map(([group, items]) => (
                    <div key={group} style={S.amenityGroup}>
                      <div style={S.amenityGroupTitle}>{group}</div>
                      <div style={S.amenityList}>
                        {items.map((f, i) => (
                          <div key={i} style={S.amenityRow}>
                            <span style={S.amenityDot}><Check size={11} strokeWidth={3} /></span>
                            <span>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {pg.water_type && (
                  <div style={S.note}>
                    <span style={{ color: T.gold, fontWeight: 600, marginRight: 6 }}>◆</span>
                    <span style={{ fontWeight: 600, color: T.ink }}>Water source · </span>
                    {{ borewell: "Borewell", kaveri: "Kaveri", both: "Borewell + Kaveri", municipal: "Municipal" }[pg.water_type] || pg.water_type}
                  </div>
                )}
              </Panel>
            )}

            <PricePanel pg={pg} isToLet={isToLet} isCoLiving={isCoLiving} isPG={isPG} />

            {hasLocation && (
              <Panel title="Where you'll be" eyebrow="04 · Location" id="location-map">
                <div style={S.mapWrap}>
                  <MapContainer center={mapCenter} zoom={mapZoom}
                    style={{ height: 420, width: "100%" }}
                    key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" attribution='© OpenStreetMap, © CARTO' />
                    <Marker position={[pg.latitude, pg.longitude]}>
                      <Popup><strong>{pg.pg_name}</strong><br /><small>{pg.address || pg.area}</small></Popup>
                    </Marker>
                  </MapContainer>
                  <div style={S.mapOverlay} />
                </div>
                <div style={S.locGrid}>
                  {pg.area && <LocItem label="Area" value={pg.area} />}
                  {pg.road && <LocItem label="Road" value={pg.road} />}
                  {pg.landmark && <LocItem label="Landmark" value={pg.landmark} />}
                  {pg.city && <LocItem label="City" value={pg.city} />}
                </div>
              </Panel>
            )}

            {hasLocation && (nearbyHighlights.length > 0 || loadingHighlights) && (
              <Panel title="What's around you" eyebrow={`05 · ${loadingHighlights ? "Loading…" : `${nearbyHighlights.length} places`}`}>
                {loadingHighlights ? (
                  <div style={{ padding: 40, textAlign: "center", color: T.inkMute }}>Finding nearby places…</div>
                ) : (
                  <>
                    <div style={S.chipRow}>
                      {highlightCategories.map(c => {
                        const count = c.id === "all" ? nearbyHighlights.length : nearbyHighlights.filter(h => h.category === c.id).length;
                        if (count === 0) return null;
                        const active = selectedHighlightCategory === c.id;
                        return (
                          <button key={c.id} onClick={() => setSelectedHighlightCategory(c.id)}
                            style={{ ...S.chip, ...(active ? S.chipActive : {}) }}>
                            <span>{c.icon}</span><span>{c.label}</span><span style={S.chipCount}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={S.nearbyList}>
                      {(selectedHighlightCategory === "all" ? nearbyHighlights : nearbyHighlights.filter(h => h.category === selectedHighlightCategory))
                        .map((h, i) => (
                          <div key={i} style={S.nearbyRow} onClick={() => handleViewOnMap(h)}>
                            <span style={S.nearbyIcon}>{h.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={S.nearbyName}>{h.name}</div>
                              <div style={S.nearbyType}>{h.type.replace(/_/g, " ").replace("nearby ", "")}</div>
                            </div>
                            {h.coordinates && <ArrowUpRight size={15} color={T.gold} />}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </Panel>
            )}

            {(nearbyPGs.length > 0 || loadingNearbyPGs) && (
              <Panel title="More in this area" eyebrow={`06 · ${loadingNearbyPGs ? "Loading…" : `${nearbyPGs.length} properties`}`}>
                {loadingNearbyPGs ? (
                  <div style={{ padding: 40, textAlign: "center", color: T.inkMute }}>Finding nearby properties…</div>
                ) : (
                  <>
                    <div style={S.nearbyPGGrid}>
                      {nearbyPGs.map(np => <NearbyCard key={np.id} pg={np} onClick={() => handleViewNearbyPG(np.id)} />)}
                    </div>
                    <button style={S.btnGhost} onClick={() => handleViewNearbyPG("all")}>
                      View all in {nearbyPGs[0]?.area || nearbyPGs[0]?.city || "area"} <ArrowUpRight size={14} />
                    </button>
                  </>
                )}
              </Panel>
            )}
          </div>

          {!isMobile && (
            <aside style={S.aside}>
              <div style={S.stickyCard}>
                <div style={S.stickyTopBar}>
                  <span style={S.stickyTag}>◆ Verified</span>
                  <span style={{ color: T.inkMute, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>#{pg.id || "—"}</span>
                </div>

                {startingPrice ? (
                  <>
                    <div style={S.priceEyebrow}>Starting from</div>
                    <div style={S.priceLarge}>
                      {fmtINR(startingPrice)}
                      <span style={S.pricePer}>/month</span>
                    </div>
                  </>
                ) : (
                  <div style={S.priceLarge}>Price on request</div>
                )}

                <div style={S.stickyDivider} />

                <div style={S.stickyStats}>
                  {pg.total_rooms > 0 && (
                    <div style={S.stickyStat}>
                      <span style={S.stickyStatLabel}>Total rooms</span>
                      <span style={S.stickyStatValue}>{pg.total_rooms}</span>
                    </div>
                  )}
                  {pg.available_rooms !== undefined && (
                    <div style={S.stickyStat}>
                      <span style={S.stickyStatLabel}>Available</span>
                      <span style={{ ...S.stickyStatValue, color: pg.available_rooms > 0 ? T.emerald : T.danger }}>{pg.available_rooms}</span>
                    </div>
                  )}
                  {pg.sqft_area && (
                    <div style={S.stickyStat}>
                      <span style={S.stickyStatLabel}>Size</span>
                      <span style={S.stickyStatValue}>{pg.sqft_area} sqft</span>
                    </div>
                  )}
                </div>

                <button style={{ ...S.btnGold, width: "100%", marginTop: 22, justifyContent: "center", padding: "14px 22px" }}>
                  <Phone size={15} /> Contact owner
                </button>
                <button style={{ ...S.btnGhost, width: "100%", marginTop: 10, justifyContent: "center" }}>
                  <Calendar size={15} /> Schedule visit
                </button>

                <div style={S.trustRow}>
                  <Sparkles size={13} color={T.gold} />
                  <span>Zero brokerage · Direct owner</span>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Footer mark */}
        <footer style={S.footerMark}>
          <span style={{ color: T.gold }}>◆</span>
          <span>End of listing</span>
          <span style={{ color: T.gold }}>◆</span>
        </footer>

        {/* Mobile sticky bottom bar */}
        {isMobile && (
          <div style={S.mobileBottomBar}>
            <div>
              {startingPrice ? (
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
                  {fmtINR(startingPrice)}<span style={{ fontSize: 12, color: T.inkMute, marginLeft: 4, fontFamily: "'Inter Tight', sans-serif" }}>/mo</span>
                </div>
              ) : (
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: T.ink }}>Price on request</div>
              )}
            </div>
            <button style={{ ...S.btnGold, padding: "12px 22px" }}>
              <Phone size={15} /> Contact
            </button>
          </div>
        )}

        {showScrollTop && (
          <button
            style={S.scrollTopBtn}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ============ Subcomponents ============ */

const Panel = ({ title, eyebrow, children, id }) => (
  <section id={id} style={S.panel}>
    <header style={S.panelHeader}>
      <div>
        {eyebrow && <div style={S.panelEyebrow}>{eyebrow}</div>}
        <h2 style={S.panelTitle}>{title}</h2>
      </div>
      <div style={S.panelRule} />
    </header>
    <div>{children}</div>
  </section>
);

const IconBtn = ({ children, onClick, active }) => (
  <button onClick={onClick} style={{
    width: 40, height: 40, borderRadius: "50%",
    border: `1px solid ${active ? T.coral : T.line}`,
    background: T.bgSoft, cursor: "pointer",
    display: "grid", placeItems: "center", transition: "all .2s",
  }}>{children}</button>
);

const LocItem = ({ label, value }) => (
  <div style={S.locItem}>
    <span style={S.locLabel}>{label}</span>
    <span style={S.locValue}>{value}</span>
  </div>
);

const BentoStat = ({ label, value, accent }) => (
  <div style={S.bentoStat}>
    <div style={S.bentoStatLabel}>{label}</div>
    <div style={{ ...S.bentoStatValue, color: accent || T.ink }}>{value}</div>
  </div>
);

const PriceRow = ({ label, value, deposit }) => fmtINR(value) ? (
  <div style={S.priceRow}>
    <span style={S.priceRowLabel}>{label}</span>
    <div style={{ textAlign: "right" }}>
      <div style={S.priceRowValue}>{fmtINR(value)}<span style={S.priceRowPer}>/mo</span></div>
      {deposit && fmtINR(deposit) && <div style={S.priceRowDeposit}>Deposit: {fmtINR(deposit)}</div>}
    </div>
  </div>
) : null;

const PricePanel = ({ pg, isToLet, isCoLiving, isPG }) => {
  const hasAny = () => {
    const keys = isToLet ? ["price_1bhk","price_2bhk","price_3bhk","price_4bhk"]
      : isCoLiving ? ["co_living_single_room","co_living_double_room","coliving_three_sharing","coliving_four_sharing"]
      : ["single_sharing","double_sharing","triple_sharing","four_sharing","single_room","double_room","triple_room"];
    return keys.some(k => fmtINR(pg[k]));
  };
  if (!hasAny()) return null;

  return (
    <Panel title="Pricing" eyebrow="03 · From the owner">
      {isToLet && (
        <div style={S.priceGroup}>
          <PriceRow label="1 BHK" value={pg.price_1bhk} deposit={pg.security_deposit} />
          <PriceRow label="2 BHK" value={pg.price_2bhk} />
          <PriceRow label="3 BHK" value={pg.price_3bhk} />
          <PriceRow label="4 BHK" value={pg.price_4bhk} />
        </div>
      )}
      {isCoLiving && (
        <div style={S.priceGroup}>
          <PriceRow label="Single Room" value={pg.co_living_single_room} />
          <PriceRow label="Double Room" value={pg.co_living_double_room} />
          <PriceRow label="Triple Sharing" value={pg.coliving_three_sharing} />
          <PriceRow label="Quad Sharing" value={pg.coliving_four_sharing} />
        </div>
      )}
      {isPG && (
        <>
          {(pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing) && (
            <div style={S.priceSubBlock}>
              <div style={S.priceSubTitle}>Shared rooms</div>
              <div style={S.priceGroup}>
                <PriceRow label="Single sharing" value={pg.single_sharing} />
                <PriceRow label="Double sharing" value={pg.double_sharing} />
                <PriceRow label="Triple sharing" value={pg.triple_sharing} />
                <PriceRow label="Four sharing" value={pg.four_sharing} />
              </div>
            </div>
          )}
          {(pg.single_room || pg.double_room || pg.triple_room) && (
            <div style={S.priceSubBlock}>
              <div style={S.priceSubTitle}>Private rooms</div>
              <div style={S.priceGroup}>
                <PriceRow label="Single room" value={pg.single_room} />
                <PriceRow label="Double room" value={pg.double_room} />
                <PriceRow label="Triple room" value={pg.triple_room} />
              </div>
            </div>
          )}
          {pg.food_available && (
            <div style={S.foodBox}>
              <div style={S.foodTitle}>◆ Meals included</div>
              <div style={S.foodMeta}>
                {pg.food_type === "veg" ? "Vegetarian" : pg.food_type === "non-veg" ? "Non-vegetarian" : "Veg & Non-veg"}
                {pg.meals_per_day && ` · ${pg.meals_per_day} meals/day`}
                {fmtINR(pg.food_charges) && ` · ${fmtINR(pg.food_charges)}/mo`}
              </div>
            </div>
          )}
          {(fmtINR(pg.security_deposit) || fmtINR(pg.maintenance_charges) || pg.advance_rent) && (
            <div style={S.priceSubBlock}>
              <div style={S.priceSubTitle}>Additional charges</div>
              <div style={S.priceGroup}>
                {fmtINR(pg.security_deposit) && <PriceRow label="Security deposit" value={pg.security_deposit} />}
                {fmtINR(pg.maintenance_charges) && <PriceRow label="Maintenance" value={pg.maintenance_charges} />}
                {pg.advance_rent > 0 && (
                  <div style={S.priceRow}>
                    <span style={S.priceRowLabel}>Advance rent</span>
                    <span style={S.priceRowValue}>{pg.advance_rent} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
};

const NearbyCard = ({ pg, onClick }) => {
  const img = pg.photos?.[0] ? getCorrectImageUrl(pg.photos[0]) : null;
  const price = pg.single_sharing || pg.double_sharing || pg.price_1bhk || pg.co_living_single_room;
  return (
    <div style={S.npCard} onClick={onClick}>
      <div style={S.npImage}>
        {img ? <img src={img} alt={pg.pg_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: T.bgElev, display: "grid", placeItems: "center", fontSize: 36, color: T.gold }}>◇</div>}
        {pg.distance > 0 && <div style={S.npDist}>{pg.distance.toFixed(1)} km</div>}
        <div style={S.npImageFade} />
      </div>
      <div style={{ padding: 18 }}>
        <div style={S.npTitle}>{pg.pg_name}</div>
        <div style={S.npAddr}>
          <MapPin size={11} color={T.gold} /> {pg.area || pg.city}
        </div>
        {fmtINR(price) && (
          <div style={S.npPrice}>{fmtINR(price)}<span style={{ fontSize: 12, color: T.inkMute, fontWeight: 400, marginLeft: 3 }}>/mo</span></div>
        )}
      </div>
    </div>
  );
};

const BackgroundFX = () => (
  <div style={S.bgFx} aria-hidden>
    <div style={S.bgGlow1} />
    <div style={S.bgGlow2} />
    <div style={S.bgGrain} />
  </div>
);

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    body { background: ${T.bg}; margin: 0; }
    .leaflet-container { background: ${T.bgElev} !important; }
    .leaflet-popup-content-wrapper { background: ${T.bgElev} !important; color: ${T.ink} !important; border-radius: 8px !important; }
    .leaflet-popup-tip { background: ${T.bgElev} !important; }
    ::selection { background: ${T.gold}; color: ${T.bg}; }
    @keyframes float-glow {
      0%, 100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(30px,-20px) scale(1.05); }
    }
  `}</style>
);

/* ============ Styles ============ */
const S = {
  bgWrap: { position: "relative", minHeight: "100vh", background: T.bg, color: T.ink, overflow: "hidden" },
  bgFx: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 },
  bgGlow1: { position: "absolute", top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}18, transparent 60%)`, filter: "blur(80px)", animation: "float-glow 18s ease-in-out infinite" },
  bgGlow2: { position: "absolute", bottom: "-15%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${T.emerald}14, transparent 60%)`, filter: "blur(100px)", animation: "float-glow 22s ease-in-out infinite reverse" },
  bgGrain: { position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` },

  scrollBar: { position: "fixed", top: 0, left: 0, height: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.emerald})`, zIndex: 1000, transition: "width .1s linear" },

  page: { position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "20px 28px 100px", fontFamily: "'Inter Tight', -apple-system, sans-serif", color: T.ink },
  center: { position: "relative", zIndex: 1, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" },
  toast: { position: "fixed", top: 24, right: 24, zIndex: 100, background: T.bgElev, border: `1px solid ${T.gold}`, color: T.gold, padding: "12px 20px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, boxShadow: `0 20px 40px -10px ${T.gold}30` },

  topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${T.lineSoft}`, flexWrap: "wrap", gap: 16 },
  breadcrumb: { display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: T.inkMute, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" },
  crumb: { cursor: "pointer", color: T.inkSoft, transition: "color .2s" },
  crumbSep: { color: T.line },
  crumbCurrent: { color: T.gold },
  topActions: { display: "flex", gap: 10 },

  /* HERO editorial split */
  heroEditorial: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)", gap: 48, marginBottom: 64, alignItems: "stretch" },
  heroLeft: { display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 8 },
  heroEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontWeight: 500, marginBottom: 28, display: "flex", alignItems: "center", gap: 10 },
  heroEyebrowDot: { width: 6, height: 6, borderRadius: "50%", background: T.gold, boxShadow: `0 0 12px ${T.gold}` },
  heroTitle: { fontFamily: "'Fraunces', serif", fontSize: "clamp(40px, 6vw, 84px)", fontWeight: 300, lineHeight: 0.95, letterSpacing: "-0.035em", color: T.ink, margin: "0 0 28px", fontVariationSettings: '"opsz" 144' },
  heroAddr: { display: "inline-flex", alignItems: "flex-start", gap: 10, color: T.inkSoft, fontSize: 15, lineHeight: 1.5, marginBottom: 24, maxWidth: 460 },
  heroBadges: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 },
  heroPriceRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingTop: 28, borderTop: `1px solid ${T.lineSoft}`, flexWrap: "wrap" },
  heroPriceLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkMute, marginBottom: 8 },
  heroPriceVal: { fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 400, color: T.ink, letterSpacing: "-0.02em" },
  heroPricePer: { fontFamily: "'Inter Tight', sans-serif", fontSize: 13, fontWeight: 400, color: T.inkMute, marginLeft: 6 },

  heroRight: { minWidth: 0 },
  galleryStack: { display: "flex", flexDirection: "column", gap: 8 },
  galleryMain: { position: "relative", borderRadius: 18, overflow: "hidden", cursor: "pointer", background: T.bgElev, height: 480, border: `1px solid ${T.line}` },
  galleryMainImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  galleryFrame: { position: "absolute", inset: 8, border: `1px solid rgba(217,178,106,0.3)`, borderRadius: 12, pointerEvents: "none" },
  galleryThumbs: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, height: 90 },
  galleryThumb: { position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: T.bgElev, height: "100%" },
  galleryThumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  galleryMore: { position: "absolute", inset: 0, background: "rgba(11,12,14,0.78)", color: T.gold, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 500, fontFamily: "'Fraunces', serif" },
  galleryNav: { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", border: `1px solid ${T.line}`, background: T.bgGlass, color: T.ink, cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transition: "all .2s" },
  galleryCounter: { position: "absolute", bottom: 18, left: 18, background: T.bgGlass, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${T.line}`, color: T.ink, padding: "6px 14px", borderRadius: 999, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, letterSpacing: "0.08em" },
  galleryEmpty: { height: 480, borderRadius: 18, background: T.bgElev, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", color: T.inkMute, fontSize: 14 },

  badge: { padding: "6px 13px", borderRadius: 999, background: T.bgSoft, border: `1px solid ${T.line}`, color: T.inkSoft, fontSize: 12, fontWeight: 500, letterSpacing: "0.01em" },
  badgeOk: { background: T.emeraldSoft, border: `1px solid ${T.emerald}50`, color: T.emerald, fontWeight: 600 },
  badgeWarn: { background: `${T.danger}15`, border: `1px solid ${T.danger}50`, color: T.danger, fontWeight: 600 },
  badgeAccent: { background: T.goldSoft, border: `1px solid ${T.gold}`, color: T.gold, fontWeight: 600 },

  btnGold: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: T.gold, color: T.bg, border: "none", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", letterSpacing: "0.01em" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "transparent", color: T.ink, border: `1px solid ${T.line}`, borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" },

  grid: { display: "grid", gridTemplateColumns: "1fr 400px", gap: 56, alignItems: "start" },
  gridMobile: { display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "start" },

  panel: { paddingBottom: 8, position: "relative" },
  panelHeader: { marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 20, borderBottom: `1px solid ${T.lineSoft}` },
  panelEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontWeight: 500, marginBottom: 12 },
  panelTitle: { fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 300, margin: 0, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 },
  panelRule: { flex: "0 0 60px", height: 1, background: `linear-gradient(90deg, ${T.gold}, transparent)`, marginBottom: 8 },

  body: { fontSize: 16, lineHeight: 1.8, color: T.inkSoft, margin: 0, fontWeight: 300 },

  /* Bento stats */
  bentoRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  bentoStat: { background: T.bgSoft, border: `1px solid ${T.line}`, borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 },
  bentoStatLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkMute },
  bentoStatValue: { fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 400, color: T.ink, letterSpacing: "-0.01em" },

  amenityGroups: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 36 },
  amenityGroup: {},
  amenityGroupTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontWeight: 500, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.lineSoft}` },
  amenityList: { display: "flex", flexDirection: "column", gap: 12 },
  amenityRow: { display: "flex", alignItems: "center", gap: 12, fontSize: 14.5, color: T.inkSoft, fontWeight: 400 },
  amenityDot: { width: 20, height: 20, borderRadius: "50%", background: T.emeraldSoft, color: T.emerald, display: "grid", placeItems: "center", flexShrink: 0, border: `1px solid ${T.emerald}40` },
  note: { marginTop: 28, padding: "14px 18px", borderRadius: 12, background: T.goldSoft, border: `1px solid ${T.gold}30`, fontSize: 13.5, color: T.inkSoft, display: "flex", alignItems: "center", flexWrap: "wrap" },

  priceGroup: { display: "flex", flexDirection: "column", gap: 0 },
  priceSubBlock: { marginBottom: 32 },
  priceSubTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.gold, fontWeight: 500, marginBottom: 14 },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: `1px solid ${T.lineSoft}` },
  priceRowLabel: { fontSize: 15, color: T.inkSoft },
  priceRowValue: { fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, color: T.ink, letterSpacing: "-0.01em" },
  priceRowPer: { fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 400, color: T.inkMute, marginLeft: 4 },
  priceRowDeposit: { fontSize: 12, color: T.coral, marginTop: 3 },
  foodBox: { marginTop: 28, padding: 22, borderRadius: 16, background: T.emeraldSoft, border: `1px solid ${T.emerald}40` },
  foodTitle: { fontWeight: 600, color: T.emerald, fontSize: 13, marginBottom: 6, letterSpacing: "0.02em" },
  foodMeta: { fontSize: 13.5, color: T.inkSoft },

  mapWrap: { position: "relative", borderRadius: 18, overflow: "hidden", border: `1px solid ${T.line}` },
  mapOverlay: { position: "absolute", inset: 0, boxShadow: `inset 0 0 60px ${T.bg}80`, pointerEvents: "none", borderRadius: 18 },
  locGrid: { marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 24 },
  locItem: { display: "flex", flexDirection: "column", gap: 6 },
  locLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkMute, fontWeight: 500 },
  locValue: { fontSize: 14.5, color: T.ink, fontWeight: 400 },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  chip: { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, border: `1px solid ${T.line}`, background: T.bgSoft, color: T.inkSoft, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" },
  chipActive: { background: T.gold, color: T.bg, borderColor: T.gold },
  chipCount: { fontSize: 11, opacity: 0.65, fontFamily: "'JetBrains Mono', monospace" },
  nearbyList: { display: "flex", flexDirection: "column", maxHeight: 480, overflowY: "auto", paddingRight: 4 },
  nearbyRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 8px", borderBottom: `1px solid ${T.lineSoft}`, cursor: "pointer", transition: "all .15s", borderRadius: 4 },
  nearbyIcon: { width: 42, height: 42, borderRadius: 12, background: T.bgSoft, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 },
  nearbyName: { fontSize: 14.5, fontWeight: 500, color: T.ink, marginBottom: 3 },
  nearbyType: { fontSize: 12, color: T.inkMute, textTransform: "capitalize", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.03em" },

  nearbyPGGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 20 },
  npCard: { border: `1px solid ${T.line}`, borderRadius: 18, overflow: "hidden", background: T.bgSoft, cursor: "pointer", transition: "all .25s" },
  npImage: { position: "relative", height: 160, overflow: "hidden" },
  npImageFade: { position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 50%, ${T.bgSoft})`, pointerEvents: "none" },
  npDist: { position: "absolute", top: 12, right: 12, background: T.bgGlass, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: `1px solid ${T.line}`, color: T.gold, padding: "5px 11px", borderRadius: 999, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, zIndex: 1 },
  npTitle: { fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6, fontFamily: "'Fraunces', serif", letterSpacing: "-0.01em" },
  npAddr: { fontSize: 12, color: T.inkMute, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 },
  npPrice: { fontSize: 18, fontWeight: 500, color: T.gold, fontFamily: "'Fraunces', serif", letterSpacing: "-0.01em" },

  aside: { position: "sticky", top: 24, alignSelf: "start" },
  stickyCard: { background: T.bgGlass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${T.line}`, borderRadius: 24, padding: 28, boxShadow: `0 24px 60px -20px ${T.bg}, 0 0 0 1px ${T.gold}10` },
  stickyTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${T.lineSoft}` },
  stickyTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.gold, fontWeight: 500 },
  priceEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkMute, fontWeight: 500, marginBottom: 10 },
  priceLarge: { fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 400, color: T.ink, lineHeight: 1, letterSpacing: "-0.025em" },
  pricePer: { fontFamily: "'Inter Tight', sans-serif", fontSize: 14, fontWeight: 400, color: T.inkMute, marginLeft: 6 },
  stickyDivider: { height: 1, background: T.lineSoft, margin: "24px 0" },
  stickyStats: { display: "flex", flexDirection: "column", gap: 14 },
  stickyStat: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  stickyStatLabel: { fontSize: 13.5, color: T.inkMute },
  stickyStatValue: { fontSize: 15, fontWeight: 600, color: T.ink, fontFamily: "'JetBrains Mono', monospace" },
  trustRow: { marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", fontSize: 12, color: T.inkMute },

  footerMark: { marginTop: 64, paddingTop: 32, borderTop: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: T.inkMute },

  mobileBottomBar: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: T.bgGlass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${T.line}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },

  scrollTopBtn: { position: "fixed", bottom: 90, right: 24, zIndex: 90, width: 46, height: 46, borderRadius: "50%", border: `1px solid ${T.gold}50`, background: T.bgGlass, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: T.gold, cursor: "pointer", display: "grid", placeItems: "center", boxShadow: `0 12px 30px ${T.bg}, 0 0 30px ${T.gold}30`, transition: "all .25s" },
};
