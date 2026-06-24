import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";
import {
  X, MapPin, Navigation, ChevronLeft, ChevronRight, Check, Info,
  Share2, Heart, ArrowUpRight, Phone, Sparkles, ArrowUp
} from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const T = {
  paper: "#FDF6F0", paperDeep: "#F5EDE5", surface: "#FFFFFF",
  ink: "#14181A", inkSoft: "#3E4544", inkMute: "#7A8280",
  line: "#E5DCD1", emerald: "#0F4C3A", emeraldSoft: "#E8F0E8",
  tan: "#B8956A", coral: "#C7522A", danger: "#B23A48", success: "#0F4C3A",
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

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = (e) => setIsMobile(e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
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
      <div style={S.center}>
        <Fonts />
        <div className="pulse-dot" />
        <p style={{ marginTop: 16, color: T.inkMute, fontFamily: "'Inter Tight', sans-serif", fontSize: 14 }}>Loading property…</p>
        <style>{`.pulse-dot{width:12px;height:12px;background:${T.emerald};border-radius:50%;animation:pulse 1.4s infinite ease}@keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.6);opacity:1}}`}</style>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={S.center}>
        <Fonts />
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: T.ink, margin: 0 }}>Property not found</h2>
        <p style={{ color: T.inkMute, marginTop: 8, fontFamily: "'Inter Tight', sans-serif" }}>{error || "This listing may have been removed."}</p>
        <button style={S.btnGhost} onClick={() => navigate("/")}>← Back home</button>
      </div>
    );
  }

  const current = media[index];
  const startingPrice = getStartingPrice();

  return (
    <div style={S.page}>
      <Fonts />

      {notification && <div style={S.toast}><Check size={16} /> {notification}</div>}

      <nav style={S.breadcrumb}>
        <span onClick={() => navigate("/")} style={S.crumb}>Home</span>
        <span style={S.crumbSep}>—</span>
        <span onClick={() => navigate("/properties")} style={S.crumb}>Properties</span>
        <span style={S.crumbSep}>—</span>
        <span style={S.crumbCurrent}>{pg.pg_name}</span>
      </nav>

      {/* ===== Gallery (same compact layout on all screens) ===== */}
      <section style={S.hero}>
        {media.length > 0 ? (
          <div style={S.galleryGrid}>
            <div style={S.galleryMain} onClick={() => setGalleryOpen(true)}>
              {current.type === "photo" ? (
                <img src={current.src} alt={pg.pg_name} style={S.galleryMainImg}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/1200x800?text=No+Image"; }} />
              ) : (
                <video src={current.src} controls style={S.galleryMainImg} />
              )}
              <div style={S.galleryCounter}>{index + 1} / {media.length}</div>
              {media.length > 1 && (
                <>
                  <button style={{ ...S.galleryNav, left: 16 }} onClick={(e) => { e.stopPropagation(); setIndex(i => i === 0 ? media.length - 1 : i - 1); }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button style={{ ...S.galleryNav, right: 16 }} onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % media.length); }}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {media.length > 1 && (
              <div style={S.galleryThumbs}>
                {media.slice(0, 4).map((m, i) => (
                  <div key={i} onClick={() => setIndex(i)} style={{
                    ...S.galleryThumb,
                    outline: i === index ? `2px solid ${T.emerald}` : "none",
                    outlineOffset: i === index ? 2 : 0,
                  }}>
                    {m.type === "photo"
                      ? <img src={m.src} alt="" style={S.galleryThumbImg} />
                      : <div style={{ ...S.galleryThumbImg, background: T.ink, color: "#fff", display: "grid", placeItems: "center" }}>▶</div>}
                    {i === 3 && media.length > 4 && <div style={S.galleryMore}>+{media.length - 4}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={S.galleryEmpty}>📷 No photos available</div>
        )}
      </section>

      {/* ===== Title block ===== */}
      <section style={S.titleBlock}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.eyebrow}>
            {isToLet ? "House · Flat" : isCoLiving ? "Co-Living" : "PG · Hostel"}
            <span style={S.eyebrowDot}>·</span>
            <span>{pg.area || pg.city}</span>
          </div>
          <h1 style={S.title}>{pg.pg_name}</h1>
          
          {pg.landmark && (
            <div style={S.landmarkBox}>
              <span style={S.landmarkLabel}>Nearby</span>
              <span style={S.landmarkText}>{pg.landmark}</span>
            </div>
          )}

          <div style={S.badges}>
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
        </div>

        <div style={S.titleActions}>
          <IconBtn onClick={() => setFavorited(f => !f)} active={favorited}>
            <Heart size={18} fill={favorited ? T.coral : "none"} color={favorited ? T.coral : T.ink} />
          </IconBtn>
          <IconBtn><Share2 size={18} color={T.ink} /></IconBtn>
          {hasLocation && (
            <button style={S.btnPrimary}
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, "_blank")}>
              <Navigation size={16} /> Directions
            </button>
          )}
        </div>
      </section>

      <section style={isMobile ? S.gridMobile : S.grid}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {pg.description && (
            <Panel title="About this place" eyebrow="Overview">
              <p style={S.body}>{pg.description}</p>
            </Panel>
          )}

          {facilities.length > 0 && (
            <Panel title="What this place offers" eyebrow={`${facilities.length} amenities`}>
              <div style={S.amenityGroups}>
                {Object.entries(facGrouped).map(([group, items]) => (
                  <div key={group} style={S.amenityGroup}>
                    <div style={S.amenityGroupTitle}>{group}</div>
                    <div style={S.amenityList}>
                      {items.map((f, i) => (
                        <div key={i} style={S.amenityRow}>
                          <span style={S.amenityDot}><Check size={12} strokeWidth={2.5} /></span>
                          <span>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {pg.water_type && (
                <div style={S.note}>
                  <span style={{ fontWeight: 600 }}>Water source · </span>
                  {{ borewell: "Borewell", kaveri: "Kaveri", both: "Borewell + Kaveri", municipal: "Municipal" }[pg.water_type] || pg.water_type}
                </div>
              )}
            </Panel>
          )}

          <PricePanel pg={pg} isToLet={isToLet} isCoLiving={isCoLiving} isPG={isPG} />

          {hasLocation && (
            <Panel title="Where you'll be" eyebrow="Location" id="location-map">
              <div style={S.mapWrap}>
                <MapContainer center={mapCenter} zoom={mapZoom}
                  style={{ height: 380, width: "100%", borderRadius: 16 }}
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution='© OpenStreetMap, © CARTO' />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup><strong>{pg.pg_name}</strong><br /><small>{pg.area || pg.city}</small></Popup>
                  </Marker>
                </MapContainer>
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
            <Panel title="What's around you" eyebrow={loadingHighlights ? "Loading…" : `${nearbyHighlights.length} places`}>
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
                          {h.coordinates && <ArrowUpRight size={16} color={T.inkMute} />}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </Panel>
          )}

          {(nearbyPGs.length > 0 || loadingNearbyPGs) && (
            <Panel title="More in this area" eyebrow={loadingNearbyPGs ? "Loading…" : `${nearbyPGs.length} properties`}>
              {loadingNearbyPGs ? (
                <div style={{ padding: 40, textAlign: "center", color: T.inkMute }}>Finding nearby properties…</div>
              ) : (
                <>
                  <div style={S.nearbyPGGrid}>
                    {nearbyPGs.map(np => <NearbyCard key={np.id} pg={np} onClick={() => handleViewNearbyPG(np.id)} />)}
                  </div>
                  <button style={S.btnGhost} onClick={() => handleViewNearbyPG("all")}>
                    View all in {nearbyPGs[0]?.area || nearbyPGs[0]?.city || "area"} →
                  </button>
                </>
              )}
            </Panel>
          )}
        </div>

        {!isMobile && (
          <aside style={S.aside}>
            <div style={S.stickyCard}>
              {startingPrice ? (
                <>
                  <div style={S.priceEyebrow}>Starting from</div>
                  <div style={S.priceLarge}>{fmtINR(startingPrice)}<span style={S.pricePer}>/month</span></div>
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

              <button style={{ ...S.btnPrimary, width: "100%", marginTop: 20, justifyContent: "center" }}>
                <Phone size={16} /> Contact owner
              </button>
              <button style={{ ...S.btnGhost, width: "100%", marginTop: 10 }}>Schedule a visit</button>

              <div style={S.trustRow}>
                <Sparkles size={14} color={T.tan} />
                <span>Verified listing · Zero brokerage</span>
              </div>
            </div>
          </aside>
        )}
      </section>

      {/* Mobile sticky bottom bar */}
      {isMobile && (
        <div style={S.mobileBottomBar}>
          <div>
            {startingPrice ? (
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: T.ink }}>
                {fmtINR(startingPrice)}<span style={{ fontSize: 12, color: T.inkMute, marginLeft: 4 }}>/mo</span>
              </div>
            ) : (
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: T.ink }}>Price on request</div>
            )}
          </div>
          <button style={{ ...S.btnPrimary, padding: "10px 20px" }}>
            <Phone size={16} /> Contact
          </button>
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          style={S.scrollTopBtn}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}

const Panel = ({ title, eyebrow, children, id }) => (
  <section id={id} style={S.panel}>
    <header style={S.panelHeader}>
      <div>
        {eyebrow && <div style={S.panelEyebrow}>{eyebrow}</div>}
        <h2 style={S.panelTitle}>{title}</h2>
      </div>
    </header>
    <div>{children}</div>
  </section>
);

const IconBtn = ({ children, onClick, active }) => (
  <button onClick={onClick} style={{
    width: 44, height: 44, borderRadius: "50%",
    border: `1px solid ${active ? T.coral : T.line}`,
    background: T.surface, cursor: "pointer",
    display: "grid", placeItems: "center", transition: "all .2s",
  }}>{children}</button>
);

const LocItem = ({ label, value }) => (
  <div style={S.locItem}>
    <span style={S.locLabel}>{label}</span>
    <span style={S.locValue}>{value}</span>
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
    <Panel title="Pricing" eyebrow="From the owner">
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
              <div style={S.foodTitle}>Meals included</div>
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
          : <div style={{ width: "100%", height: "100%", background: T.paperDeep, display: "grid", placeItems: "center", fontSize: 36 }}>🏠</div>}
        {pg.distance > 0 && <div style={S.npDist}>{pg.distance.toFixed(1)} km</div>}
      </div>
      <div style={{ padding: 16 }}>
        <div style={S.npTitle}>{pg.pg_name}</div>
        <div style={S.npAddr}>{pg.area || pg.city}</div>
        {fmtINR(price) && (
          <div style={S.npPrice}>{fmtINR(price)}<span style={{ fontSize: 12, color: T.inkMute, fontWeight: 400 }}>/mo</span></div>
        )}
      </div>
    </div>
  );
};

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    body { 
      background: ${T.paper};
      background-image: radial-gradient(ellipse at 50% 0%, rgba(253, 246, 240, 0.5) 0%, transparent 70%);
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    
    /* Smooth scrolling for better UX */
    html {
      scroll-behavior: smooth;
    }
    
    /* Subtle warm selection color */
    ::selection {
      background: rgba(184, 149, 106, 0.25);
      color: ${T.ink};
    }
    
    /* Warm scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${T.paperDeep};
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${T.tan};
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #A88558;
    }
    
    .pulse-dot {
      width: 12px;
      height: 12px;
      background: ${T.emerald};
      border-radius: 50%;
      animation: pulse 1.4s infinite ease;
      box-shadow: 0 0 20px rgba(15, 76, 58, 0.2);
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.6);
        opacity: 1;
      }
    }
  `}</style>
);

const S = {
  page: { 
    maxWidth: 1280, 
    margin: "0 auto", 
    padding: "24px 24px 80px", 
    background: T.paper,
    backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(253, 246, 240, 0.8) 0%, transparent 70%)",
    minHeight: "100vh", 
    fontFamily: "'Inter Tight', -apple-system, sans-serif", 
    color: T.ink 
  },
  center: { minHeight: "100vh", display: "grid", placeItems: "center", background: T.paper, padding: 24, textAlign: "center" },
  toast: { position: "fixed", top: 24, right: 24, zIndex: 100, background: T.ink, color: T.surface, padding: "12px 20px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" },

  breadcrumb: { display: "flex", gap: 12, alignItems: "center", fontSize: 13, color: T.inkMute, marginBottom: 20, flexWrap: "wrap" },
  crumb: { cursor: "pointer", color: T.inkSoft },
  crumbSep: { color: T.inkMute, opacity: 0.5 },
  crumbCurrent: { color: T.ink, fontWeight: 500 },

  /* ===== Gallery (compact on all screens) ===== */
  hero: { marginBottom: 28 },
  galleryGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 6, height: "auto" },
  galleryMain: { position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: T.paperDeep, height: 320 },
  galleryMainImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  galleryThumbs: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, height: 80 },
  galleryThumb: { position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer", background: T.paperDeep, height: "100%" },
  galleryThumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  galleryMore: { position: "absolute", inset: 0, background: "rgba(20,24,26,0.7)", color: "#fff", display: "grid", placeItems: "center", fontSize: 16, fontWeight: 600, fontFamily: "'Fraunces', serif" },
  galleryNav: { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.95)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" },
  galleryCounter: { position: "absolute", bottom: 14, left: 14, background: "rgba(20,24,26,0.8)", color: "#fff", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 },
  galleryEmpty: { height: 280, borderRadius: 14, background: T.paperDeep, display: "grid", placeItems: "center", color: T.inkMute, fontSize: 14 },

  titleBlock: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    gap: 24, 
    marginBottom: 40, 
    flexWrap: "wrap", 
    paddingBottom: 28, 
    borderBottom: `1px solid ${T.line}`,
    background: `linear-gradient(180deg, ${T.surface} 0%, transparent 100%)`,
    padding: "20px 24px",
    borderRadius: 16,
  },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.tan, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 },
  eyebrowDot: { color: T.line },
  title: { fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 14px" },
  
  landmarkBox: { display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 },
  landmarkLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.tan, fontWeight: 600, background: T.emeraldSoft, padding: "3px 8px", borderRadius: 6 },
  landmarkText: { color: T.inkMute, fontSize: 13 },
  
  badges: { display: "flex", flexWrap: "wrap", gap: 8 },
  badge: { 
    padding: "5px 12px", 
    borderRadius: 999, 
    background: T.surface, 
    border: `1px solid ${T.line}`, 
    color: T.inkSoft, 
    fontSize: 12, 
    fontWeight: 500,
    boxShadow: "0 1px 4px rgba(184, 149, 106, 0.05)",
  },
  badgeOk: { background: T.emeraldSoft, border: `1px solid ${T.emerald}30`, color: T.emerald, fontWeight: 600 },
  badgeWarn: { background: "#FBE9E9", border: `1px solid ${T.danger}30`, color: T.danger, fontWeight: 600 },
  badgeAccent: { background: T.ink, border: `1px solid ${T.ink}`, color: T.surface, fontWeight: 600 },
  titleActions: { display: "flex", alignItems: "center", gap: 10 },

  btnPrimary: { 
    display: "inline-flex", 
    alignItems: "center", 
    gap: 8, 
    padding: "12px 22px", 
    background: T.ink, 
    color: T.surface, 
    border: "none", 
    borderRadius: 999, 
    fontSize: 14, 
    fontWeight: 500, 
    cursor: "pointer", 
    fontFamily: "inherit", 
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 12px rgba(20, 24, 26, 0.15)",
  },
  btnGhost: { 
    display: "inline-flex", 
    alignItems: "center", 
    gap: 8, 
    padding: "12px 22px", 
    background: "transparent", 
    color: T.ink, 
    border: `1px solid ${T.line}`, 
    borderRadius: 999, 
    fontSize: 14, 
    fontWeight: 500, 
    cursor: "pointer", 
    fontFamily: "inherit", 
    transition: "all .2s" 
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" },
  gridMobile: { display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "start" },

  panel: { 
    paddingBottom: 32, 
    borderBottom: `1px solid ${T.line}`,
    background: `linear-gradient(135deg, ${T.surface} 0%, ${T.paperDeep} 100%)`,
    padding: "24px 28px",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(184, 149, 106, 0.06)",
    marginBottom: 8,
  },
  panelHeader: { marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  panelEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.tan, fontWeight: 600, marginBottom: 8 },
  panelTitle: { fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, margin: 0, letterSpacing: "-0.01em", color: T.ink },

  body: { fontSize: 16, lineHeight: 1.7, color: T.inkSoft, margin: 0 },

  amenityGroups: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 32 },
  amenityGroup: {},
  amenityGroupTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkMute, fontWeight: 600, marginBottom: 14 },
  amenityList: { display: "flex", flexDirection: "column", gap: 12 },
  amenityRow: { display: "flex", alignItems: "center", gap: 12, fontSize: 14.5, color: T.inkSoft },
  amenityDot: { 
    width: 22, 
    height: 22, 
    borderRadius: "50%", 
    background: "#E8F0E8", 
    color: "#0F4C3A", 
    display: "grid", 
    placeItems: "center", 
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(15, 76, 58, 0.1)",
  },
  note: { 
    marginTop: 24, 
    padding: "14px 18px", 
    borderRadius: 12, 
    background: T.paperDeep,
    border: `1px solid ${T.line}`,
    fontSize: 13.5, 
    color: T.inkSoft,
  },

  priceGroup: { display: "flex", flexDirection: "column", gap: 0 },
  priceSubBlock: { marginBottom: 28 },
  priceSubTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkMute, fontWeight: 600, marginBottom: 12 },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${T.line}` },
  priceRowLabel: { fontSize: 15, color: T.inkSoft },
  priceRowValue: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: T.ink },
  priceRowPer: { fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: 400, color: T.inkMute, marginLeft: 4 },
  priceRowDeposit: { fontSize: 12, color: T.coral, marginTop: 2 },
  foodBox: { 
    marginTop: 24, 
    padding: 20, 
    borderRadius: 16, 
    background: "linear-gradient(135deg, #E8F0E8 0%, #F5EDE5 100%)",
    border: `1px solid rgba(15, 76, 58, 0.15)`,
    boxShadow: "0 2px 8px rgba(15, 76, 58, 0.05)",
  },
  foodTitle: { fontWeight: 600, color: T.emerald, fontSize: 14, marginBottom: 4 },
  foodMeta: { fontSize: 13.5, color: T.inkSoft },

  mapWrap: { borderRadius: 16, overflow: "hidden", border: `1px solid ${T.line}` },
  locGrid: { marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 },
  locItem: { display: "flex", flexDirection: "column", gap: 4 },
  locLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkMute, fontWeight: 600 },
  locValue: { fontSize: 14.5, color: T.ink, fontWeight: 500 },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: `1px solid ${T.line}`, background: T.surface, color: T.inkSoft, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" },
  chipActive: { background: T.ink, color: T.surface, borderColor: T.ink },
  chipCount: { fontSize: 11, opacity: 0.7, fontFamily: "'JetBrains Mono', monospace" },
  nearbyList: { display: "flex", flexDirection: "column", maxHeight: 480, overflowY: "auto" },
  nearbyRow: { display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", borderBottom: `1px solid ${T.line}`, cursor: "pointer", transition: "all .15s" },
  nearbyIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    background: T.paperDeep,
    border: `1px solid ${T.line}`,
    display: "grid", 
    placeItems: "center", 
    fontSize: 18, 
    flexShrink: 0,
  },
  nearbyName: { fontSize: 14.5, fontWeight: 500, color: T.ink, marginBottom: 2 },
  nearbyType: { fontSize: 12, color: T.inkMute, textTransform: "capitalize" },

  nearbyPGGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 16 },
  npCard: { border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden", background: T.surface, cursor: "pointer", transition: "all .2s" },
  npImage: { position: "relative", height: 140, overflow: "hidden" },
  npDist: { position: "absolute", top: 10, right: 10, background: "rgba(20,24,26,0.85)", color: "#fff", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 },
  npTitle: { fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 4, fontFamily: "'Fraunces', serif" },
  npAddr: { fontSize: 12, color: T.inkMute, marginBottom: 10 },
  npPrice: { fontSize: 16, fontWeight: 600, color: T.emerald, fontFamily: "'Fraunces', serif" },

  aside: { position: "sticky", top: 24, alignSelf: "start" },
  stickyCard: { 
    background: T.surface, 
    border: `1px solid ${T.line}`, 
    borderRadius: 24, 
    padding: 28, 
    boxShadow: "0 8px 32px rgba(184, 149, 106, 0.08)",
  },
  priceEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.tan, fontWeight: 600, marginBottom: 8 },
  priceLarge: { fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 500, color: T.ink, lineHeight: 1, letterSpacing: "-0.02em" },
  pricePer: { fontFamily: "'Inter Tight', sans-serif", fontSize: 14, fontWeight: 400, color: T.inkMute, marginLeft: 4 },
  stickyDivider: { height: 1, background: T.line, margin: "24px 0" },
  stickyStats: { display: "flex", flexDirection: "column", gap: 14 },
  stickyStat: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  stickyStatLabel: { fontSize: 13.5, color: T.inkMute },
  stickyStatValue: { fontSize: 15, fontWeight: 600, color: T.ink, fontFamily: "'JetBrains Mono', monospace" },
  trustRow: { marginTop: 20, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", fontSize: 12, color: T.inkMute },

  mobileBottomBar: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: T.surface, borderTop: `1px solid ${T.line}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" },

  scrollTopBtn: { 
    position: "fixed", 
    bottom: 24, 
    right: 24, 
    zIndex: 90, 
    width: 48, 
    height: 48, 
    borderRadius: "50%", 
    border: `1px solid ${T.line}`, 
    background: T.surface, 
    color: T.ink, 
    cursor: "pointer", 
    display: "grid", 
    placeItems: "center", 
    boxShadow: "0 8px 24px rgba(20,24,26,0.12)", 
    transition: "all .25s ease", 
    opacity: 0.95 
  },
};