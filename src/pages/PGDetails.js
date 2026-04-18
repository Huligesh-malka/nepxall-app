import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";
import {
  X,
  MapPin,
  Phone,
  Home,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Shield,
  Calendar,
  Clock,
  UserCheck,
  BookOpen,
  Info,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Coffee,
  Utensils,
  Snowflake,
  Navigation,
  Star,
  DollarSign,
  Key,
  DoorOpen,
  Sofa,
  Flame,
  Leaf,
  Zap,
  Building,
  Hash,
  Sun,
  Moon,
  Tv,
  Wind,
  Sparkles,
  Pill,
  Dumbbell,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Camera,
  Video,
  Layers,
  Grid3X3,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  TrendingUp,
  Award,
  ThumbsUp,
  Eye,
  MessageCircle,
  Mail,
  Linkedin,
  Facebook,
  Twitter,
  Copy,
  HeartHandshake,
  Landmark,
  Bus,
  Train,
  ShoppingBag,
  Gym,
  Church,
  Hospital,
  Banknote,
  Store,
  UtensilsCrossed,
  Plane,
  Briefcase,
  GraduationCap,
  HomeIcon,
  Settings,
  Lock,
  Unlock,
  Moon as MoonIcon,
  Coffee as CoffeeIcon,
  Trash2,
  Edit3,
  MoreHorizontal,
  Compass,
  Map as MapIcon,
  Navigation2,
  Loader,
  RefreshCw,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ZapOff,
  Thermometer,
  Droplets,
  Wind as WindIcon,
  SunMedium,
  MoonStar,
  Sparkle,
  Gem,
  Crown,
  Trophy,
  Target,
  Rocket,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Cpu,
  HardDrive,
  Monitor,
  Printer,
  Scissors,
  Shirt,
  Watch as WatchIcon,
  Globe,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudSun,
  CloudMoon,
  Rainbow,
  Stars,
  Galaxy,
  Orbit,
  Satellite,
  Telescope,
  Microscope,
  FlaskRound,
  Beaker,
  Atom,
  Dna,
  Brain,
  HeartPulse,
  Bone,
  Activity,
  Baby,
  Cat,
  Dog,
  Bird,
  Fish,
  Rabbit,
  Turtle,
  TreePine,
  Flower2,
  Sprout,
  LeafyGreen,
  Apple,
  Carrot,
  Grape,
  Pizza,
  Candy,
  Cake,
  IceCream,
  Milk,
  Beef,
  EggFried,
  Salad,
  Sandwich,
  Soup,
  Coffee as CoffeeIcon2,
  Beer,
  Wine,
  GlassWater,
  CupSoda,
  Martini,
  Cocktail,
  Champagne,
  Whiskey,
  Vape,
  Syringe,
  Pill as PillIcon,
  Stethoscope,
  Ambulance,
  Bandage,
  Thermometer as ThermometerIcon,
  Droplet as DropletIcon,
  Wind as WindIcon2,
  Waves,
  Zap as ZapIcon,
  Flame as FlameIcon,
  Factory,
  Warehouse,
  Store as StoreIcon,
  ShoppingCart,
  Package,
  Box,
  Truck,
  Forklift,
  ConveyorBelt,
  Crane,
  Drill,
  Hammer,
  Wrench as WrenchIcon,
  Screwdriver,
  Saw,
  Axe,
  Pickaxe,
  Shovel,
  Bucket,
  Broom,
  Mop,
  Soap,
  Brush,
  SprayCan,
  Paintbrush,
  Palette,
  PenTool,
  Ruler,
  Compass as CompassIcon,
  Calculator,
  FileText,
  Folder,
  Book,
  Newspaper,
  Library,
  Music,
  Mic,
  Radio,
  Podcast,
  Headphones as HeadphonesIcon,
  Speaker,
  Vinyl,
  Disc,
  Cassette,
  Cd,
  Dvd,
  Film,
  Clapperboard,
  Tv2,
  MonitorPlay,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop,
  Computer,
  Server,
  Database,
  Cloud as CloudIcon,
  Wifi as WifiIcon,
  Bluetooth,
  Usb,
  Plug,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Power,
  PowerOff,
} from "lucide-react";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BASE_URL}${relativePath}`;
    }
  }
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) return `${BASE_URL}${uploadsMatch[0]}`;
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "0";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "0";
  try {
    return numPrice.toLocaleString('en-IN');
  } catch (error) {
    return numPrice.toString();
  }
};

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;
const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
};
const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 6);
  return max.toISOString().split('T')[0];
};

// ================= NEW MODERN DESIGN SYSTEM =================
// Fresh color palette - Aurora theme
const colors = {
  primary: "#0F172A",      // Deep navy
  secondary: "#FF6B6B",    // Coral red
  accent: "#4ECDC4",       // Turquoise
  success: "#06D6A0",      // Mint green
  warning: "#FFD166",      // Yellow
  danger: "#EF476F",       // Pink red
  purple: "#9D4EDD",       // Purple
  orange: "#FB8B67",       // Orange
  dark: "#1A1A2E",         // Dark blue
  light: "#F8F9FA",        // Off white
  glass: "rgba(255, 255, 255, 0.1)",
  glassDark: "rgba(26, 26, 46, 0.7)",
  gradient1: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  gradient2: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  gradient3: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  gradient4: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  gradient5: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  gradient6: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  gradient7: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  gradient8: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
};

// Modern styles with unique design elements
const modernStyles = {
  // Global
  page: {
    background: `radial-gradient(circle at 0% 0%, ${colors.dark} 0%, #0F0F23 100%)`,
    minHeight: "100vh",
    fontFamily: "'Inter', 'Poppins', system-ui, sans-serif",
    position: "relative",
    color: "#E2E8F0",
  },
  container: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "2rem 2rem 6rem",
    position: "relative",
    zIndex: 2,
  },
  // Animated background
  animatedBg: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
    fontSize: "0.875rem",
    position: "relative",
    zIndex: 2,
  },
  breadcrumbLink: {
    color: colors.accent,
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
    textDecoration: "none",
    "&:hover": { color: colors.secondary, textDecoration: "underline" },
  },
  breadcrumbSeparator: { color: "#475569" },
  breadcrumbCurrent: { color: "#F1F5F9", fontWeight: "600" },
  propertyCode: {
    marginLeft: "auto",
    background: "rgba(78, 205, 196, 0.2)",
    backdropFilter: "blur(8px)",
    padding: "0.25rem 1rem",
    borderRadius: "40px",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: colors.accent,
    border: `1px solid ${colors.accent}40`,
  },
  // Gallery - Glass morphism
  gallery: {
    position: "relative",
    borderRadius: "2rem",
    overflow: "hidden",
    marginBottom: "2rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
  },
  media: {
    width: "100%",
    height: "520px",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  galleryNav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "white",
  },
  galleryCounter: {
    position: "absolute",
    bottom: "1rem",
    right: "1rem",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    padding: "0.5rem 1rem",
    borderRadius: "40px",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  noMedia: {
    height: "320px",
    background: `linear-gradient(135deg, ${colors.purple}40, ${colors.accent}40)`,
    borderRadius: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2rem",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Main Info Card - Glass card
  mainCard: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderRadius: "2rem",
    padding: "2rem",
    marginBottom: "2rem",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "all 0.3s ease",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: `linear-gradient(135deg, #FFFFFF, ${colors.accent})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
    letterSpacing: "-0.02em",
  },
  address: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#94A3B8",
    fontSize: "0.875rem",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  btnPrimary: {
    background: colors.gradient1,
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "40px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 14px rgba(102,126,234,0.4)",
  },
  btnSecondary: {
    background: colors.gradient2,
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "40px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  btnOutline: {
    background: "transparent",
    border: `2px solid ${colors.accent}`,
    color: colors.accent,
    padding: "0.75rem 1.5rem",
    borderRadius: "40px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  badge: {
    padding: "0.375rem 1rem",
    borderRadius: "40px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1.5rem",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "1.5rem",
    padding: "1.5rem",
    marginTop: "1rem",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  // Two column layout
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
    marginBottom: "2rem",
    position: "relative",
    zIndex: 2,
  },
  // Sections - Neon glass
  section: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: "1.5rem",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.3s ease",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "0.75rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#F1F5F9",
  },
  // Price Grid - Neon cards
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1rem",
  },
  priceCard: {
    background: "rgba(0,0,0,0.4)",
    padding: "1rem",
    borderRadius: "1rem",
    textAlign: "center",
    border: "1px solid rgba(78,205,196,0.3)",
    transition: "all 0.2s",
  },
  // Facilities
  facilityCategories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  facilityChip: {
    padding: "0.5rem 1rem",
    borderRadius: "40px",
    background: "rgba(255,255,255,0.1)",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
    color: "#E2E8F0",
  },
  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "1rem",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  // Rules - Expandable cards
  rulesSection: {
    marginBottom: "1rem",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1rem",
    overflow: "hidden",
  },
  rulesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    background: "rgba(0,0,0,0.3)",
    cursor: "pointer",
  },
  rulesContent: {
    padding: "1rem",
    display: "grid",
    gap: "0.75rem",
  },
  ruleItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem",
    borderRadius: "1rem",
    background: "rgba(0,0,0,0.2)",
  },
  // Map
  mapContainer: {
    borderRadius: "1rem",
    overflow: "hidden",
    marginBottom: "1rem",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Nearby Highlights
  highlightsPanel: {
    background: "rgba(15,23,42,0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: "1.5rem",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  categoriesPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    padding: "1rem",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  highlightItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // Nearby PGs
  nearbyCard: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1rem",
    marginBottom: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "rgba(0,0,0,0.2)",
  },
  // Contact Card - Gradient
  contactCard: {
    background: `linear-gradient(135deg, ${colors.purple}40, ${colors.accent}20)`,
    backdropFilter: "blur(12px)",
    padding: "1.5rem",
    borderRadius: "1.5rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Sticky Bar
  stickyBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(15,23,42,0.95)",
    backdropFilter: "blur(12px)",
    padding: "1rem 2rem",
    boxShadow: "0 -8px 30px rgba(0,0,0,0.3)",
    zIndex: 1000,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  stickyContent: {
    maxWidth: "1440px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.9)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  modalContainer: {
    background: "rgba(15,23,42,0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: "2rem",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "2rem",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Toast
  toast: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    background: colors.success,
    color: "white",
    padding: "1rem 1.5rem",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    zIndex: 3000,
    animation: "slideIn 0.3s ease",
  },
  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "1rem",
    background: colors.dark,
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(78,205,196,0.2)",
    borderTopColor: colors.accent,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  // Additional styles
  description: { lineHeight: 1.6, color: "#CBD5E1" },
  priceCategory: { marginBottom: "20px" },
  priceCategoryTitle: { fontSize: "16px", fontWeight: "600", marginBottom: "12px", paddingLeft: "8px", borderLeft: `4px solid ${colors.accent}` },
  additionalCharges: { marginTop: "20px", padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "16px" },
  foodCharges: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(6,214,160,0.1)", borderRadius: "16px", marginTop: "16px" },
  locationDetails: { marginTop: "16px", padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "16px" },
  infoRow: { padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px" },
  waterSource: { marginTop: "16px", padding: "12px", background: "rgba(78,205,196,0.1)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px" },
  contactItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  availabilityCard: { background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", borderRadius: "1.5rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.08)" },
  availabilityItem: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  availabilityNote: { marginTop: "12px", fontSize: "12px", textAlign: "center", opacity: 0.7 },
  noPriceContainer: { textAlign: "center", padding: "40px", opacity: 0.7 },
  noFacilitiesContainer: { textAlign: "center", padding: "40px", opacity: 0.7 },
  mapPopup: { padding: "8px", background: colors.dark, borderRadius: "12px", color: "white" },
  mapPopupButton: { background: colors.accent, border: "none", padding: "4px 12px", borderRadius: "20px", color: colors.dark, fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  phoneLink: { color: colors.accent, textDecoration: "none" },
  emailLink: { color: colors.accent, textDecoration: "none" },
};

// Helper Components
const Section = ({ title, icon, children, badge }) => (
  <div style={modernStyles.section}>
    <div style={modernStyles.sectionHeader}>
      <h3 style={modernStyles.sectionTitle}>
        <span style={{ fontSize: "1.25rem" }}>{icon}</span> {title}
      </h3>
      {badge && <span style={modernStyles.badge}>{badge}</span>}
    </div>
    {children}
  </div>
);

const BookingModal = ({ pg, onClose, onBook, loading }) => {
  const [bookingData, setBookingData] = useState({ checkInDate: "", roomType: "" });
  const [selectedPrice, setSelectedPrice] = useState(null);

  const getRoomTypes = () => {
    const types = [];
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ value: "Single Sharing", price: pg.single_sharing });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ value: "Double Sharing", price: pg.double_sharing });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ value: "Triple Sharing", price: pg.triple_sharing });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ value: "Four Sharing", price: pg.four_sharing });
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ value: "Single Room", price: pg.single_room });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ value: "Double Room", price: pg.double_room });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ value: "Single Room", price: pg.co_living_single_room });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ value: "Double Room", price: pg.co_living_double_room });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ value: "1BHK", price: pg.price_1bhk });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ value: "2BHK", price: pg.price_2bhk });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ value: "3BHK", price: pg.price_3bhk });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ value: "4BHK", price: pg.price_4bhk });
    }
    return types;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook(bookingData);
  };

  return (
    <div style={modernStyles.modalOverlay}>
      <div style={modernStyles.modalContainer}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "white" }}><X size={16} /></button>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "white" }}>Book {pg?.pg_name}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#CBD5E1" }}>Check-in Date *</label>
            <input type="date" name="checkInDate" value={bookingData.checkInDate} onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })} required min={getTomorrowDate()} max={getMaxDate()} style={{ width: "100%", padding: "0.75rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#CBD5E1" }}>Room Type *</label>
            <select name="roomType" value={bookingData.roomType} onChange={(e) => { setBookingData({ ...bookingData, roomType: e.target.value }); const type = getRoomTypes().find(t => t.value === e.target.value); setSelectedPrice(type?.price); }} required style={{ width: "100%", padding: "0.75rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white" }}>
              <option value="">Select type</option>
              {getRoomTypes().map((type, i) => <option key={i} value={type.value}>{type.value} - ₹{formatPrice(type.price)}/month</option>)}
            </select>
            {selectedPrice && <p style={{ marginTop: "0.5rem", color: colors.accent, fontWeight: "500" }}>Selected: ₹{formatPrice(selectedPrice)}/month</p>}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", borderRadius: "40px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: colors.gradient1, color: "white", border: "none", borderRadius: "40px", padding: "0.75rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {loading ? <div style={modernStyles.spinner} /> : <>Confirm Booking <ArrowRight size={16} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const prices = [];
  if (isPG) {
    if (pg.single_sharing && Number(pg.single_sharing) > 0) prices.push({ label: "Single Sharing", price: pg.single_sharing });
    if (pg.double_sharing && Number(pg.double_sharing) > 0) prices.push({ label: "Double Sharing", price: pg.double_sharing });
    if (pg.triple_sharing && Number(pg.triple_sharing) > 0) prices.push({ label: "Triple Sharing", price: pg.triple_sharing });
    if (pg.four_sharing && Number(pg.four_sharing) > 0) prices.push({ label: "Four Sharing", price: pg.four_sharing });
    if (pg.single_room && Number(pg.single_room) > 0) prices.push({ label: "Single Room", price: pg.single_room });
    if (pg.double_room && Number(pg.double_room) > 0) prices.push({ label: "Double Room", price: pg.double_room });
  } else if (isCoLiving) {
    if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) prices.push({ label: "Single Room", price: pg.co_living_single_room });
    if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) prices.push({ label: "Double Room", price: pg.co_living_double_room });
  } else {
    if (pg.price_1bhk && Number(pg.price_1bhk) > 0) prices.push({ label: "1 BHK", price: pg.price_1bhk });
    if (pg.price_2bhk && Number(pg.price_2bhk) > 0) prices.push({ label: "2 BHK", price: pg.price_2bhk });
    if (pg.price_3bhk && Number(pg.price_3bhk) > 0) prices.push({ label: "3 BHK", price: pg.price_3bhk });
    if (pg.price_4bhk && Number(pg.price_4bhk) > 0) prices.push({ label: "4 BHK", price: pg.price_4bhk });
  }

  return (
    <div style={modernStyles.priceGrid}>
      {prices.map((p, i) => (
        <div key={i} style={modernStyles.priceCard}>
          <div style={{ fontSize: "0.875rem", color: "#94A3B8" }}>{p.label}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.accent }}>₹{formatPrice(p.price)}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>/ month</div>
        </div>
      ))}
    </div>
  );
};

const FacilityItem = ({ icon, label }) => (
  <div style={modernStyles.facilityItem}>
    <span style={{ fontSize: "1.25rem" }}>{icon}</span>
    <span style={{ fontWeight: "500", flex: 1 }}>{label}</span>
    <Check size={16} style={{ color: colors.success }} />
  </div>
);

const HighlightItem = ({ name, type, icon, onView }) => (
  <div style={modernStyles.highlightItem} onClick={onView}>
    <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${colors.purple}, ${colors.accent})`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: "600", color: "#F1F5F9" }}>{name}</div>
      <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{type}</div>
    </div>
    <ExternalLink size={16} style={{ color: colors.accent }} />
  </div>
);

