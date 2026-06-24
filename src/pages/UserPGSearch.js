import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search, Filter, MapPin, Home, Utensils, Snowflake, Navigation, X, Phone,
  MessageCircle, Map, Star, Wifi, Car, Shield, Users, Calendar, Bed, Bath,
  Check, Heart, Eye, ChevronLeft, ChevronRight, Clock, Lock, Briefcase,
  GraduationCap, Coffee, Bookmark, Share2, Download, Printer, BookOpen,
  CreditCard, UserCheck, Award, Zap, Bell, ThumbsUp, BookmarkPlus, Copy,
  Info, Leaf, Flame, BatteryCharging, Droplets, Sun, Moon, Tv, Wind,
  Sparkles, Pill, Dumbbell, Building, DoorOpen, Key, Sofa, Hash, Sliders,
  TrendingUp, Target, Plus, Minus, BarChart3, BadgePercent, Coins, Rocket,
  Megaphone, Instagram, Crown, Gem, FileText, Headphones, Train, Bus,
  School, Building2, ShoppingBag, TreePine, WashingMachine, Fan, Tv as TvIcon,
  Stethoscope, Compass, ArrowRight, Sparkle, Layers, MousePointerClick,
  IndianRupee, RefreshCw, Loader2, SlidersHorizontal, BadgeCheck, ArrowUpRight,
  MapPinned, Fingerprint, Globe, HandHeart, PartyPopper, Gem as GemIcon,
  ArrowDown, ChevronDown, FilterX, RotateCcw, Crosshair, LocateFixed
} from "lucide-react";

/* ================================================================
   API & CONFIG
   ================================================================ */
const api = { get: async (url: string) => ({ data: { data: [], hasMore: false, total: 0 } }), post: async (url: string, data?: any) => ({ data: { message: "Success" } }) };
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://nepxall-backend.onrender.com";
const PAGE_SIZE = 12;

/* ================================================================
   TYPES
   ================================================================ */
interface PG {
  id: number;
  pg_name: string;
  pg_category: "pg" | "coliving" | "to_let";
  pg_type?: "boys" | "girls" | "unisex";
  area?: string; city?: string; address?: string;
  latitude?: number; longitude?: number; distance?: number;
  rent_amount?: number;
  single_sharing?: number; double_sharing?: number; triple_sharing?: number; four_sharing?: number;
  single_room?: number; double_room?: number;
  co_living_single_room?: number; co_living_double_room?: number;
  coliving_three_sharing?: number; coliving_four_sharing?: number;
  price_1bhk?: number; price_2bhk?: number; price_3bhk?: number; price_4bhk?: number;
  deposit_amount?: number; security_deposit?: number; maintenance_amount?: number;
  available_rooms?: number; total_rooms?: number; min_stay_months?: number;
  bhk_type?: string; sqft_area?: number; furnishing_type?: string;
  ready_to_move?: boolean; family_allowed?: boolean;
  food_available?: boolean; food_type?: "veg" | "non-veg" | "both";
  ac_available?: boolean; wifi_available?: boolean; parking_available?: boolean;
  attached_bathroom?: boolean; is_verified?: boolean;
  main_photo?: string; photos?: string[];
  contact_phone?: string;
  created_at?: string;
}

/* ================================================================
   UTILITIES
   ================================================================ */
const formatPrice = (price: any) => {
  if (price == null || price === "") return "0";
  const n = Number(price);
  if (isNaN(n)) return "0";
  try { return n.toLocaleString("en-IN"); } catch { return String(n); }
};

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCorrectImageUrl = (photo?: string) => {
  if (!photo) return "/no-image.png";
  if (photo.startsWith("http")) return photo;
  if (photo.includes("/uploads/")) {
    const i = photo.indexOf("/uploads/");
    return `${BACKEND_URL}${photo.substring(i)}`;
  }
  if (photo.includes("/opt/render/")) {
    const m = photo.match(/\/uploads\/.*/);
    if (m) return `${BACKEND_URL}${m[0]}`;
  }
  return `${BACKEND_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
};

const getEffectiveRent = (pg: PG) =>
  pg.rent_amount || pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing ||
  pg.single_room || pg.double_room || pg.co_living_single_room || pg.co_living_double_room ||
  pg.coliving_three_sharing || pg.coliving_four_sharing || pg.price_1bhk || pg.price_2bhk ||
  pg.price_3bhk || pg.price_4bhk || 0;

const getPriceRange = (pg: PG) => {
  const prices: number[] = [];
  if (pg.pg_category === "pg") {
    [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.single_room, pg.double_room].forEach(p => { if (p && p > 0) prices.push(p); });
  } else if (pg.pg_category === "coliving") {
    [pg.co_living_single_room, pg.co_living_double_room, pg.coliving_three_sharing, pg.coliving_four_sharing].forEach(p => { if (p && p > 0) prices.push(p); });
  } else {
    [pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk].forEach(p => { if (p && p > 0) prices.push(p); });
  }
  return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };
};

const processPGData = (data: any[]): PG[] => data.map(pg => ({
  ...pg,
  deposit_amount: Number(pg.deposit_amount) || Number(pg.security_deposit) || 0,
  rent_amount: Number(pg.rent_amount) || 0,
  single_sharing: Number(pg.single_sharing) || 0, double_sharing: Number(pg.double_sharing) || 0,
  triple_sharing: Number(pg.triple_sharing) || 0, four_sharing: Number(pg.four_sharing) || 0,
  single_room: Number(pg.single_room) || 0, double_room: Number(pg.double_room) || 0,
  price_1bhk: Number(pg.price_1bhk) || 0, price_2bhk: Number(pg.price_2bhk) || 0,
  price_3bhk: Number(pg.price_3bhk) || 0, price_4bhk: Number(pg.price_4bhk) || 0,
  co_living_single_room: Number(pg.co_living_single_room) || 0, co_living_double_room: Number(pg.co_living_double_room) || 0,
  coliving_three_sharing: Number(pg.coliving_three_sharing) || 0, coliving_four_sharing: Number(pg.coliving_four_sharing) || 0,
  security_deposit: Number(pg.security_deposit) || 0, maintenance_amount: Number(pg.maintenance_amount) || 0,
  available_rooms: Number(pg.available_rooms) || 0, total_rooms: Number(pg.total_rooms) || 0,
  min_stay_months: Number(pg.min_stay_months) || 0,
  ready_to_move: pg.ready_to_move === true || pg.ready_to_move === 1 || pg.ready_to_move === "true",
  family_allowed: pg.family_allowed === true || pg.family_allowed === 1 || pg.family_allowed === "true",
  sqft_area: pg.sqft_area || null, bhk_type: pg.bhk_type || null, furnishing_type: pg.furnishing_type || null,
  food_available: pg.food_available === true || pg.food_available === 1 || pg.food_available === "true",
  ac_available: pg.ac_available === true || pg.ac_available === 1 || pg.ac_available === "true",
  wifi_available: pg.wifi_available === true || pg.wifi_available === 1 || pg.wifi_available === "true",
  parking_available: pg.parking_available === true || pg.parking_available === 1 || pg.parking_available === "true",
  is_verified: pg.is_verified === true || pg.is_verified === 1 || pg.is_verified === "true",
}));

/* ================================================================
   DATA
   ================================================================ */
const popularAreas = [
  { name: "Koramangala", color: "#2563eb" },
  { name: "BTM Layout", color: "#059669" },
  { name: "Jayanagar", color: "#d97706" },
  { name: "Electronic City", color: "#7c3aed" },
  { name: "HSR Layout", color: "#db2777" },
  { name: "Whitefield", color: "#0891b2" },
  { name: "Marathahalli", color: "#dc2626" },
];

const propertyTabs = [
  { id: "all", label: "All Properties", icon: Layers },
  { id: "pg", label: "PG", icon: Bed },
  { id: "coliving", label: "Co-Living", icon: Users },
  { id: "to_let", label: "To-Let", icon: Home },
];

const budgetRanges = [
  { label: "Budget", sub: "0 - 5k", min: 0, max: 5000 },
  { label: "Economy", sub: "5k - 10k", min: 5000, max: 10000 },
  { label: "Standard", sub: "10k - 20k", min: 10000, max: 20000 },
  { label: "Premium", sub: "20k - 30k", min: 20000, max: 30000 },
  { label: "Luxury", sub: "30k+", min: 30000, max: 100000 },
];

/* ================================================================
   SMALL REUSABLE COMPONENTS
   ================================================================ */

const Badge = ({ children, color = "blue", className = "" }: { children: React.ReactNode; color?: string; className?: string }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorMap[color] || colorMap.blue} ${className}`}>
      {children}
    </span>
  );
};

