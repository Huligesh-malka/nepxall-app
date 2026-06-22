// src/pages/PGListings.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, MapPin, Heart, Star, Wifi, Utensils, Snowflake, Shield, Car,
  SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpRight, Bed,
  Sparkles, Phone, Navigation, Filter, Check, BarChart3, Eye, Calendar,
  Loader2, Locate, Users, Home as HomeIcon,
} from "lucide-react";
import api from "../api/api";

const PAGE_SIZE = 12;
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

/* ---------- Data ---------- */
const POPULAR_AREAS = [
  { name: "Koramangala", count: 142 },
  { name: "HSR Layout", count: 98 },
  { name: "Indiranagar", count: 76 },
  { name: "BTM Layout", count: 88 },
  { name: "Jayanagar", count: 54 },
  { name: "Whitefield", count: 121 },
  { name: "Electronic City", count: 167 },
  { name: "Marathahalli", count: 64 },
];

const QUICK_FILTERS = [
  { id: "near", name: "Near me", icon: Navigation, type: "location" },
  { id: "veg", name: "Veg food", icon: Utensils, type: "food", value: "veg" },
  { id: "nonveg", name: "Non-veg", icon: Utensils, type: "food", value: "nonveg" },
  { id: "ac", name: "AC", icon: Snowflake, type: "amenity", field: "ac" },
  { id: "wifi", name: "WiFi", icon: Wifi, type: "amenity", field: "wifi" },
  { id: "parking", name: "Parking", icon: Car, type: "amenity", field: "parking" },
  { id: "food", name: "Meals", icon: Utensils, type: "amenity", field: "food" },
];

const SORT_OPTIONS = [
  { id: "", label: "Relevance" },
  { id: "low", label: "Price · Low to high" },
  { id: "high", label: "Price · High to low" },
  { id: "new", label: "Newest" },
  { id: "distance", label: "Nearest" },
];

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&auto=format&fit=crop&q=70";

/* ---------- Helpers ---------- */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const startingRent = (pg) =>
  [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.rent_amount]
    .filter((v) => Number(v) > 0)
    .sort((a, b) => a - b)[0] || pg.rent_amount || 0;

const imagesOf = (pg) => {
  const imgs = pg.images || pg.image_urls || pg.photos || [];
  const arr = Array.isArray(imgs) ? imgs : typeof imgs === "string" ? imgs.split(",") : [];
  const cleaned = arr.map((i) => (typeof i === "string" ? i.trim() : i?.url)).filter(Boolean);
  return cleaned.length ? cleaned : [FALLBACK_IMG];
};