const NearbyPGCard = ({ pg, onClick, distance }) => {
  const getPrice = () => {
    if (pg.pg_category === "coliving") return pg.co_living_single_room || pg.co_living_double_room;
    if (pg.pg_category === "to_let") return pg.price_1bhk || pg.price_2bhk;
    return pg.single_sharing || pg.double_sharing;
  };
  return (
    <div style={modernStyles.nearbyCard} onClick={onClick}>
      <div style={{ width: "70px", height: "70px", background: "rgba(255,255,255,0.1)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🏠</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: "700", marginBottom: "0.25rem", color: "#F1F5F9" }}>{pg.pg_name}</h4>
        <p style={{ fontSize: "0.75rem", color: "#94A3B8", display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={12} /> {pg.area || pg.city}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
          <span style={{ fontWeight: "700", color: colors.accent }}>₹{formatPrice(getPrice())}/mo</span>
          {distance && <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.5rem", borderRadius: "20px" }}>{distance.toFixed(1)} km</span>}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState("all");
  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("all");
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [expandedRules, setExpandedRules] = useState({ visitors: true, lifestyle: false, pets: false, restrictions: false, legal: false });

  const highlightCategories = [
    { id: "all", label: "All", icon: "📍", color: colors.accent },
    { id: "education", label: "Education", icon: "🎓", color: colors.purple },
    { id: "transport", label: "Transport", icon: "🚌", color: colors.gradient3 },
    { id: "healthcare", label: "Healthcare", icon: "🏥", color: colors.danger },
    { id: "shopping", label: "Shopping", icon: "🛒", color: colors.warning },
    { id: "food", label: "Food", icon: "🍽️", color: colors.orange },
  ];

  const facilityCategories = [
    { id: "all", label: "All", icon: "🏢" },
    { id: "room", label: "Room", icon: "🛏️" },
    { id: "kitchen", label: "Kitchen", icon: "🍳" },
    { id: "safety", label: "Safety", icon: "🛡️" },
    { id: "basic", label: "Basic", icon: "💧" },
  ];

  const getAllFacilities = () => [
    { key: "cupboard_available", label: "Cupboard", icon: "🗄️", category: "room" },
    { key: "ac_available", label: "Air Conditioner", icon: "❄️", category: "room" },
    { key: "wifi_available", label: "Wi-Fi", icon: "📶", category: "basic" },
    { key: "parking_available", label: "Parking", icon: "🚗", category: "safety" },
    { key: "cctv", label: "CCTV", icon: "📹", category: "safety" },
    { key: "geyser", label: "Geyser", icon: "🚿", category: "room" },
    { key: "food_available", label: "Food Available", icon: "🍽️", category: "basic" },
    { key: "laundry_available", label: "Laundry", icon: "🧺", category: "basic" },
    { key: "gym", label: "Gym", icon: "🏋️", category: "common" },
    { key: "power_backup", label: "Power Backup", icon: "🔋", category: "basic" },
  ];

  const getFilteredFacilities = () => {
    const all = getAllFacilities();
    const active = all.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true"));
    if (selectedFacilityCategory === "all") return active;
    return active.filter(f => f.category === selectedFacilityCategory);
  };

  const getTrueFacilitiesCount = (cat) => {
    const all = getAllFacilities();
    const active = all.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true"));
    if (cat === "all") return active.length;
    return active.filter(f => f.category === cat).length;
  };

  const getStartingPrice = () => {
    if (!pg) return "0";
    if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) return pg.co_living_single_room;
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) return pg.co_living_double_room;
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) return pg.price_1bhk;
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) return pg.price_2bhk;
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) return pg.price_3bhk;
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) return pg.price_4bhk;
    } else {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) return pg.single_sharing;
      if (pg.double_sharing && Number(pg.double_sharing) > 0) return pg.double_sharing;
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) return pg.triple_sharing;
      if (pg.four_sharing && Number(pg.four_sharing) > 0) return pg.four_sharing;
      if (pg.single_room && Number(pg.single_room) > 0) return pg.single_room;
      if (pg.double_room && Number(pg.double_room) > 0) return pg.double_room;
    }
    return "0";
  };

  useEffect(() => {
    const fetchPG = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        if (res.data?.success) {
          const data = res.data.data;
          setPG(data);
          const photos = (data.photos || []).map(p => ({ type: "photo", src: getCorrectImageUrl(p) }));
          let videos = [];
          try { videos = JSON.parse(data.videos || "[]").map(v => ({ type: "video", src: getCorrectImageUrl(v) })); } catch(e) {}
          setMedia([...photos, ...videos]);
          if (data.latitude && data.longitude) setMapCenter([data.latitude, data.longitude]);
        } else throw new Error("Failed to fetch");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPG();
  }, [id]);

  useEffect(() => {
    if (!pg?.latitude) return;
    // Mock nearby places
    const mockHighlights = [
      { name: "ABC College", type: "college", category: "education", icon: "🎓", coordinates: [pg.latitude + 0.01, pg.longitude + 0.01] },
      { name: "City Hospital", type: "hospital", category: "healthcare", icon: "🏥", coordinates: [pg.latitude - 0.008, pg.longitude + 0.005] },
      { name: "Metro Station", type: "metro", category: "transport", icon: "🚇", coordinates: [pg.latitude + 0.005, pg.longitude - 0.01] },
      { name: "Grand Mall", type: "mall", category: "shopping", icon: "🛍️", coordinates: [pg.latitude - 0.012, pg.longitude - 0.005] },
    ];
    setNearbyHighlights(mockHighlights);

    const fetchNearby = async () => {
      try {
        const res = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (res.data?.success) {
          const pgs = res.data.data.slice(0, 3).map(p => ({ ...p, distance: Math.random() * 2 + 0.5 }));
          setNearbyPGs(pgs);
        }
      } catch (err) { console.error(err); }
    };
    fetchNearby();
  }, [pg, id]);

  const handleBookNow = () => {
    if (!user) {
      setNotification("Please login to book");
      navigate("/register", { state: { redirectTo: `/pg/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (data) => {
    setBookingLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await api.post(`/bookings/${id}`, { check_in_date: data.checkInDate, room_type: data.roomType }, { headers: { Authorization: `Bearer ${token}` } });
      setNotification(res.data?.message || "Booking request sent!");
      setShowBookingModal(false);
    } catch (err) {
      setNotification(err.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCallOwner = () => {
    if (pg?.contact_phone) window.location.href = `tel:${pg.contact_phone}`;
    else setNotification("Contact will be visible after booking");
  };

  const handleViewOnMap = (highlight) => {
    if (highlight.coordinates) {
      setMapCenter(highlight.coordinates);
      document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleViewNearbyPG = (pgId) => {
    if (pgId && pgId !== 'all') navigate(`/pg/${pgId}`);
    else navigate("/properties");
  };

  const toggleRulesSection = (section) => {
    setExpandedRules(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasRulesContent = () => {
    if (!pg) return false;
    const rules = ['visitor_allowed', 'couple_allowed', 'family_allowed', 'smoking_allowed', 'drinking_allowed', 'outside_food_allowed', 'parties_allowed', 'pets_allowed', 'late_night_entry_allowed'];
    return rules.some(r => pg[r] === true || pg[r] === "true");
  };

  const hasFacilitiesContent = () => getFilteredFacilities().length > 0;
  const hasPriceDetails = () => {
    if (!pg) return false;
    if (pg.pg_category === "to_let") return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk;
    if (pg.pg_category === "coliving") return pg.co_living_single_room || pg.co_living_double_room;
    return pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room;
  };
  const hasLocation = pg?.latitude && pg?.longitude;

  if (authLoading || loading) return <div style={modernStyles.loadingContainer}><div style={modernStyles.spinner} /><p style={{ color: "#94A3B8" }}>Loading...</p></div>;
  if (error || !pg) return <div style={modernStyles.loadingContainer}><AlertCircle size={48} color={colors.danger} /><p style={{ color: "#94A3B8" }}>{error || "Property not found"}</p><button onClick={() => navigate("/")} style={modernStyles.btnPrimary}>Go Home</button></div>;

  const current = media[index];
  const isToLet = pg.pg_category === "to_let";
  const isCoLiving = pg.pg_category === "coliving";
  const startingPrice = getStartingPrice();
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";

  const ruleSections = [
    { id: "visitors", title: "👥 Visitor Rules", items: ["visitor_allowed", "couple_allowed", "family_allowed"] },
    { id: "lifestyle", title: "🚬 Lifestyle Rules", items: ["smoking_allowed", "drinking_allowed", "outside_food_allowed"] },
    { id: "pets", title: "🐾 Pets & Entry", items: ["pets_allowed", "late_night_entry_allowed"] },
  ];

  return (
    <div style={modernStyles.page}>
      <div style={modernStyles.container}>
        {/* Breadcrumb */}
        <div style={modernStyles.breadcrumb}>
          <span style={modernStyles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
          <span style={modernStyles.breadcrumbSeparator}>/</span>
          <span style={modernStyles.breadcrumbLink} onClick={() => navigate("/properties")}>Properties</span>
          <span style={modernStyles.breadcrumbSeparator}>/</span>
          <span style={modernStyles.breadcrumbCurrent}>{pg.pg_name}</span>
          <span style={modernStyles.propertyCode}>{getPGCode(pg.id)}</span>
        </div>

        {/* Gallery */}
        <div style={modernStyles.gallery}>
          {current?.type === "photo" ? (
            <img src={current.src} alt={pg.pg_name} style={modernStyles.media} onError={(e) => { e.target.src = "https://placehold.co/800x500?text=Image+Not+Found"; }} />
          ) : (
            <video src={current?.src} controls style={modernStyles.media} />
          )}
          {media.length > 1 && (
            <>
              <button style={{ ...modernStyles.galleryNav, left: "1rem" }} onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}><ChevronLeft size={24} /></button>
              <button style={{ ...modernStyles.galleryNav, right: "1rem" }} onClick={() => setIndex(i => (i + 1) % media.length)}><ChevronRight size={24} /></button>
              <div style={modernStyles.galleryCounter}>{index + 1} / {media.length}</div>
            </>
          )}
        </div>

        {/* Main Info */}
        <div style={modernStyles.mainCard}>
          <div style={modernStyles.headerRow}>
            <div>
              <h1 style={modernStyles.title}>{pg.pg_name}</h1>
              <p style={modernStyles.address}><MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}`}</p>
              {pg.landmark && <p style={modernStyles.address}><Navigation size={14} /> Near {pg.landmark}</p>}
            </div>
            <div style={modernStyles.actionButtons}>
              <button style={modernStyles.btnPrimary} onClick={handleBookNow}><BookOpen size={18} /> Book Now</button>
              {hasOwnerContact && <button style={modernStyles.btnSecondary} onClick={handleCallOwner}><Phone size={18} /> Call</button>}
              {hasLocation && <button style={modernStyles.btnOutline} onClick={() => window.open(`https://maps.google.com/?q=${pg.latitude},${pg.longitude}`)}><Navigation size={18} /> Directions</button>}
            </div>
          </div>
          <div style={modernStyles.badgeRow}>
            <span style={{ ...modernStyles.badge, background: colors.gradient1 }}>{isToLet ? "🏠 House" : isCoLiving ? "🤝 Co-Living" : "🏢 PG"}</span>
            {pg.pg_type && <span style={{ ...modernStyles.badge, background: colors.gradient2 }}>{pg.pg_type === "boys" ? "👨 Boys" : pg.pg_type === "girls" ? "👩 Girls" : "Mixed"}</span>}
            <span style={{ ...modernStyles.badge, background: pg.available_rooms > 0 ? colors.success : colors.danger }}>{pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Occupied"}</span>
          </div>
          <div style={modernStyles.statsGrid}>
            <div style={modernStyles.statItem}><div style={modernStyles.statIcon}>💰</div><div><div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Starting from</div><div style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.accent }}>₹{formatPrice(startingPrice)}</div></div></div>
            <div style={modernStyles.statItem}><div style={modernStyles.statIcon}>🏠</div><div><div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Total Rooms</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{pg.total_rooms || "—"}</div></div></div>
            <div style={modernStyles.statItem}><div style={modernStyles.statIcon}>✅</div><div><div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Facilities</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{getTrueFacilitiesCount("all")}+</div></div></div>
            <div style={modernStyles.statItem}><div style={modernStyles.statIcon}>📍</div><div><div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Nearby Places</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{nearbyHighlights.length}+</div></div></div>
          </div>
        </div>

        {/* Two Column */}
        <div style={modernStyles.twoColumn}>
          <div>
            {pg.description && <Section title="About" icon="📝"><p style={modernStyles.description}>{pg.description}</p></Section>}
            {hasPriceDetails() && <Section title="Price Details" icon="💰"><PriceDetails pg={pg} /></Section>}
            {hasFacilitiesContent() && (
              <Section title="Facilities & Amenities" icon="🏠" badge={`${getTrueFacilitiesCount("all")} items`}>
                <div style={modernStyles.facilityCategories}>
                  {facilityCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedFacilityCategory(cat.id)} style={{ ...modernStyles.facilityChip, background: selectedFacilityCategory === cat.id ? colors.gradient1 : "rgba(255,255,255,0.05)", color: "white" }}>{cat.icon} {cat.label} ({getTrueFacilitiesCount(cat.id)})</button>
                  ))}
                </div>
                <div style={modernStyles.facilitiesGrid}>
                  {getFilteredFacilities().map((f, i) => <FacilityItem key={i} icon={f.icon} label={f.label} />)}
                </div>
              </Section>
            )}
            {hasRulesContent() && (
              <Section title="House Rules" icon="📜">
                {ruleSections.map(section => {
                  const activeItems = section.items.filter(item => pg[item] === true || pg[item] === "true");
                  if (activeItems.length === 0) return null;
                  return (
                    <div key={section.id} style={modernStyles.rulesSection}>
                      <div style={modernStyles.rulesHeader} onClick={() => toggleRulesSection(section.id)}>
                        <span style={{ fontWeight: "600" }}>{section.title}</span>
                        <ChevronDown size={18} style={{ transform: expandedRules[section.id] ? "rotate(180deg)" : "none" }} />
                      </div>
                      {expandedRules[section.id] && (
                        <div style={modernStyles.rulesContent}>
                          {activeItems.map(item => (
                            <div key={item} style={modernStyles.ruleItem}>
                              <span style={{ fontSize: "1.25rem" }}>✅</span>
                              <span style={{ flex: 1 }}>{item.replace(/_/g, ' ').replace('allowed', '').trim()} Allowed</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}
          </div>

          <div>
            {hasLocation && (
              <Section title="Location" icon="📍">
                <div id="map-section" style={modernStyles.mapContainer}>
                  <MapContainer center={mapCenter} zoom={15} style={{ height: "250px", width: "100%", borderRadius: "1rem" }} key={`${mapCenter[0]}-${mapCenter[1]}`}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[pg.latitude, pg.longitude]}>
                      <Popup><div style={modernStyles.mapPopup}><strong>{pg.pg_name}</strong><br /><button style={modernStyles.mapPopupButton} onClick={handleBookNow}>Book Now</button></div></Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div style={modernStyles.locationDetails}>
                  <div style={modernStyles.infoRow}><strong>Area:</strong> {pg.area}</div>
                  <div style={modernStyles.infoRow}><strong>Landmark:</strong> {pg.landmark || "—"}</div>
                  <div style={modernStyles.infoRow}><strong>City:</strong> {pg.city}</div>
                </div>
              </Section>
            )}

            <Section title="Nearby Places" icon="🗺️">
              <div style={modernStyles.highlightsPanel}>
                <div style={modernStyles.categoriesPills}>
                  {highlightCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedHighlightCategory(cat.id)} style={{ ...modernStyles.facilityChip, background: selectedHighlightCategory === cat.id ? cat.color : "rgba(255,255,255,0.05)" }}>{cat.icon} {cat.label}</button>
                  ))}
                </div>
                <div>
                  {nearbyHighlights.filter(h => selectedHighlightCategory === "all" || h.category === selectedHighlightCategory).map((h, i) => <HighlightItem key={i} name={h.name} type={h.type} icon={h.icon} onView={() => handleViewOnMap(h)} />)}
                </div>
              </div>
            </Section>

            {nearbyPGs.length > 0 && (
              <Section title="Nearby Properties" icon="🏘️">
                {nearbyPGs.map(p => <NearbyPGCard key={p.id} pg={p} onClick={() => handleViewNearbyPG(p.id)} distance={p.distance} />)}
              </Section>
            )}

            <div style={modernStyles.contactCard}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Phone size={20} /> Contact Owner</h3>
              {pg.contact_person && <p><strong>👤 {pg.contact_person}</strong></p>}
              {hasOwnerContact && <p style={{ margin: "0.5rem 0" }}>📞 <a href={`tel:${pg.contact_phone}`} style={modernStyles.phoneLink}>{pg.contact_phone}</a></p>}
              {pg.contact_email && <p>✉️ {pg.contact_email}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={handleBookNow} style={{ flex: 1, background: "white", color: colors.dark, border: "none", borderRadius: "40px", padding: "0.5rem", fontWeight: "600", cursor: "pointer" }}>Book Now</button>
                {hasOwnerContact && <button onClick={handleCallOwner} style={{ flex: 1, background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", borderRadius: "40px", padding: "0.5rem", cursor: "pointer" }}>Call</button>}
              </div>
            </div>

            {(pg.total_rooms || pg.available_rooms) && (
              <div style={modernStyles.availabilityCard}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem" }}>🛏 Availability</h3>
                {pg.total_rooms && <div style={modernStyles.availabilityItem}><span>Total {isToLet ? "Properties" : "Rooms"}</span><span style={{ fontWeight: "600" }}>{pg.total_rooms}</span></div>}
                <div style={modernStyles.availabilityItem}><span>Available Now</span><span style={{ fontWeight: "600", color: pg.available_rooms > 0 ? colors.success : colors.danger }}>{pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}</span></div>
                <div style={modernStyles.availabilityNote}>{pg.available_rooms > 0 ? "Book now to secure your spot!" : "Check back later"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bar */}
      <div style={modernStyles.stickyBar}>
        <div style={modernStyles.stickyContent}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: colors.accent }}>₹{formatPrice(startingPrice)}/month</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{pg.pg_name} • {pg.area}</div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleBookNow} style={modernStyles.btnPrimary}><BookOpen size={18} /> Book Now</button>
            {hasOwnerContact && <button onClick={handleCallOwner} style={modernStyles.btnSecondary}><Phone size={18} /> Call</button>}
          </div>
        </div>
      </div>

      {showBookingModal && <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} loading={bookingLoading} />}
      {notification && <div style={modernStyles.toast}>{notification.includes("✅") ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {notification}</div>}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .leaflet-container {
          background: #1A1A2E;
        }
        .leaflet-popup-content-wrapper {
          background: #0F172A;
          color: white;
          border-radius: 12px;
        }
        .leaflet-popup-tip {
          background: #0F172A;
        }
      `}</style>
    </div>
  );
}