const IconButton = ({ icon: Icon, onClick, active, color, className = "" }: any) => (
  <motion.button
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
      active
        ? color === "rose" ? "bg-rose-500 text-white shadow-rose-200" : "bg-blue-600 text-white shadow-blue-200"
        : "bg-white/90 text-slate-600 hover:bg-white hover:shadow-md"
    } ${className}`}
  >
    <Icon size={16} />
  </motion.button>
);

/* ================================================================
   HERO SECTION
   ================================================================ */
const HeroSection = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [query, setQuery] = useState("");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 400], [0, -80]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) onSearch(query.trim()); };

  return (
    <motion.section style={{ opacity }} className="relative mb-16 overflow-hidden rounded-[2rem]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

      {/* Animated orbs */}
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-10 left-10 w-96 h-96 bg-violet-500/15 rounded-full blur-[120px]" />
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[100px]" />

      <motion.div style={{ y: y1 }} className="relative z-10 px-6 sm:px-10 lg:px-16 py-16 sm:py-24 lg:py-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-6">
            <Sparkle size={14} className="text-amber-300" />
            <span>Discover 500+ verified properties across Bangalore</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-blue-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Stay in Bangalore
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
            Verified PGs, premium co-living spaces, and rental homes. Connect directly with owners — zero brokerage.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="flex max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl shadow-black/20">
            <div className="flex-1 flex items-center px-4">
              <MapPin size={20} className="text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by area, city, or property name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-4 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-base"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </motion.button>
          </form>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: BadgeCheck, text: "Verified Properties" },
              { icon: Phone, text: "Direct Owner Contact" },
              { icon: HandHeart, text: "Zero Brokerage" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white/85 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-white/15 transition-colors"
              >
                <item.icon size={15} className="text-emerald-300" />
                {item.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
    </motion.section>
  );
};

/* ================================================================
   WHY CHOOSE SECTION
   ================================================================ */
const WhyChooseSection = () => {
  const tenantCards = [
    { icon: MapPinned, title: "Find PGs Near Workplace", desc: "Search by location, commute distance", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50" },
    { icon: Shield, title: "Verified Listings Only", desc: "Every property is manually verified", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
    { icon: BarChart3, title: "Compare & Decide", desc: "Side-by-side rent & amenity comparison", color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
    { icon: Phone, title: "Direct Owner Chat", desc: "Call or WhatsApp owners instantly", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
    { icon: Coins, title: "No Broker Charges", desc: "Save thousands, deal directly", color: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
  ];

  const ownerCards = [
    { icon: Users, title: "More Tenant Leads", desc: "Reach thousands of active seekers", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50" },
    { icon: Plus, title: "List For Free", desc: "Add unlimited properties at no cost", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
    { icon: Calendar, title: "Manage Bookings", desc: "Track inquiries & room availability", color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
    { icon: Award, title: "Build Trust", desc: "Get verified badge for credibility", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
    { icon: Rocket, title: "Fill Rooms Faster", desc: "Higher occupancy, less vacancy", color: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
  ];

  return (
    <section className="mb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">Why Nepxall</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Built for Tenants & Owners</h2>
        <p className="text-slate-500 text-lg max-w-lg mx-auto">A trusted platform connecting people with their ideal spaces</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tenants */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/50 border border-blue-100/80 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">For Tenants</h3>
                <p className="text-sm text-slate-500">Looking for PG / Co-Living / Rental</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {tenantCards.map((c, i) => (
                <motion.div key={i} whileHover={{ y: -3, scale: 1.01 }} className={`flex items-start gap-3 p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-default`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                    <c.icon size={18} className={`bg-gradient-to-br ${c.color} bg-clip-text text-transparent`} style={{ color: c.color.includes("blue") ? "#2563eb" : c.color.includes("emerald") ? "#059669" : c.color.includes("violet") ? "#7c3aed" : c.color.includes("amber") ? "#d97706" : "#e11d48" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Owners */}
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-100/80 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">For Owners</h3>
                <p className="text-sm text-slate-500">List & manage your properties</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {ownerCards.map((c, i) => (
                <motion.div key={i} whileHover={{ y: -3, scale: 1.01 }} className={`flex items-start gap-3 p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-default`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                    <c.icon size={18} style={{ color: c.color.includes("blue") ? "#2563eb" : c.color.includes("emerald") ? "#059669" : c.color.includes("violet") ? "#7c3aed" : c.color.includes("amber") ? "#d97706" : "#e11d48" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ================================================================
   QUICK FILTERS
   ================================================================ */
const QuickFiltersBar = ({ active, onToggle }: { active: Set<string>; onToggle: (id: string) => void }) => {
  const filters = [
    { id: "near_me", label: "Near Me", icon: Navigation, color: "orange" },
    { id: "ac_room", label: "AC Room", icon: Snowflake, color: "blue" },
    { id: "wifi", label: "WiFi", icon: Wifi, color: "violet" },
    { id: "parking", label: "Parking", icon: Car, color: "emerald" },
    { id: "veg_food", label: "Veg Food", icon: Leaf, color: "green" },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Quick Filters</h3>
      <div className="flex flex-wrap gap-3">
        {filters.map((f, i) => {
          const isActive = active.has(f.id);
          const colorMap: Record<string, string> = {
            orange: isActive ? "bg-orange-500 text-white shadow-orange-200" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600",
            blue: isActive ? "bg-blue-500 text-white shadow-blue-200" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600",
            violet: isActive ? "bg-violet-500 text-white shadow-violet-200" : "bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-600",
            emerald: isActive ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600",
            green: isActive ? "bg-green-500 text-white shadow-green-200" : "bg-white text-slate-600 hover:bg-green-50 hover:text-green-600",
          };
          return (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(f.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 shadow-sm ${colorMap[f.color]} ${isActive ? "border-transparent shadow-md" : "border-slate-200 hover:border-slate-300"}`}
            >
              <f.icon size={15} />
              {f.label}
              {isActive && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-white/70" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================
   POPULAR AREAS
   ================================================================ */
const PopularAreas = ({ selected, onSelect }: { selected: string; onSelect: (area: string) => void }) => (
  <div className="mb-10">
    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Popular Areas in Bangalore</h3>
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
      {popularAreas.map((area, i) => {
        const isSelected = selected === area.name;
        return (
          <motion.button
            key={area.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(area.name)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 ${
              isSelected
                ? "text-white border-transparent shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
            style={isSelected ? { backgroundColor: area.color, boxShadow: `0 4px 14px ${area.color}40` } : {}}
          >
            <MapPin size={14} />
            {area.name}
          </motion.button>
        );
      })}
    </div>
  </div>
);

/* ================================================================
   FILTER BAR
   ================================================================ */
const FilterBar = ({
  filters, onChange, onBudget, onNearMe, onCompareToggle, onReset,
  compareMode, hasActive, userLocation,
}: {
  filters: any; onChange: (f: any) => void; onBudget: () => void; onNearMe: () => void;
  onCompareToggle: () => void; onReset: () => void; compareMode: boolean; hasActive: boolean; userLocation: boolean;
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-200/50 border border-white/60 mb-8 sticky top-4 z-40">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by area, city or property name..."
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <FilterPill icon={Coins} label="Budget" onClick={onBudget} />
          <FilterPill icon={SlidersHorizontal} label="Filters" active={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)} />
          <FilterPill icon={Navigation} label="Near Me" active={filters.nearMe} onClick={onNearMe} color="orange" />
          <FilterPill icon={BarChart3} label="Compare" active={compareMode} onClick={onCompareToggle} color="violet" />
          {hasActive && <FilterPill icon={RotateCcw} label="Clear" onClick={onReset} color="rose" />}
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sort By</label>
                  <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                    <option value="">Relevance</option>
                    <option value="low">Rent: Low to High</option>
                    <option value="high">Rent: High to Low</option>
                    <option value="new">Newest First</option>
                    {userLocation && <option value="distance">Nearest First</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Food Type</label>
                  <select value={filters.foodType} onChange={(e) => onChange({ foodType: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                    <option value="">Any</option>
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "food", label: "Food", icon: Utensils },
                      { key: "ac", label: "AC", icon: Snowflake },
                      { key: "wifi", label: "WiFi", icon: Wifi },
                      { key: "parking", label: "Parking", icon: Car },
                    ].map((a) => (
                      <motion.button
                        key={a.key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChange({ [a.key]: !filters[a.key] })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          filters[a.key]
                            ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <a.icon size={13} />
                        {a.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FilterPill = ({ icon: Icon, label, onClick, active, color = "slate" }: any) => {
  const activeColors: Record<string, string> = {
    blue: "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200",
    violet: "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-200",
    orange: "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200",
    rose: "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200",
    slate: "bg-slate-800 text-white border-slate-800",
  };
  const inactiveColors = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300";
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${active ? activeColors[color] || activeColors.slate : inactiveColors}`}>
      <Icon size={15} />
      {label}
    </motion.button>
  );
};

/* ================================================================
   BUDGET MODAL
   ================================================================ */
const BudgetModal = ({ minBudget, maxBudget, onChange, onClose }: { minBudget: number; maxBudget: number; onChange: (min: number, max: number) => void; onClose: () => void }) => {
  const [min, setMin] = useState(minBudget);
  const [max, setMax] = useState(maxBudget);

  const minPct = (min / 100000) * 100;
  const maxPct = (max / 100000) * 100;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[3000] p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><SlidersHorizontal size={20} className="text-blue-600" /></div>
              <div><h2 className="text-lg font-bold text-slate-900">Budget Filter</h2><p className="text-xs text-slate-500">Set your monthly rent range</p></div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={18} /></button>
          </div>

          <div className="p-6">
            {/* Quick ranges */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Select</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {budgetRanges.map((r, i) => {
                  const sel = min === r.min && max === r.max;
                  return (
                    <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setMin(r.min); setMax(r.max); }} className={`p-3 rounded-xl text-left border transition-all ${sel ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200" : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"}`}>
                      <div className={`text-sm font-bold ${sel ? "text-white" : "text-slate-900"}`}>{r.label}</div>
                      <div className={`text-xs mt-0.5 ${sel ? "text-white/80" : "text-slate-500"}`}>{r.sub}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Custom Range</h4>
              <div className="flex justify-between mb-4">
                <div className="text-center"><div className="text-xs text-slate-500 mb-1">Min</div><div className="text-lg font-bold text-blue-600">₹{formatPrice(min)}</div></div>
                <div className="text-center"><div className="text-xs text-slate-500 mb-1">Max</div><div className="text-lg font-bold text-blue-600">₹{formatPrice(max)}</div></div>
              </div>

              <div className="relative h-10 mb-4">
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-200 rounded-full -translate-y-1/2" />
                <div className="absolute top-1/2 h-2 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full -translate-y-1/2" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
                <input type="range" min="0" max="100000" step="1000" value={min} onChange={(e) => setMin(Math.min(Number(e.target.value), max))} className="absolute w-full top-1/2 -translate-y-1/2 opacity-0 cursor-pointer h-8 z-10" />
                <input type="range" min="0" max="100000" step="1000" value={max} onChange={(e) => setMax(Math.max(Number(e.target.value), min))} className="absolute w-full top-1/2 -translate-y-1/2 opacity-0 cursor-pointer h-8 z-10" />
                <div className="absolute top-1/2 w-6 h-6 bg-white border-[3px] border-blue-500 rounded-full -translate-y-1/2 -translate-x-1/2 shadow-md pointer-events-none" style={{ left: `${minPct}%` }} />
                <div className="absolute top-1/2 w-6 h-6 bg-white border-[3px] border-violet-500 rounded-full -translate-y-1/2 -translate-x-1/2 shadow-md pointer-events-none" style={{ left: `${maxPct}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Min Budget</label>
                  <div className="relative"><IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Max Budget</label>
                  <div className="relative"><IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" /></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setMin(0); setMax(100000); onChange(0, 100000); }} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Reset</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { onChange(min, max); onClose(); }} className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"><Check size={18} /> Apply Budget</motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================================================================
   PROPERTY CARD
   ================================================================ */
const PropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFav, isCompareSelected, onSelectCompare, compareMode, index = 0 }: any) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [hovered, setHovered] = useState(false);

  const photos = useMemo(() => (pg.photos?.filter((p: string) => p?.trim()) || []), [pg.photos]);
  const hasMulti = photos.length > 1;

  useEffect(() => {
    if (hasMulti && hovered && !compareMode) {
      const iv = setInterval(() => setCurrentImg(p => (p + 1) % photos.length), 3000);
      return () => clearInterval(iv);
    }
  }, [hasMulti, hovered, photos.length, compareMode]);

  const imgUrl = useMemo(() => {
    if (hasMulti && photos[currentImg]) return getCorrectImageUrl(photos[currentImg]);
    if (pg.main_photo) return getCorrectImageUrl(pg.main_photo);
    if (photos[0]) return getCorrectImageUrl(photos[0]);
    return "/no-image.png";
  }, [hasMulti, photos, currentImg, pg.main_photo]);

  const price = useMemo(() => getPriceRange(pg).min || getEffectiveRent(pg), [pg]);
  const isFillingFast = pg.available_rooms != null && pg.available_rooms < 5 && pg.available_rooms > 0;

  const catColor = pg.pg_category === "to_let" ? "bg-orange-500" : pg.pg_category === "coliving" ? "bg-violet-500" : pg.pg_type === "boys" ? "bg-emerald-500" : "bg-rose-500";
  const catLabel = pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : pg.pg_type ? `${pg.pg_type.charAt(0).toUpperCase() + pg.pg_type.slice(1)} PG` : "PG";

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${isCompareSelected ? "border-violet-400 ring-2 ring-violet-400/20 shadow-violet-100" : "border-slate-200/80 hover:border-blue-300/60"}`}
      onClick={() => onCardClick(pg)}
    >
      {/* Compare checkbox */}
      {compareMode && (
        <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} onClick={(e: any) => { e.stopPropagation(); onSelectCompare(pg.id); }} className={`absolute top-3 left-3 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors ${isCompareSelected ? "bg-violet-500 text-white" : "bg-white/90 text-slate-600 hover:bg-white"}`}>
          {isCompareSelected ? <Check size={16} /> : <Plus size={16} />}
        </motion.button>
      )}

      {/* Quick view */}
      <button onClick={(e: any) => { e.stopPropagation(); onQuickView(pg); }} className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white">
        <Eye size={13} /> Quick View
      </button>

      {/* Favorite */}
      <button onClick={(e: any) => { e.stopPropagation(); onFavorite(pg.id); }} className={`absolute z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${compareMode ? "top-3 left-14" : "top-3 left-3"} ${isFav ? "bg-rose-50" : "bg-white/90 hover:bg-white"}`}>
        <Heart size={16} className={isFav ? "text-rose-500 fill-rose-500" : "text-slate-500"} />
      </button>

      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <motion.img key={imgUrl} src={imgUrl} alt={pg.pg_name} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onError={(e: any) => { e.target.src = "/no-image.png"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className={`absolute bottom-3 left-3 ${catColor} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>{catLabel}</div>
        {pg.distance != null && <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Navigation size={10} />{pg.distance.toFixed(1)} km</div>}
        {hasMulti && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{photos.map((_: any, i: number) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImg ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />)}</div>}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{pg.pg_name}</h3>
        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3"><MapPin size={14} /><span className="line-clamp-1">{pg.area}{pg.city ? `, ${pg.city}` : ""}</span></div>

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">₹{formatPrice(price)}</span>
            <span className="text-xs text-slate-400 font-medium">{pg.pg_category === "to_let" ? "/month" : "onwards"}</span>
          </div>
          {pg.pg_category !== "to_let" && <span className="text-xs text-emerald-600 font-semibold">per month</span>}
        </div>

        {/* PG info */}
        {pg.pg_category !== "to_let" && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge color="green"><Bed size={12} />{pg.available_rooms || 0} Beds</Badge>
            {isFillingFast && <Badge color="amber"><Flame size={12} />Filling Fast</Badge>}
          </div>
        )}

        {/* To-let info */}
        {pg.pg_category === "to_let" && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pg.bhk_type && <Badge color="slate"><Home size={11} />{pg.bhk_type}</Badge>}
            {pg.furnishing_type && <Badge color="slate">{pg.furnishing_type}</Badge>}
            {pg.family_allowed && <Badge color="slate">Family</Badge>}
            {pg.ready_to_move && <Badge color="blue">Ready to Move</Badge>}
          </div>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { c: pg.ac_available, i: Snowflake, l: "AC" },
            { c: pg.wifi_available, i: Wifi, l: "WiFi" },
            { c: pg.parking_available, i: Car, l: "Parking" },
            { c: pg.food_available, i: Utensils, l: "Food" },
          ].map((a, i) => a.c ? <span key={i} className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md font-medium"><a.i size={11} />{a.l}</span> : null)}
          {pg.is_verified && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-bold"><Shield size={11} />Verified</span>}
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={(e: any) => { e.stopPropagation(); onContact(pg); }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow flex items-center justify-center gap-2">
          <MessageCircle size={15} /> Contact Owner
        </motion.button>
      </div>
    </motion.div>
  );
};

/* ================================================================
   QUICK VIEW MODAL
   ================================================================ */
const QuickViewModal = ({ pg, onClose, onBook, onSaveFav }: any) => {
  const [isFav, setIsFav] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const photos = useMemo(() => (pg.photos?.filter((p: string) => p?.trim()) || []), [pg.photos]);
  const hasMulti = photos.length > 1;
  const price = useMemo(() => getPriceRange(pg).min || getEffectiveRent(pg), [pg]);

  useEffect(() => {
    if (hasMulti) { const iv = setInterval(() => setCurrentImg(p => (p + 1) % photos.length), 3000); return () => clearInterval(iv); }
  }, [hasMulti, photos.length]);

  const imgUrl = useMemo(() => {
    if (hasMulti && photos[currentImg]) return getCorrectImageUrl(photos[currentImg]);
    if (pg.main_photo) return getCorrectImageUrl(pg.main_photo);
    if (photos[0]) return getCorrectImageUrl(photos[0]);
    return "/no-image.png";
  }, [hasMulti, photos, currentImg, pg.main_photo]);

  const toggleFav = () => { const n = !isFav; setIsFav(n); onSaveFav(pg.id, n); };
  const wa = () => window.open(`https://wa.me/${pg.contact_phone || ""}?text=Hi, I'm interested in ${pg.pg_name}`, "_blank");
  const call = () => window.location.href = `tel:${pg.contact_phone || ""}`;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Image */}
          <div className="relative h-64">
            <motion.img key={imgUrl} src={imgUrl} alt={pg.pg_name} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onError={(e: any) => { e.target.src = "/no-image.png"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"><X size={20} /></button>
            <button onClick={toggleFav} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"><Heart size={18} className={isFav ? "text-rose-500 fill-rose-500" : "text-slate-600"} /></button>
            {hasMulti && <><button onClick={() => setCurrentImg(p => (p - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white"><ChevronLeft size={18} /></button><button onClick={() => setCurrentImg(p => (p + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white"><ChevronRight size={18} /></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">{photos.map((_: any, i: number) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImg ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />)}</div>
            </>}
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{pg.pg_name}</h2>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4"><MapPin size={16} />{pg.area}{pg.city ? `, ${pg.city}` : ""}{pg.distance != null && <span className="ml-2 text-blue-600 font-semibold flex items-center gap-1"><Navigation size={12} />{pg.distance.toFixed(1)} km</span>}</div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2"><span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">₹{formatPrice(price)}</span><span className="text-sm text-slate-400">{pg.pg_category === "to_let" ? "/month" : "onwards"}</span></div>
              {pg.pg_category !== "to_let" && <span className="text-sm text-emerald-600 font-semibold">per month</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {pg.pg_category !== "to_let" && <Badge color="green"><Bed size={13} />{pg.available_rooms || 0} Beds Left</Badge>}
              {pg.available_rooms != null && pg.available_rooms < 5 && pg.available_rooms > 0 && <Badge color="amber"><Flame size={13} />Filling Fast</Badge>}
              {pg.is_verified && <Badge color="blue"><Shield size={13} />Verified</Badge>}
              {pg.min_stay_months && pg.min_stay_months > 0 && <Badge color="slate"><Calendar size={13} />Min {pg.min_stay_months} months</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[{ c: pg.ac_available, i: Snowflake, l: "Air Conditioning" }, { c: pg.wifi_available, i: Wifi, l: "Free WiFi" }, { c: pg.parking_available, i: Car, l: "Parking" }, { c: pg.food_available, i: Utensils, l: "Food Available" }].map((a, i) => a.c ? <div key={i} className="flex items-center gap-2 text-sm text-slate-600"><a.i size={16} className="text-blue-500" />{a.l}</div> : null)}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
              <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><Check size={16} />What happens next?</h4>
              <ul className="space-y-1.5 text-sm text-blue-700"><li>Owner receives your inquiry instantly</li><li>Owner gets WhatsApp notification</li><li>Owner will contact you within 24 hours</li><li>No payment required now</li></ul>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={call} className="flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"><Phone size={16} />Call</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={wa} className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-shadow"><MessageCircle size={16} />WhatsApp</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { onBook(pg); onClose(); }} className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"><Check size={16} />Book Now</motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================================================================
   BOOKING MODAL
   ================================================================ */
const BookingModal = ({ pg, onClose, onBook }: any) => {
  const [roomType, setRoomType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pg) return;
    setRoomType(getDefault());
  }, [pg]);

  const getDefault = () => {
    if (pg.pg_category === "pg") {
      if (pg.single_sharing) return "Single Sharing";
      if (pg.double_sharing) return "Double Sharing";
      if (pg.triple_sharing) return "Triple Sharing";
      if (pg.four_sharing) return "Four Sharing";
      if (pg.single_room) return "Single Room";
      if (pg.double_room) return "Double Room";
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room) return "Single Room";
      if (pg.co_living_double_room) return "Double Room";
      if (pg.coliving_three_sharing) return "Triple Sharing";
      if (pg.coliving_four_sharing) return "Four Sharing";
    } else {
      if (pg.price_1bhk) return "1BHK";
      if (pg.price_2bhk) return "2BHK";
      if (pg.price_3bhk) return "3BHK";
      if (pg.price_4bhk) return "4BHK";
    }
    return "";
  };

  const getTypes = () => {
    const t: { value: string; label: string }[] = [];
    const add = (v: string, p?: number) => { if (p && p > 0) t.push({ value: v, label: `${v} - ₹${formatPrice(p)}` }); };
    if (pg.pg_category === "pg") {
      add("Single Sharing", pg.single_sharing); add("Double Sharing", pg.double_sharing); add("Triple Sharing", pg.triple_sharing);
      add("Four Sharing", pg.four_sharing); add("Single Room", pg.single_room); add("Double Room", pg.double_room);
    } else if (pg.pg_category === "coliving") {
      add("Single Room", pg.co_living_single_room); add("Double Room", pg.co_living_double_room);
      add("Triple Sharing", pg.coliving_three_sharing); add("Four Sharing", pg.coliving_four_sharing);
    } else {
      add("1BHK", pg.price_1bhk); add("2BHK", pg.price_2bhk); add("3BHK", pg.price_3bhk); add("4BHK", pg.price_4bhk);
    }
    return t;
  };

  const getPrice = () => {
    if (!roomType) return null;
    if (pg.pg_category === "pg") {
      if (roomType === "Single Sharing") return pg.single_sharing; if (roomType === "Double Sharing") return pg.double_sharing;
      if (roomType === "Triple Sharing") return pg.triple_sharing; if (roomType === "Four Sharing") return pg.four_sharing;
      if (roomType === "Single Room") return pg.single_room; if (roomType === "Double Room") return pg.double_room;
    } else if (pg.pg_category === "coliving") {
      if (roomType === "Single Room") return pg.co_living_single_room; if (roomType === "Double Room") return pg.co_living_double_room;
      if (roomType === "Triple Sharing") return pg.coliving_three_sharing; if (roomType === "Four Sharing") return pg.coliving_four_sharing;
    } else {
      if (roomType === "1BHK") return pg.price_1bhk; if (roomType === "2BHK") return pg.price_2bhk;
      if (roomType === "3BHK") return pg.price_3bhk; if (roomType === "4BHK") return pg.price_4bhk;
    }
    return null;
  };

  const selPrice = getPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onBook({ roomType }); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div><h2 className="text-xl font-bold text-slate-900">Contact Owner</h2><p className="text-sm text-slate-500">{pg.pg_name}</p></div>
            <button onClick={onClose} disabled={loading} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50"><X size={20} /></button>
          </div>

          <div className="p-6">
            <p className="text-sm text-slate-600 mb-5">Your details will be shared with the property owner. They will contact you shortly.</p>
            {pg.min_stay_months && pg.min_stay_months > 0 && <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-700"><Lock size={16} />Minimum stay: {pg.min_stay_months} months</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">{pg.pg_category === "to_let" ? "BHK Type" : "Room Type"} *</label>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="">Select {pg.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                  {getTypes().map((t, i) => <option key={i} value={t.value}>{t.label}</option>)}
                </select>
                {selPrice != null && selPrice > 0 && <p className="mt-2 text-sm font-bold text-emerald-600">Selected: {roomType} — ₹{formatPrice(selPrice)}/month</p>}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2"><Info size={16} className="text-emerald-600" /><span className="text-sm font-bold text-emerald-800">What happens next?</span></div>
                <ul className="space-y-1.5 text-sm text-emerald-700"><li>Owner receives your inquiry instantly</li><li>Owner gets WhatsApp notification</li><li>Owner will contact you within 24 hours</li><li>No payment required now</li></ul>
              </div>

              <div className="flex gap-3">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} disabled={loading} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</motion.button>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <><Loader2 size={18} className="animate-spin" />Processing...</> : <><MessageCircle size={18} />Contact Owner</>}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================================================================
   COMPARE MODAL
   ================================================================ */
const CompareModal = ({ selectedPGs, allPGs, onClose }: any) => {
  const compareData = useMemo(() => allPGs.filter((pg: PG) => selectedPGs.has(pg.id)), [selectedPGs, allPGs]);
  if (!compareData.length) return null;

  const getVal = (pg: PG, f: string) => {
    switch (f) {
      case "name": return pg.pg_name;
      case "type": return pg.pg_category === "pg" ? "PG" : pg.pg_category === "coliving" ? "Co-Living" : "To-Let";
      case "price": return `₹${formatPrice(getEffectiveRent(pg))}`;
      case "deposit": return `₹${formatPrice(pg.deposit_amount || pg.security_deposit || 0)}`;
      case "location": return pg.area || pg.city || "N/A";
      case "food": return pg.food_available ? (pg.food_type === "veg" ? "Vegetarian" : pg.food_type === "non-veg" ? "Non-Veg" : "Both") : "No";
      case "wifi": return pg.wifi_available ? "Yes" : "No";
      case "ac": return pg.ac_available ? "Yes" : "No";
      case "parking": return pg.parking_available ? "Yes" : "No";
      case "attached_bathroom": return pg.attached_bathroom ? "Yes" : "No";
      case "available_rooms": return String(pg.available_rooms || 0);
      case "min_stay": return pg.min_stay_months ? `${pg.min_stay_months} months` : "N/A";
      case "distance": return pg.distance ? `${pg.distance.toFixed(1)} km` : "N/A";
      default: return "N/A";
    }
  };

  const features = [
    { key: "name", label: "Property" }, { key: "type", label: "Type" }, { key: "price", label: "Monthly Rent" },
    { key: "deposit", label: "Deposit" }, { key: "location", label: "Location" }, { key: "distance", label: "Distance" },
    { key: "food", label: "Food" }, { key: "wifi", label: "WiFi" }, { key: "ac", label: "AC" },
    { key: "parking", label: "Parking" }, { key: "attached_bathroom", label: "Attached Bath" },
    { key: "available_rooms", label: "Available" }, { key: "min_stay", label: "Min Stay" },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><BarChart3 size={20} className="text-violet-600" /></div>
              <div><h2 className="text-xl font-bold text-slate-900">Compare Properties</h2><p className="text-sm text-slate-500">{compareData.length} properties</p></div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} /></button>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-50 text-left rounded-tl-2xl min-w-[140px] text-xs font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  {compareData.map((pg: PG, idx: number) => (
                    <th key={pg.id} className={`p-4 bg-slate-50 text-center min-w-[200px] ${idx === compareData.length - 1 ? "rounded-tr-2xl" : ""}`}>
                      <div className="font-bold text-slate-900 mb-2 text-sm">{pg.pg_name}</div>
                      {pg.photos?.[0] && <img src={getCorrectImageUrl(pg.photos[0])} alt={pg.pg_name} className="w-full h-24 object-cover rounded-xl mb-2" onError={(e: any) => { e.target.src = "/no-image.png"; }} />}
                      {pg.distance != null && <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold"><Navigation size={10} />{pg.distance.toFixed(1)} km</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, fi) => (
                  <tr key={f.key} className={fi % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-4 font-bold text-sm text-slate-700 border-b border-slate-100">{f.label}</td>
                    {compareData.map((pg: PG) => {
                      const val = getVal(pg, f.key);
                      const isBool = ["wifi", "ac", "parking", "attached_bathroom"].includes(f.key);
                      const isPrice = f.key === "price";
                      return (
                        <td key={`${pg.id}-${f.key}`} className="p-4 text-center border-b border-slate-100">
                          {isBool ? <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${val === "Yes" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{val === "Yes" ? <Check size={12} /> : <X size={12} />}{val}</span>
                            : isPrice ? <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-extrabold">{val}</span>
                              : <span className="text-sm text-slate-600">{val}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Close Comparison</motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================================================================
   EMPTY STATE
   ================================================================ */
const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-6 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 mb-12">
    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
      <Search size={36} className="text-blue-300" />
    </motion.div>
    <h3 className="text-2xl font-bold text-slate-800 mb-3">No properties found</h3>
    <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any properties matching your filters. Try adjusting your search criteria.</p>
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onReset} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto">
      <RotateCcw size={16} /> Reset All Filters
    </motion.button>
  </motion.div>
);

/* ================================================================
   LOADING STATES
   ================================================================ */
const LoadingState = () => (
  <div className="text-center py-20">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6" />
    <p className="text-slate-500 font-semibold">Loading properties...</p>
  </div>
);

const LoadingMore = () => (
  <div className="text-center py-10">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-[3px] border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
    <p className="text-slate-500 text-sm">Loading more properties...</p>
  </div>
);

/* ================================================================
   NOTIFICATION
   ================================================================ */
const Toast = ({ message, isError, onClose }: { message: string; isError?: boolean; onClose?: () => void }) => (
  <motion.div initial={{ opacity: 0, x: 100, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className={`fixed top-5 right-5 z-[5000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl ${isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}>
    {isError ? <X size={20} /> : <Check size={20} />}
    <span className="font-semibold text-sm">{message}</span>
    {onClose && <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>}
  </motion.div>
);

/* ================================================================
   LOCATION INFO BAR
   ================================================================ */
const LocationInfo = ({ address, onRefresh, loading }: { address: string | null; onRefresh: () => void; loading: boolean }) => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-50 via-sky-50/50 to-white rounded-2xl p-4 mb-6 border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><MapPin size={20} className="text-blue-600" /></div>
      <div>
        <div className="flex items-center gap-2"><span className="font-bold text-blue-800 text-sm">{address ? `Near ${address}` : "Your Location"}</span><span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-bold uppercase">Within 5km</span></div>
        <p className="text-xs text-blue-600 mt-0.5">Showing nearby properties sorted by distance</p>
      </div>
    </div>
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onRefresh} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 shrink-0">
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{loading ? "Refreshing..." : "Refresh"}
    </motion.button>
  </motion.div>
);

/* ================================================================
   LOCATION BANNER
   ================================================================ */
const LocationBanner = ({ onAllow, onDeny, loading }: { onAllow: () => void; onDeny: () => void; loading: boolean }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative overflow-hidden rounded-2xl mb-6 p-5 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
    <div className="absolute right-8 top-1/2 -translate-y-1/2"><div className="w-16 h-16 rounded-full border-2 border-white/20 animate-ping" /><div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: "0.5s" }} /></div>
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Navigation size={24} className="text-white" /></div>
        <div><h3 className="text-white font-bold text-base flex items-center gap-2"><MapPin size={16} />Find Properties Near You</h3><p className="text-white/80 text-sm">Allow location access to see properties within 5km</p></div>
      </div>
      <div className="flex gap-3 shrink-0">
        <button onClick={onDeny} className="px-5 py-2.5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-colors backdrop-blur-sm">Not Now</button>
        <button onClick={onAllow} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white text-blue-600 text-sm font-bold hover:bg-white/90 transition-colors shadow-lg">{loading ? "Detecting..." : "Allow Location"}</button>
      </div>
    </div>
  </motion.div>
);

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function UserPGSearch() {
  const navigate = useNavigate();

  const [allPGs, setAllPGs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [activeTab, setActiveTab] = useState("all");
  const [showBudget, setShowBudget] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState<PG | null>(null);
  const [bookingPG, setBookingPG] = useState<PG | null>(null);
  const [showLocBanner, setShowLocBanner] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [activeQuick, setActiveQuick] = useState<Set<string>>(new Set());
  const [notif, setNotif] = useState<{ message: string; isError?: boolean } | null>(null);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddr, setUserAddr] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try { const s = localStorage.getItem("pg_favs"); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });

  const [filters, setFilters] = useState({
    location: "", minBudget: 0, maxBudget: 100000, food: false, ac: false,
    wifi: false, parking: false, sort: "", nearMe: false, foodType: "",
  });

  const showNotification = (message: string, isError = false) => {
    setNotif({ message, isError });
    setTimeout(() => setNotif(null), 3000);
  };

  const saveFavs = (f: Set<number>) => {
    try { localStorage.setItem("pg_favs", JSON.stringify([...f])); } catch { }
  };

  const toggleFav = (id: number) => {
    setFavorites(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); showNotification("Removed from favorites"); }
      else { n.add(id); showNotification("Added to favorites"); }
      saveFavs(n);
      return n;
    });
  };

  const loadPGs = async (pageToLoad = 1, isMore = false) => {
    try {
      if (!isMore) setLoading(true); else setLoadingMore(true);
      let url = `/pg/search/advanced?page=${pageToLoad}&limit=${PAGE_SIZE}`;
      let sortParam = "relevance";
      if (filters.sort === "low") sortParam = "price_low";
      else if (filters.sort === "high") sortParam = "price_high";
      else if (filters.sort === "new") sortParam = "newest";
      else if (filters.sort === "distance" && userLoc) sortParam = "nearest";
      url += `&sort_by=${sortParam}`;
      if (filters.location) url += `&search=${encodeURIComponent(filters.location)}`;
      if (userLoc && filters.nearMe) url += `&lat=${userLoc.lat}&lng=${userLoc.lng}`;

      const res = await api.get(url);
      if (res.data?.data) {
        let raw = res.data.data;
        if (userLoc) raw = raw.map((pg: PG) => pg.latitude && pg.longitude ? { ...pg, distance: getDistanceKm(userLoc.lat, userLoc.lng, pg.latitude, pg.longitude) } : pg);
        const processed = processPGData(raw);
        if (!isMore || pageToLoad === 1) setAllPGs(processed); else setAllPGs(p => [...p, ...processed]);
        setHasMore(res.data.hasMore === true);
        setTotal(res.data.total || 0);
        setPage(pageToLoad);
      }
      setLoading(false); setLoadingMore(false);
    } catch (err) { console.error(err); setLoading(false); setLoadingMore(false); }
  };

  const resetFetch = useCallback(() => { setPage(1); loadPGs(1, false); }, []);
  const loadMore = useCallback(() => { if (!loadingMore && hasMore && !loading) loadPGs(page + 1, true); }, [loadingMore, hasMore, loading, page]);

  const applyQuickFilter = useCallback((id: string) => {
    const map: Record<string, any> = {
      near_me: { nearMe: true, sort: "distance" },
      ac_room: { ac: true },
      wifi: { wifi: true },
      parking: { parking: true },
      veg_food: { foodType: "veg" },
    };
    const newSet = new Set(activeQuick);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (id === "near_me") setFilters(p => ({ ...p, nearMe: false }));
      else if (id === "veg_food") setFilters(p => ({ ...p, foodType: "" }));
      else if (map[id]?.field) setFilters(p => ({ ...p, [map[id].field]: false }));
    } else {
      newSet.add(id);
      if (id === "near_me") { setFilters(p => ({ ...p, nearMe: true, sort: "distance" })); detectLoc(); }
      else setFilters(p => ({ ...p, ...map[id] }));
    }
    setActiveQuick(newSet);
    showNotification(`${newSet.has(id) ? "Applied" : "Removed"} ${id.replace("_", " ")}`);
    resetFetch();
  }, [activeQuick, resetFetch]);

  const detectLoc = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data.address) setUserAddr(data.address.suburb || data.address.neighbourhood || data.address.city_district || "");
        } catch { }
        setLocLoading(false);
      },
      () => { setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleHeroSearch = useCallback((q: string) => { setFilters(p => ({ ...p, location: q })); resetFetch(); }, [resetFetch]);
  const filterByArea = useCallback((area: string) => { const newLoc = filters.location === area ? "" : area; setFilters(p => ({ ...p, location: newLoc, nearMe: false })); showNotification(`${newLoc ? "Showing" : "Removed"} ${area}`); resetFetch(); }, [filters.location, resetFetch]);
  const handleBudgetChange = useCallback((min: number, max: number) => { setFilters(p => ({ ...p, minBudget: min, maxBudget: max })); showNotification(`Budget: ₹${formatPrice(min)} - ₹${formatPrice(max)}`); resetFetch(); }, [resetFetch]);
  const resetFilters = useCallback(() => { setFilters({ location: "", minBudget: 0, maxBudget: 100000, food: false, ac: false, wifi: false, parking: false, sort: "", nearMe: false, foodType: "" }); setActiveQuick(new Set()); showNotification("All filters reset"); resetFetch(); }, [resetFetch]);
  const handleFilterChange = useCallback((f: any) => { setFilters(p => ({ ...p, ...f })); resetFetch(); }, [resetFetch]);
  const handleNearMe = useCallback(() => { if (!filters.nearMe) detectLoc(); setFilters(p => ({ ...p, nearMe: !p.nearMe, sort: !p.nearMe ? "distance" : p.sort })); resetFetch(); }, [filters.nearMe, resetFetch]);

  const applyFilters = useCallback((data: PG[]) => {
    let f = [...data];
    if (filters.location) f = f.filter(pg => `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`.toLowerCase().includes(filters.location.toLowerCase()));
    f = f.filter(pg => { const r = getEffectiveRent(pg); return r >= filters.minBudget && r <= filters.maxBudget; });
    if (filters.food) f = f.filter(pg => pg.food_available);
    if (filters.ac) f = f.filter(pg => pg.ac_available);
    if (filters.wifi) f = f.filter(pg => pg.wifi_available);
    if (filters.parking) f = f.filter(pg => pg.parking_available);
    if (filters.foodType) f = f.filter(pg => pg.food_type === filters.foodType);
    if (filters.sort === "low") f.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    else if (filters.sort === "high") f.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    else if (filters.sort === "new") f.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (filters.sort === "distance" && userLoc) f.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    return f;
  }, [filters, userLoc]);

  const filtered = useMemo(() => {
    const f = applyFilters(allPGs);
    return activeTab === "all" ? f : f.filter(p => p.pg_category === activeTab);
  }, [applyFilters, allPGs, activeTab]);

  const resultCount = filtered.length;
  const hasActive = filters.location !== "" || filters.minBudget > 0 || filters.maxBudget < 100000 || filters.food || filters.ac || filters.wifi || filters.parking || filters.foodType !== "" || activeQuick.size > 0;

  const getTitle = () => { switch (activeTab) { case "pg": return "PG Accommodations"; case "coliving": return "Co-Living Spaces"; case "to_let": return "To-Let Homes"; default: return "All Properties"; } };

  useEffect(() => { resetFetch(); }, []);

  return (
    <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-6 bg-slate-50/50">
      <AnimatePresence>{notif && <Toast message={notif.message} isError={notif.isError} onClose={() => setNotif(null)} />}</AnimatePresence>

      {showLocBanner && !userLoc && <LocationBanner onAllow={() => { detectLoc(); setShowLocBanner(false); }} onDeny={() => setShowLocBanner(false)} loading={locLoading} />}

      <HeroSection onSearch={handleHeroSearch} />
      <WhyChooseSection />

      {userLoc && <LocationInfo address={userAddr} onRefresh={detectLoc} loading={locLoading} />}

      <QuickFiltersBar active={activeQuick} onToggle={applyQuickFilter} />
      <PopularAreas selected={filters.location} onSelect={filterByArea} />

      <FilterBar filters={filters} onFilterChange={handleFilterChange} onBudget={() => setShowBudget(true)} onNearMe={handleNearMe} onCompareToggle={() => { setCompareMode(p => { if (p) setSelectedCompare(new Set()); return !p; }); }} onReset={resetFilters} compareMode={compareMode} hasActive={hasActive} userLocation={!!userLoc} />

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {propertyTabs.map(tab => (
          <motion.button key={tab.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeTab === tab.id ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
            <tab.icon size={15} />{tab.label}
          </motion.button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <motion.h2 key={getTitle()} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-extrabold text-slate-900">{getTitle()}</motion.h2>
          <p className="text-sm text-slate-500 mt-1">{resultCount} {resultCount === 1 ? "property" : "properties"} found</p>
        </div>
        {compareMode && selectedCompare.size > 0 && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (selectedCompare.size < 2) showNotification("Select at least 2 properties", true); else setShowCompare(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-colors">
            <BarChart3 size={16} />Compare ({selectedCompare.size})
          </motion.button>
        )}
      </div>

      {/* Grid */}
      {loading ? <LoadingState /> : filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((pg, i) => (
              <PropertyCard key={pg.id} pg={pg} onQuickView={setQuickViewPG} onFavorite={toggleFav} onContact={setBookingPG} onCardClick={(p: PG) => navigate(`/pg/${p.id}`)}
                isFav={favorites.has(pg.id)} isCompareSelected={selectedCompare.has(pg.id)} onSelectCompare={(id: number) => { setSelectedCompare(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else if (n.size < 3) n.add(id); else showNotification("Max 3 properties for compare", true); return n; }); }} compareMode={compareMode} index={i} />
            ))}
          </div>
          {!loading && hasMore && !loadingMore && filtered.length < total && (
            <div className="text-center mt-10 mb-16">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={loadMore} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow inline-flex items-center gap-2">
                Load More Properties
              </motion.button>
            </div>
          )}
          {loadingMore && <LoadingMore />}
        </>
      ) : <EmptyState onReset={resetFilters} />}

      {/* Modals */}
      <AnimatePresence>
        {showBudget && <BudgetModal minBudget={filters.minBudget} maxBudget={filters.maxBudget} onChange={handleBudgetChange} onClose={() => setShowBudget(false)} />}
        {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={setBookingPG} onSaveFav={(id: number, fav: boolean) => { if (fav && !favorites.has(id)) toggleFav(id); else if (!fav && favorites.has(id)) toggleFav(id); }} />}
        {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={async (data: any) => { try { const res = await api.post(`/bookings/${bookingPG.id}`, { room_type: data.roomType }); showNotification(res.data.message || "Owner will contact you"); setBookingPG(null); } catch (err: any) { showNotification(err.response?.data?.message || "Error", true); } }} />}
        {showCompare && <CompareModal selectedPGs={selectedCompare} allPGs={allPGs} onClose={() => { setShowCompare(false); setSelectedCompare(new Set()); setCompareMode(false); }} />}
      </AnimatePresence>
    </div>
  );
}