/* =========================================================================
   MAIN
========================================================================= */
export default function PGListings() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  /* state */
  const [allPGs, setAllPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [locating, setLocating] = useState(false);

  const [activeArea, setActiveArea] = useState("");
  const [activeQuick, setActiveQuick] = useState(new Set());
  const [favorites, setFavorites] = useState(new Set());
  const [compare, setCompare] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    location: "",
    minBudget: 0,
    maxBudget: 50000,
    food: false,
    ac: false,
    wifi: false,
    parking: false,
    sort: "",
    nearMe: false,
    foodType: "",
  });

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  /* favorites */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pg_favorites") || "[]");
      setFavorites(new Set(saved));
    } catch {}
  }, []);
  const toggleFav = (id, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("pg_favorites", JSON.stringify([...next]));
      showToast(next.has(id) ? "Saved to favorites" : "Removed from favorites");
      return next;
    });
  };

  /* location */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return showToast("Location not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`
          );
          const d = await r.json();
          if (d.address) {
            setUserAddress(
              d.address.suburb || d.address.neighbourhood || d.address.city_district || ""
            );
          }
        } catch {}
        setFilters((p) => ({ ...p, nearMe: true, sort: "distance" }));
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocating(false);
      },
      () => {
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocating(false);
        showToast("Couldn't get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showToast]);

  useEffect(() => {
    if (!localStorage.getItem(LOCATION_AUTO_ASKED_KEY)) detectLocation();
  }, [detectLocation]);

  /* fetch */
  const processPG = (d) =>
    d.map((pg) => ({
      ...pg,
      rent_amount: Number(pg.rent_amount) || 0,
      single_sharing: Number(pg.single_sharing) || 0,
      double_sharing: Number(pg.double_sharing) || 0,
      triple_sharing: Number(pg.triple_sharing) || 0,
      four_sharing: Number(pg.four_sharing) || 0,
      security_deposit: Number(pg.security_deposit) || 0,
      available_rooms: Number(pg.available_rooms) || 0,
      food_available: !!pg.food_available,
      ac_available: !!pg.ac_available,
      wifi_available: !!pg.wifi_available,
      parking_available: !!pg.parking_available,
      is_verified: !!pg.is_verified,
    }));

  const loadPGs = async (pageToLoad = 1, more = false) => {
    try {
      more ? setLoadingMore(true) : setLoading(true);
      let url = `/pg/search/advanced?page=${pageToLoad}&limit=${PAGE_SIZE}`;
      const sortMap = { low: "price_low", high: "price_high", new: "newest", distance: "nearest" };
      url += `&sort_by=${sortMap[filters.sort] || "relevance"}`;
      if (filters.location) url += `&search=${encodeURIComponent(filters.location)}`;
      if (userLocation && filters.nearMe)
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
      if (filters.minBudget) url += `&min_price=${filters.minBudget}`;
      if (filters.maxBudget) url += `&max_price=${filters.maxBudget}`;
      if (filters.food) url += `&food=true`;
      if (filters.ac) url += `&ac=true`;
      if (filters.wifi) url += `&wifi=true`;
      if (filters.parking) url += `&parking=true`;
      if (filters.foodType) url += `&food_type=${filters.foodType}`;

      const res = await api.get(url);
      let data = res.data?.data || [];
      if (userLocation) {
        data = data.map((pg) =>
          pg.latitude && pg.longitude
            ? { ...pg, distance: getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude) }
            : pg
        );
      }
      const processed = processPG(data);
      setAllPGs((prev) => (more && pageToLoad > 1 ? [...prev, ...processed] : processed));
      setHasMore(res.data?.hasMore === true);
      setTotal(res.data?.total || processed.length);
      setPage(pageToLoad);
    } catch (e) {
      console.error(e);
      showToast("Couldn't load homes");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPGs(1, false);
    // eslint-disable-next-line
  }, [
    filters.location, filters.sort, filters.nearMe, userLocation,
    filters.minBudget, filters.maxBudget, filters.food, filters.ac,
    filters.wifi, filters.parking, filters.foodType,
  ]);

  /* quick filter toggle */
  const toggleQuick = (qf) => {
    setActiveQuick((prev) => {
      const next = new Set(prev);
      const on = !next.has(qf.id);
      on ? next.add(qf.id) : next.delete(qf.id);
      if (qf.type === "location") {
        setFilters((p) => ({ ...p, nearMe: on, sort: on ? "distance" : "" }));
        if (on) detectLocation();
      } else if (qf.type === "food") {
        setFilters((p) => ({ ...p, foodType: on ? qf.value : "" }));
      } else if (qf.type === "amenity") {
        setFilters((p) => ({ ...p, [qf.field]: on }));
      }
      return next;
    });
  };

  /* compare */
  const toggleCompare = (pg, e) => {
    e?.stopPropagation();
    setCompare((prev) => {
      if (prev.find((p) => p.id === pg.id)) return prev.filter((p) => p.id !== pg.id);
      if (prev.length >= 3) {
        showToast("Compare up to 3 homes");
        return prev;
      }
      return [...prev, pg];
    });
  };

  /* nav */
  const goToPG = (pg) => navigate(`/pg/${pg.id}`);
  const openBooking = (pg, e) => {
    e?.stopPropagation();
    if (!user) {
      showToast("Please sign in to book");
      navigate("/login");
      return;
    }
    setBookingPG(pg);
  };

  const spotlight = allPGs[0];
  const grid = useMemo(() => (spotlight ? allPGs.slice(1) : allPGs), [allPGs, spotlight]);

  /* ====================================================================== */
  return (
    <div className="np-root">
      <StyleTag />

      {/* NAV */}
      <header className="np-nav">
        <div className="np-nav-inner">
          <button className="np-brand" onClick={() => navigate("/")}>
            <span className="np-brand-dot">n</span>
            <span className="np-brand-name">nepxall</span>
          </button>
          <nav className="np-nav-links">
            <a href="#">Explore</a>
            <a href="#">Areas</a>
            <a href="#">List your PG</a>
            <a href="#">Help</a>
          </nav>
          <div className="np-nav-cta">
            {userAddress && (
              <span className="np-loc-chip">
                <MapPin size={12} /> {userAddress}
              </span>
            )}
            <button className="np-btn-ghost" onClick={() => navigate(user ? "/profile" : "/login")}>
              {user ? "Account" : "Sign in"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="np-hero">
        <div className="np-hero-grid">
          <div className="np-hero-left">
            <div className="np-eyebrow">
              <span className="np-dot" /> Bangalore · {total || "980"} verified homes
            </div>
            <h1 className="np-h1">
              A room of <em>your own</em>,<br />
              minus the hassle.
            </h1>
            <p className="np-lede">
              Hand-picked PG homes across Bangalore. Real photos, transparent rent, zero broker drama.
            </p>

            <div className="np-search">
              <div className="np-search-field">
                <MapPin size={16} className="np-search-icon" />
                <div className="np-search-text">
                  <span className="np-search-label">Where</span>
                  <input
                    placeholder="Area, landmark, college…"
                    value={filters.location}
                    onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="np-search-divider" />
              <div className="np-search-field np-search-field-sm">
                <Bed size={16} className="np-search-icon" />
                <div className="np-search-text">
                  <span className="np-search-label">Sharing</span>
                  <span className="np-search-value">Single · Twin</span>
                </div>
              </div>
              <button className="np-search-btn" onClick={() => loadPGs(1, false)}>
                <Search size={16} /> Find a home
              </button>
            </div>

            <div className="np-trust">
              <span><Shield size={13} /> Verified owners</span>
              <span><Sparkles size={13} /> No brokerage</span>
              <span><Star size={13} /> 4.8 avg rating</span>
            </div>
          </div>

          <div className="np-hero-collage">
            <div className="np-hero-photo">
              <img src={FALLBACK_IMG} alt="" />
            </div>
            <div className="np-hero-card">
              <div className="np-hero-card-label">Home-cooked meals</div>
              <div className="np-hero-card-value">3 times a day</div>
            </div>
            <div className="np-hero-pill">
              <span className="np-hero-pill-price">₹8.9k<small>/mo</small></span>
              <span className="np-hero-pill-label">starting rent</span>
            </div>
          </div>
        </div>
      </section>

      {/* AREAS */}
      <section className="np-areas">
        <div className="np-areas-head">
          <h2>Popular pockets</h2>
          <a href="#">All 42 areas →</a>
        </div>
        <div className="np-scroll">
          {POPULAR_AREAS.map((a, i) => {
            const on = activeArea === a.name;
            return (
              <button
                key={a.name}
                className={`np-area ${on ? "is-on" : ""}`}
                onClick={() => {
                  setActiveArea(on ? "" : a.name);
                  setFilters((p) => ({ ...p, location: on ? "" : a.name }));
                }}
              >
                <span className="np-area-num">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="np-area-name">{a.name}</span>
                  <span className="np-area-count">{a.count} homes</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* QUICK FILTERS */}
      <section className="np-quick">
        <div className="np-scroll np-scroll-pad">
          {QUICK_FILTERS.map((q) => {
            const on = activeQuick.has(q.id);
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => toggleQuick(q)}
                className={`np-chip ${on ? "is-on" : ""}`}
              >
                <Icon size={14} /> {q.name}
              </button>
            );
          })}
        </div>
        <div className="np-quick-right">
          <select
            className="np-select"
            value={filters.sort}
            onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button className="np-btn-outline" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </section>

      {/* SPOTLIGHT */}
      {spotlight && (
        <section className="np-spotlight">
          <div className="np-section-head">
            <span className="np-eyebrow np-eyebrow-clay">Editor's pick</span>
            <h2 className="np-h2">This week's spotlight</h2>
          </div>
          <article className="np-spot" onClick={() => goToPG(spotlight)}>
            <div className="np-spot-img">
              <img src={imagesOf(spotlight)[0]} alt={spotlight.pg_name} />
              <span className="np-spot-tag">Featured · 01</span>
            </div>
            <div className="np-spot-body">
              <div className="np-spot-meta">
                <span>{spotlight.location || spotlight.address}</span>
                <span className="np-rating">
                  <Star size={13} fill="currentColor" /> {spotlight.rating || "4.9"}
                  <small>({spotlight.review_count || 218})</small>
                </span>
              </div>
              <h3 className="np-spot-name">{spotlight.pg_name || spotlight.name}</h3>
              <p className="np-spot-desc">
                {spotlight.description?.slice(0, 160) ||
                  "A warm corner room with morning sun, a study desk built for late nights, and a balcony just big enough for one chai and one thought."}
              </p>
              <div className="np-tags">
                {spotlight.ac_available && <span className="np-chip-sm">AC</span>}
                {spotlight.food_available && <span className="np-chip-sm">3 meals</span>}
                {spotlight.wifi_available && <span className="np-chip-sm">WiFi</span>}
                {spotlight.parking_available && <span className="np-chip-sm">Parking</span>}
                <span className="np-chip-sm">Power backup</span>
              </div>
              <div className="np-spot-foot">
                <div>
                  <div className="np-tiny">Monthly rent</div>
                  <div className="np-price-lg">{inr(startingRent(spotlight))}</div>
                </div>
                <button className="np-btn-dark" onClick={(e) => { e.stopPropagation(); goToPG(spotlight); }}>
                  Visit room <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* GRID */}
      <section className="np-listings">
        <div className="np-section-head np-section-head-row">
          <h2 className="np-h2">
            Homes {filters.location ? <>in <em>{filters.location}</em></> : "for you"}
          </h2>
          <span className="np-muted">{total} matches</span>
        </div>

        {loading && allPGs.length === 0 ? (
          <div className="np-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="np-card np-skeleton" />
            ))}
          </div>
        ) : grid.length === 0 ? (
          <div className="np-empty">
            <HomeIcon size={32} />
            <h3>No homes match these filters</h3>
            <p>Try widening your budget or removing a filter.</p>
          </div>
        ) : (
          <div className="np-grid">
            {grid.map((pg) => (
              <PGCard
                key={pg.id}
                pg={pg}
                isFav={favorites.has(pg.id)}
                onFav={(e) => toggleFav(pg.id, e)}
                inCompare={!!compare.find((p) => p.id === pg.id)}
                onCompare={(e) => toggleCompare(pg, e)}
                onView={() => goToPG(pg)}
                onQuick={(e) => { e.stopPropagation(); setQuickView(pg); }}
                onBook={(e) => openBooking(pg, e)}
              />
            ))}
          </div>
        )}

        {hasMore && allPGs.length > 0 && (
          <div className="np-more">
            <button onClick={() => loadPGs(page + 1, true)} disabled={loadingMore} className="np-btn-outline-lg">
              {loadingMore ? <><Loader2 size={16} className="np-spin" /> Loading…</> : "Load more homes"}
            </button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="np-cta-wrap">
        <div className="np-cta">
          <div>
            <span className="np-eyebrow np-eyebrow-ember">For owners</span>
            <h2 className="np-h2-xl">
              List your PG.<br />We'll handle the <em>rest</em>.
            </h2>
            <p className="np-lede-dim">
              Professional photos, verified tenants, instant payments. Most owners get their first booking within 6 days.
            </p>
          </div>
          <div className="np-cta-actions">
            <button className="np-btn-cream">List your property <ArrowUpRight size={15} /></button>
            <button className="np-btn-ghost-dark"><Phone size={14} /> +91 80 4000 1234</button>
          </div>
        </div>
      </section>

      <footer className="np-footer">
        <span>© 2026 Nepxall · Made with care in Bangalore</span>
        <span><a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Contact</a></span>
      </footer>

      {/* Compare bar */}
      {compare.length > 0 && (
        <div className="np-compare-bar">
          <div className="np-compare-list">
            <BarChart3 size={16} />
            <span>{compare.length} selected to compare</span>
            <div className="np-compare-thumbs">
              {compare.map((p) => (
                <img key={p.id} src={imagesOf(p)[0]} alt="" />
              ))}
            </div>
          </div>
          <div className="np-compare-actions">
            <button className="np-btn-ghost-sm" onClick={() => setCompare([])}>Clear</button>
            <button className="np-btn-dark-sm" disabled={compare.length < 2}>
              Compare {compare.length}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {quickView && (
        <QuickViewModal
          pg={quickView}
          onClose={() => setQuickView(null)}
          onBook={() => { setBookingPG(quickView); setQuickView(null); }}
          onVisit={() => goToPG(quickView)}
        />
      )}
      {bookingPG && (
        <BookingModal
          pg={bookingPG}
          user={user}
          onClose={() => setBookingPG(null)}
          onDone={() => { setBookingPG(null); showToast("Booking request sent!"); }}
          onAuth={() => navigate("/register")}
        />
      )}
      {showFilters && (
        <FiltersDrawer
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
          onReset={() =>
            setFilters({
              location: "", minBudget: 0, maxBudget: 50000, food: false,
              ac: false, wifi: false, parking: false, sort: "", nearMe: false, foodType: "",
            })
          }
        />
      )}

      {toast && <div className="np-toast">{toast}</div>}
    </div>
  );
}

/* =========================================================================
   PG CARD
========================================================================= */
function PGCard({ pg, isFav, onFav, inCompare, onCompare, onView, onQuick, onBook }) {
  const imgs = imagesOf(pg);
  const [i, setI] = useState(0);
  const next = (e) => { e.stopPropagation(); setI((p) => (p + 1) % imgs.length); };
  const prev = (e) => { e.stopPropagation(); setI((p) => (p - 1 + imgs.length) % imgs.length); };

  return (
    <article className="np-card" onClick={onView}>
      <div className="np-card-img">
        <img src={imgs[i]} alt={pg.pg_name} loading="lazy" />
        {imgs.length > 1 && (
          <>
            <button className="np-img-nav np-img-nav-l" onClick={prev}><ChevronLeft size={16} /></button>
            <button className="np-img-nav np-img-nav-r" onClick={next}><ChevronRight size={16} /></button>
            <div className="np-img-dots">
              {imgs.slice(0, 5).map((_, k) => (
                <span key={k} className={k === i ? "is-on" : ""} />
              ))}
            </div>
          </>
        )}
        <button className={`np-fav ${isFav ? "is-on" : ""}`} onClick={onFav}>
          <Heart size={15} fill={isFav ? "currentColor" : "none"} />
        </button>
        <div className="np-card-tags-top">
          {pg.is_verified && <span className="np-badge"><Check size={11} /> Verified</span>}
          {pg.distance && <span className="np-badge np-badge-dark">{pg.distance.toFixed(1)} km</span>}
        </div>
        <div className="np-card-tags-bot">
          <span className="np-badge np-badge-dark">{pg.gender_preference || "Co-living"}</span>
        </div>
      </div>
      <div className="np-card-body">
        <div className="np-card-top">
          <div>
            <h3>{pg.pg_name || pg.name}</h3>
            <div className="np-card-loc"><MapPin size={11} /> {pg.location || pg.address || "Bangalore"}</div>
          </div>
          <span className="np-rating-sm">
            <Star size={11} fill="currentColor" /> {pg.rating || "4.7"}
          </span>
        </div>
        <div className="np-card-amen">
          {pg.ac_available && <span><Snowflake size={11} /> AC</span>}
          {pg.food_available && <span><Utensils size={11} /> Meals</span>}
          {pg.wifi_available && <span><Wifi size={11} /> WiFi</span>}
          {pg.parking_available && <span><Car size={11} /> Parking</span>}
        </div>
        <div className="np-card-foot">
          <div>
            <div className="np-tiny">{pg.available_rooms ? `${pg.available_rooms} rooms left` : "Available"}</div>
            <div className="np-price">{inr(startingRent(pg))}<small>/mo</small></div>
          </div>
          <div className="np-card-actions">
            <button className={`np-icon-btn ${inCompare ? "is-on" : ""}`} onClick={onCompare} title="Compare">
              <BarChart3 size={14} />
            </button>
            <button className="np-icon-btn" onClick={onQuick} title="Quick view">
              <Eye size={14} />
            </button>
            <button className="np-btn-dark-sm" onClick={onBook}>Book</button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================================
   QUICK VIEW
========================================================================= */
function QuickViewModal({ pg, onClose, onBook, onVisit }) {
  const imgs = imagesOf(pg);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % imgs.length), 3000);
    return () => clearInterval(t);
  }, [imgs.length]);
  return (
    <div className="np-modal" onClick={onClose}>
      <div className="np-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="np-modal-x" onClick={onClose}><X size={18} /></button>
        <div className="np-qv">
          <div className="np-qv-img"><img src={imgs[i]} alt="" /></div>
          <div className="np-qv-body">
            <span className="np-tiny">{pg.location || pg.address}</span>
            <h2 className="np-h2">{pg.pg_name}</h2>
            <p className="np-muted">{pg.description?.slice(0, 220) || "A thoughtfully designed PG home."}</p>
            <div className="np-tags">
              {pg.ac_available && <span className="np-chip-sm">AC</span>}
              {pg.food_available && <span className="np-chip-sm">Meals</span>}
              {pg.wifi_available && <span className="np-chip-sm">WiFi</span>}
              {pg.parking_available && <span className="np-chip-sm">Parking</span>}
            </div>
            <div className="np-qv-foot">
              <div>
                <div className="np-tiny">Starts at</div>
                <div className="np-price-lg">{inr(startingRent(pg))}</div>
              </div>
              <div className="np-qv-actions">
                <button className="np-btn-outline" onClick={onVisit}>View details</button>
                <button className="np-btn-dark" onClick={onBook}>Book now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   BOOKING
========================================================================= */
function BookingModal({ pg, user, onClose, onDone, onAuth }) {
  const [data, setData] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    sharing_type: "single",
    move_in: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return onAuth();
    setBusy(true);
    try {
      await api.post(`/bookings/${pg.id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      onDone();
    } catch (err) {
      alert(err?.response?.data?.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="np-modal" onClick={onClose}>
      <div className="np-modal-card np-modal-narrow" onClick={(e) => e.stopPropagation()}>
        <button className="np-modal-x" onClick={onClose}><X size={18} /></button>
        <div className="np-book-head">
          <img src={imagesOf(pg)[0]} alt="" />
          <div>
            <div className="np-tiny">Booking request</div>
            <h2 className="np-h2">{pg.pg_name}</h2>
            <div className="np-muted np-muted-sm"><MapPin size={11} /> {pg.location || pg.address}</div>
          </div>
        </div>
        <form onSubmit={submit} className="np-form">
          <label>
            <span>Full name</span>
            <input required value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input required value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
          </label>
          <label>
            <span>Sharing</span>
            <select value={data.sharing_type} onChange={(e) => setData({ ...data, sharing_type: e.target.value })}>
              <option value="single">Single</option>
              <option value="double">Twin sharing</option>
              <option value="triple">Triple sharing</option>
            </select>
          </label>
          <label>
            <span>Move-in date</span>
            <input type="date" required value={data.move_in} onChange={(e) => setData({ ...data, move_in: e.target.value })} />
          </label>
          <label className="np-form-full">
            <span>Notes (optional)</span>
            <textarea rows={3} value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
          </label>
          <div className="np-book-foot">
            <div>
              <div className="np-tiny">Rent from</div>
              <div className="np-price-lg">{inr(startingRent(pg))}</div>
            </div>
            <button type="submit" disabled={busy} className="np-btn-dark">
              {busy ? <><Loader2 size={14} className="np-spin" /> Sending…</> : "Confirm request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   FILTERS DRAWER
========================================================================= */
function FiltersDrawer({ filters, setFilters, onClose, onReset }) {
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }));
  return (
    <div className="np-modal" onClick={onClose}>
      <aside className="np-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Filters</h3>
          <button className="np-modal-x" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="np-drawer-body">
          <section>
            <h4>Budget (₹/month)</h4>
            <div className="np-budget">
              <input type="number" value={local.minBudget} onChange={(e) => set("minBudget", +e.target.value)} placeholder="Min" />
              <span>—</span>
              <input type="number" value={local.maxBudget} onChange={(e) => set("maxBudget", +e.target.value)} placeholder="Max" />
            </div>
          </section>
          <section>
            <h4>Amenities</h4>
            <div className="np-checks">
              {[["ac", "AC", Snowflake], ["food", "Food", Utensils], ["wifi", "WiFi", Wifi], ["parking", "Parking", Car]].map(([k, l, Icon]) => (
                <label key={k}>
                  <input type="checkbox" checked={local[k]} onChange={(e) => set(k, e.target.checked)} />
                  <Icon size={14} /> {l}
                </label>
              ))}
            </div>
          </section>
          <section>
            <h4>Food preference</h4>
            <div className="np-radios">
              {[["", "Any"], ["veg", "Vegetarian"], ["nonveg", "Non-veg"]].map(([v, l]) => (
                <label key={v}>
                  <input type="radio" checked={local.foodType === v} onChange={() => set("foodType", v)} /> {l}
                </label>
              ))}
            </div>
          </section>
        </div>
        <footer className="np-drawer-foot">
          <button className="np-btn-ghost" onClick={() => { onReset(); onClose(); }}>Reset</button>
          <button className="np-btn-dark" onClick={() => { setFilters(local); onClose(); }}>Apply filters</button>
        </footer>
      </aside>
    </div>
  );
}

/* =========================================================================
   STYLES — drop-in <style> tag (move to a CSS file if you prefer)
========================================================================= */
function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&family=Inter:wght@300;400;500;600;700&display=swap');
      .np-root{--cream:#fbf7ef;--ink:#241c14;--clay:#b65b3a;--ember:#e07744;--sand:#efe6d5;--border:#e5dccb;--muted:#6e6356;--card:#fffaf0;
        font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--cream);min-height:100vh;line-height:1.5;-webkit-font-smoothing:antialiased;}
      .np-root *,.np-root *::before,.np-root *::after{box-sizing:border-box;}
      .np-root h1,.np-root h2,.np-root h3,.np-root h4{font-family:'Fraunces',Georgia,serif;letter-spacing:-.02em;margin:0;font-weight:600;}
      .np-root em{font-style:italic;color:var(--clay);}
      .np-root a{color:inherit;text-decoration:none;}
      .np-root button{font:inherit;cursor:pointer;border:none;background:none;color:inherit;}
      .np-root input,.np-root select,.np-root textarea{font:inherit;color:inherit;}

      /* NAV */
      .np-nav{position:sticky;top:0;z-index:40;background:rgba(251,247,239,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
      .np-nav-inner{max-width:1240px;margin:0 auto;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
      .np-brand{display:flex;align-items:center;gap:8px;}
      .np-brand-dot{width:32px;height:32px;border-radius:50%;background:var(--ink);color:var(--cream);display:grid;place-items:center;font-family:'Fraunces';font-size:15px;}
      .np-brand-name{font-family:'Fraunces';font-size:20px;}
      .np-nav-links{display:none;gap:32px;font-size:14px;color:var(--muted);}
      .np-nav-links a:hover{color:var(--ink);}
      @media(min-width:900px){.np-nav-links{display:flex;}}
      .np-nav-cta{display:flex;gap:10px;align-items:center;}
      .np-loc-chip{display:none;align-items:center;gap:5px;font-size:12px;color:var(--muted);padding:5px 10px;border:1px solid var(--border);border-radius:999px;background:var(--card);}
      @media(min-width:700px){.np-loc-chip{display:inline-flex;}}
      .np-btn-ghost{padding:8px 16px;border:1px solid var(--border);border-radius:999px;background:var(--card);font-size:13px;font-weight:500;}
      .np-btn-ghost:hover{border-color:var(--clay);}

      /* HERO */
      .np-hero{max-width:1240px;margin:0 auto;padding:40px 22px 50px;}
      .np-hero-grid{display:grid;gap:40px;align-items:center;}
      @media(min-width:900px){.np-hero-grid{grid-template-columns:1.05fr 1fr;gap:60px;padding-top:30px;padding-bottom:40px;}}
      .np-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid var(--border);background:var(--card);border-radius:999px;font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:var(--muted);margin-bottom:22px;}
      .np-eyebrow-clay{color:var(--clay);border-color:transparent;background:transparent;padding:0;margin-bottom:6px;}
      .np-eyebrow-ember{color:var(--ember);border-color:transparent;background:transparent;padding:0;margin-bottom:6px;}
      .np-dot{width:6px;height:6px;border-radius:50%;background:var(--ember);}
      .np-h1{font-size:clamp(40px,7vw,72px);line-height:.95;}
      .np-h2{font-size:clamp(28px,4vw,42px);line-height:1.05;}
      .np-h2-xl{font-size:clamp(36px,5vw,60px);line-height:1.02;color:var(--cream);}
      .np-lede{margin:18px 0 0;max-width:440px;color:var(--muted);font-size:17px;}
      .np-lede-dim{color:rgba(255,255,255,.7);max-width:420px;margin:18px 0 0;font-size:14px;}
      .np-search{margin-top:28px;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:8px;display:flex;flex-direction:column;gap:6px;box-shadow:0 24px 60px -30px rgba(80,40,10,.25);}
      @media(min-width:700px){.np-search{flex-direction:row;align-items:center;}}
      .np-search-field{flex:1;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;}
      .np-search-field:hover{background:var(--sand);}
      .np-search-icon{color:var(--clay);}
      .np-search-text{flex:1;display:flex;flex-direction:column;}
      .np-search-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);}
      .np-search-value{font-size:14px;font-weight:500;}
      .np-search-text input{border:none;background:transparent;outline:none;font-size:14px;font-weight:500;width:100%;}
      .np-search-divider{display:none;width:1px;height:36px;background:var(--border);}
      @media(min-width:700px){.np-search-divider{display:block;}}
      .np-search-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 22px;border-radius:12px;background:var(--ink);color:var(--cream);font-size:14px;font-weight:500;transition:.2s;}
      .np-search-btn:hover{background:var(--clay);}
      .np-trust{margin-top:28px;display:flex;flex-wrap:wrap;gap:24px;font-size:12px;color:var(--muted);}
      .np-trust span{display:inline-flex;align-items:center;gap:6px;}

      /* hero collage */
      .np-hero-collage{position:relative;height:440px;}
      @media(min-width:900px){.np-hero-collage{height:560px;}}
      .np-hero-photo{position:absolute;inset:0;border-radius:32px;overflow:hidden;border:1px solid var(--border);}
      .np-hero-photo img{width:100%;height:100%;object-fit:cover;}
      .np-hero-card{position:absolute;left:-12px;bottom:-12px;width:170px;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:14px;box-shadow:0 16px 40px -20px rgba(80,40,10,.3);transform:rotate(-4deg);}
      .np-hero-card-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);}
      .np-hero-card-value{font-family:'Fraunces';font-size:16px;margin-top:4px;}
      .np-hero-pill{position:absolute;right:-6px;top:-12px;background:var(--ink);color:var(--cream);padding:12px 18px;border-radius:16px;transform:rotate(5deg);box-shadow:0 16px 40px -20px rgba(80,40,10,.4);}
      .np-hero-pill-price{display:block;font-family:'Fraunces';font-size:24px;}
      .np-hero-pill-price small{color:rgba(255,255,255,.6);font-size:11px;font-family:'Inter';font-weight:400;}
      .np-hero-pill-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.6);margin-top:2px;}

      /* AREAS */
      .np-areas{background:rgba(239,230,213,.5);border-block:1px solid var(--border);}
      .np-areas .np-areas-head,.np-areas .np-scroll{max-width:1240px;margin:0 auto;padding:0 22px;}
      .np-areas-head{display:flex;justify-content:space-between;align-items:end;padding-top:24px;padding-bottom:12px;}
      .np-areas-head h2{font-size:18px;}
      .np-areas-head a{font-size:12px;color:var(--muted);}
      .np-scroll{display:flex;gap:10px;overflow-x:auto;padding-bottom:24px;scrollbar-width:none;}
      .np-scroll::-webkit-scrollbar{display:none;}
      .np-scroll-pad{padding-top:18px;padding-bottom:6px;}
      .np-area{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid var(--border);background:var(--card);border-radius:16px;flex-shrink:0;transition:.2s;}
      .np-area:hover{border-color:var(--clay);}
      .np-area.is-on{background:var(--ink);color:var(--cream);border-color:var(--ink);}
      .np-area-num{font-family:'Fraunces';font-size:20px;color:var(--clay);font-variant-numeric:tabular-nums;}
      .np-area.is-on .np-area-num{color:var(--ember);}
      .np-area-name{display:block;font-size:14px;font-weight:500;text-align:left;}
      .np-area-count{display:block;font-size:11px;color:var(--muted);}
      .np-area.is-on .np-area-count{color:rgba(255,255,255,.6);}

      /* QUICK */
      .np-quick{max-width:1240px;margin:0 auto;padding:24px 22px 0;display:flex;align-items:center;gap:16px;}
      .np-quick > .np-scroll{flex:1;padding:0;}
      .np-quick-right{display:flex;gap:8px;align-items:center;flex-shrink:0;}
      .np-select{padding:9px 14px;border-radius:999px;border:1px solid var(--border);background:var(--card);font-size:13px;}
      .np-btn-outline{display:inline-flex;gap:6px;align-items:center;padding:9px 16px;border-radius:999px;border:1px solid var(--border);background:var(--card);font-size:13px;}
      .np-btn-outline:hover{border-color:var(--clay);}
      .np-btn-outline-lg{display:inline-flex;gap:8px;align-items:center;padding:14px 26px;border-radius:999px;border:1px solid var(--border);background:var(--card);font-size:14px;font-weight:500;}
      .np-btn-outline-lg:hover{border-color:var(--clay);}
      .np-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--border);background:var(--card);border-radius:999px;font-size:13px;font-weight:500;flex-shrink:0;transition:.2s;}
      .np-chip:hover{border-color:var(--clay);}
      .np-chip.is-on{background:var(--ink);color:var(--cream);border-color:var(--ink);}
      .np-chip-sm{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:var(--sand);border-radius:6px;font-size:11px;}

      /* SPOTLIGHT */
      .np-spotlight{max-width:1240px;margin:0 auto;padding:40px 22px;}
      .np-section-head{margin-bottom:20px;}
      .np-section-head-row{display:flex;justify-content:space-between;align-items:end;}
      .np-spot{display:grid;border:1px solid var(--border);background:var(--card);border-radius:32px;overflow:hidden;cursor:pointer;transition:.3s;}
      @media(min-width:900px){.np-spot{grid-template-columns:1fr 1fr;}}
      .np-spot:hover{transform:translateY(-2px);box-shadow:0 30px 60px -30px rgba(80,40,10,.3);}
      .np-spot-img{position:relative;aspect-ratio:4/3;}
      .np-spot-img img{width:100%;height:100%;object-fit:cover;}
      .np-spot-tag{position:absolute;left:16px;top:16px;background:rgba(251,247,239,.9);padding:5px 12px;border-radius:999px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.1em;}
      .np-spot-body{padding:32px;display:flex;flex-direction:column;justify-content:space-between;gap:24px;}
      @media(min-width:900px){.np-spot-body{padding:40px;}}
      .np-spot-meta{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;}
      .np-rating{color:var(--ink);display:inline-flex;align-items:center;gap:4px;text-transform:none;letter-spacing:0;font-size:14px;}
      .np-rating svg{color:var(--ember);}
      .np-rating small{color:var(--muted);font-size:12px;}
      .np-spot-name{font-size:clamp(28px,4vw,42px);margin-top:10px;}
      .np-spot-desc{color:var(--muted);font-size:14px;max-width:440px;margin-top:12px;}
      .np-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px;}
      .np-spot-foot{display:flex;justify-content:space-between;align-items:end;border-top:1px dashed var(--border);padding-top:24px;}
      .np-tiny{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);}
      .np-price-lg{font-family:'Fraunces';font-size:34px;color:var(--clay);}
      .np-btn-dark{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;background:var(--ink);color:var(--cream);font-size:14px;font-weight:500;}
      .np-btn-dark:hover{background:var(--clay);}

      /* GRID */
      .np-listings{max-width:1240px;margin:0 auto;padding:0 22px 60px;}
      .np-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:24px;}
      .np-card{display:flex;flex-direction:column;border:1px solid var(--border);background:var(--card);border-radius:24px;overflow:hidden;cursor:pointer;transition:.3s;}
      .np-card:hover{transform:translateY(-3px);box-shadow:0 28px 50px -28px rgba(80,40,10,.3);}
      .np-skeleton{height:380px;background:linear-gradient(90deg,var(--sand),var(--card),var(--sand));background-size:200% 100%;animation:np-skel 1.6s linear infinite;}
      @keyframes np-skel{0%{background-position:200% 0}100%{background-position:-200% 0}}
      .np-card-img{position:relative;aspect-ratio:5/4;overflow:hidden;}
      .np-card-img img{width:100%;height:100%;object-fit:cover;transition:.6s;}
      .np-card:hover .np-card-img img{transform:scale(1.05);}
      .np-img-nav{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:rgba(251,247,239,.92);display:grid;place-items:center;opacity:0;transition:.2s;}
      .np-card:hover .np-img-nav{opacity:1;}
      .np-img-nav-l{left:8px;} .np-img-nav-r{right:8px;}
      .np-img-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:4px;}
      .np-img-dots span{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.55);transition:.2s;}
      .np-img-dots span.is-on{background:#fff;width:14px;border-radius:3px;}
      .np-fav{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;background:rgba(251,247,239,.92);backdrop-filter:blur(4px);display:grid;place-items:center;transition:.2s;}
      .np-fav:hover{transform:scale(1.1);}
      .np-fav.is-on{color:var(--ember);}
      .np-card-tags-top{position:absolute;left:12px;top:12px;display:flex;gap:6px;}
      .np-card-tags-bot{position:absolute;left:12px;bottom:12px;}
      .np-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(251,247,239,.92);backdrop-filter:blur(4px);border-radius:999px;font-size:11px;font-weight:500;}
      .np-badge-dark{background:rgba(36,28,20,.85);color:var(--cream);}
      .np-card-body{padding:20px;flex:1;display:flex;flex-direction:column;}
      .np-card-top{display:flex;justify-content:space-between;align-items:start;gap:12px;}
      .np-card-top h3{font-size:18px;line-height:1.2;}
      .np-card-loc{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--muted);margin-top:4px;}
      .np-rating-sm{display:inline-flex;align-items:center;gap:4px;background:var(--sand);padding:4px 10px;border-radius:999px;font-size:12px;flex-shrink:0;}
      .np-rating-sm svg{color:var(--ember);}
      .np-card-amen{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;}
      .np-card-amen span{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:var(--sand);border-radius:6px;font-size:11px;color:var(--muted);}
      .np-card-foot{margin-top:auto;padding-top:18px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:end;}
      .np-price{font-family:'Fraunces';font-size:22px;color:var(--clay);}
      .np-price small{font-family:'Inter';font-size:12px;color:var(--muted);font-weight:400;}
      .np-card-actions{display:flex;gap:6px;align-items:center;}
      .np-icon-btn{width:34px;height:34px;border-radius:10px;background:var(--sand);display:grid;place-items:center;transition:.2s;}
      .np-icon-btn:hover{background:var(--ink);color:var(--cream);}
      .np-icon-btn.is-on{background:var(--clay);color:var(--cream);}
      .np-btn-dark-sm{padding:8px 14px;border-radius:10px;background:var(--ink);color:var(--cream);font-size:12px;font-weight:500;}
      .np-btn-dark-sm:hover{background:var(--clay);}
      .np-btn-dark-sm:disabled{opacity:.5;cursor:not-allowed;}

      .np-more{display:flex;justify-content:center;margin-top:40px;}
      .np-spin{animation:np-spin 1s linear infinite;}
      @keyframes np-spin{to{transform:rotate(360deg)}}
      .np-empty{text-align:center;padding:60px 20px;color:var(--muted);}
      .np-empty h3{font-size:22px;margin:14px 0 6px;color:var(--ink);}
      .np-muted{color:var(--muted);font-size:13px;}
      .np-muted-sm{font-size:11px;display:inline-flex;align-items:center;gap:4px;}

      /* CTA */
      .np-cta-wrap{max-width:1240px;margin:0 auto;padding:0 22px 60px;}
      .np-cta{background:var(--ink);color:var(--cream);border-radius:32px;padding:48px 32px;display:grid;gap:32px;}
      @media(min-width:900px){.np-cta{grid-template-columns:1.4fr 1fr;align-items:end;padding:60px;}}
      .np-cta em{color:var(--ember);}
      .np-cta-actions{display:flex;flex-direction:column;gap:12px;}
      .np-btn-cream{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 24px;border-radius:999px;background:var(--cream);color:var(--ink);font-size:14px;font-weight:500;}
      .np-btn-cream:hover{background:var(--ember);}
      .np-btn-ghost-dark{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 24px;border-radius:999px;border:1px solid rgba(255,255,255,.2);color:var(--cream);font-size:14px;font-weight:500;}
      .np-btn-ghost-dark:hover{border-color:rgba(255,255,255,.4);}
      .np-btn-ghost-sm{padding:8px 14px;font-size:12px;color:var(--muted);}

      /* FOOTER */
      .np-footer{border-top:1px solid var(--border);max-width:1240px;margin:0 auto;padding:24px 22px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--muted);}
      .np-footer a{margin-right:8px;}

      /* COMPARE BAR */
      .np-compare-bar{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:var(--cream);border-radius:18px;padding:12px 18px;display:flex;align-items:center;gap:24px;box-shadow:0 20px 50px -20px rgba(0,0,0,.4);z-index:50;max-width:calc(100vw - 40px);}
      .np-compare-list{display:flex;align-items:center;gap:12px;font-size:13px;}
      .np-compare-thumbs{display:flex;gap:-6px;}
      .np-compare-thumbs img{width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid var(--ink);margin-left:-8px;}
      .np-compare-actions{display:flex;gap:8px;}

      /* MODAL */
      .np-modal{position:fixed;inset:0;z-index:60;background:rgba(36,28,20,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px;animation:np-fade .2s ease;}
      @keyframes np-fade{from{opacity:0}to{opacity:1}}
      .np-modal-card{background:var(--cream);border-radius:24px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;position:relative;animation:np-pop .25s ease;}
      .np-modal-narrow{max-width:520px;}
      @keyframes np-pop{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}
      .np-modal-x{position:absolute;right:16px;top:16px;width:36px;height:36px;border-radius:50%;background:var(--card);border:1px solid var(--border);display:grid;place-items:center;z-index:2;}
      .np-qv{display:grid;}
      @media(min-width:700px){.np-qv{grid-template-columns:1fr 1fr;}}
      .np-qv-img{aspect-ratio:1;background:var(--sand);}
      .np-qv-img img{width:100%;height:100%;object-fit:cover;}
      .np-qv-body{padding:32px;display:flex;flex-direction:column;gap:14px;}
      .np-qv-foot{margin-top:auto;padding-top:20px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:14px;}
      .np-qv-actions{display:flex;gap:8px;}

      /* BOOKING */
      .np-book-head{padding:24px 24px 16px;display:flex;gap:16px;align-items:center;}
      .np-book-head img{width:64px;height:64px;border-radius:14px;object-fit:cover;}
      .np-book-head h2{font-size:22px;line-height:1.1;margin:2px 0;}
      .np-form{padding:0 24px 24px;display:grid;gap:14px;grid-template-columns:1fr 1fr;}
      .np-form label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted);}
      .np-form-full{grid-column:1/-1;}
      .np-form input,.np-form select,.np-form textarea{padding:11px 14px;border:1px solid var(--border);border-radius:10px;background:var(--card);font-size:14px;color:var(--ink);outline:none;}
      .np-form input:focus,.np-form select:focus,.np-form textarea:focus{border-color:var(--clay);}
      .np-book-foot{grid-column:1/-1;display:flex;justify-content:space-between;align-items:end;padding-top:10px;border-top:1px dashed var(--border);margin-top:8px;}

      /* DRAWER */
      .np-drawer{margin-left:auto;height:100vh;width:100%;max-width:420px;background:var(--cream);display:flex;flex-direction:column;animation:np-slide .25s ease;}
      @keyframes np-slide{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
      .np-drawer header{padding:22px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);}
      .np-drawer header h3{font-size:20px;}
      .np-drawer-body{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:28px;}
      .np-drawer-body h4{font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:12px;}
      .np-budget{display:flex;align-items:center;gap:10px;}
      .np-budget input{flex:1;padding:11px 14px;border:1px solid var(--border);border-radius:10px;background:var(--card);font-size:14px;}
      .np-checks,.np-radios{display:flex;flex-direction:column;gap:10px;}
      .np-checks label,.np-radios label{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px;cursor:pointer;background:var(--card);}
      .np-checks label:hover,.np-radios label:hover{border-color:var(--clay);}
      .np-drawer-foot{padding:18px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:12px;}

      /* TOAST */
      .np-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ink);color:var(--cream);padding:12px 22px;border-radius:999px;font-size:13px;z-index:80;box-shadow:0 20px 50px -20px rgba(0,0,0,.4);animation:np-up .2s ease;}
      @keyframes np-up{from{transform:translate(-50%,8px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
    `}</style>
  );
}
