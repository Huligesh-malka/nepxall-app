import React, { useEffect, useState, useRef } from "react";
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
  Bed,
  Bath,
  Wifi,
  Car,
  Calendar,
  Clock,
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
  Sofa,
  Flame,
  Leaf,
  Zap,
  Building,
  Sun,
  Tv,
  Wind,
  Sparkles,
  Dumbbell,
  Wrench,
  Shield,
  Users,
  Volume2,
  VolumeX,
  Camera,
  Video,
  ChevronDown,
  TrendingUp,
  Award,
  ThumbsUp,
  Eye,
  MessageCircle,
  Mail,
  Linkedin,
  Facebook,
  Twitter,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  HeartHandshake,
  Landmark,
  Bus,
  Train,
  ShoppingBag,
  Dumbbell as GymIcon,
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
  Moon,
  Coffee as CoffeeIcon,
  Trash2,
  Edit3,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume1,
  Volume,
  CameraOff,
  Layers,
  Grid,
  List,
  Compass,
  Map as MapIcon,
  Navigation2,
  Loader,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
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
  Droplet,
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
  Zap as ZapIcon2,
  Flame as FlameIcon2,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets as DropletsIcon,
  Wind as WindIcon3,
  Sun as SunIcon,
  Moon as MoonIcon,
  CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon,
  CloudLightning as CloudLightningIcon,
  CloudSun as CloudSunIcon,
  CloudMoon as CloudMoonIcon,
  Rainbow as RainbowIcon,
  Sparkles as SparklesIcon,
  Stars as StarsIcon,
  Galaxy as GalaxyIcon,
  Orbit as OrbitIcon,
  Satellite as SatelliteIcon,
  Telescope as TelescopeIcon,
  Microscope as MicroscopeIcon,
  FlaskRound as FlaskRoundIcon,
  Beaker as BeakerIcon,
  Atom as AtomIcon,
  Dna as DnaIcon,
  Brain as BrainIcon,
  HeartPulse as HeartPulseIcon,
  Bone as BoneIcon,
  Activity as ActivityIcon,
  Baby as BabyIcon,
  Cat as CatIcon,
  Dog as DogIcon,
  Bird as BirdIcon,
  Fish as FishIcon,
  Rabbit as RabbitIcon,
  Turtle as TurtleIcon,
  TreePine as TreePineIcon,
  Flower2 as Flower2Icon,
  Sprout as SproutIcon,
  LeafyGreen as LeafyGreenIcon,
  Apple as AppleIcon,
  Carrot as CarrotIcon,
  Grape as GrapeIcon,
  Pizza as PizzaIcon,
  Candy as CandyIcon,
  Cake as CakeIcon,
  IceCream as IceCreamIcon,
  Milk as MilkIcon,
  Beef as BeefIcon,
  EggFried as EggFriedIcon,
  Salad as SaladIcon,
  Sandwich as SandwichIcon,
  Soup as SoupIcon,
  Coffee as CoffeeIcon3,
  Beer as BeerIcon,
  Wine as WineIcon,
  GlassWater as GlassWaterIcon,
  CupSoda as CupSodaIcon,
  Martini as MartiniIcon,
  Cocktail as CocktailIcon,
  Champagne as ChampagneIcon,
  Whiskey as WhiskeyIcon,
  Vape as VapeIcon,
  Syringe as SyringeIcon,
  Pill as PillIcon2,
  Stethoscope as StethoscopeIcon,
  Ambulance as AmbulanceIcon,
  Bandage as BandageIcon,
  Thermometer as ThermometerIcon2,
  Droplet as DropletIcon,
  Wind as WindIcon4,
  Waves as WavesIcon,
  Zap as ZapIcon3,
  Flame as FlameIcon3,
  Factory as FactoryIcon,
  Warehouse as WarehouseIcon,
  Store as StoreIcon2,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Box as BoxIcon,
  Truck as TruckIcon,
  Forklift as ForkliftIcon,
  ConveyorBelt as ConveyorBeltIcon,
  Crane as CraneIcon,
  Drill as DrillIcon,
  Hammer as HammerIcon,
  Wrench as WrenchIcon2,
  Screwdriver as ScrewdriverIcon,
  Saw as SawIcon,
  Axe as AxeIcon,
  Pickaxe as PickaxeIcon,
  Shovel as ShovelIcon,
  Bucket as BucketIcon,
  Broom as BroomIcon,
  Mop as MopIcon,
  Soap as SoapIcon,
  Brush as BrushIcon,
  SprayCan as SprayCanIcon,
  Paintbrush as PaintbrushIcon,
  Palette as PaletteIcon,
  PenTool as PenToolIcon,
  Ruler as RulerIcon,
  Compass as CompassIcon2,
  Calculator as CalculatorIcon,
  FileText as FileTextIcon,
  Folder as FolderIcon,
  Book as BookIcon,
  Newspaper as NewspaperIcon,
  Library as LibraryIcon,
  Music as MusicIcon,
  Mic as MicIcon,
  Radio as RadioIcon,
  Podcast as PodcastIcon,
  Headphones as HeadphonesIcon2,
  Speaker as SpeakerIcon,
  Vinyl as VinylIcon,
  Disc as DiscIcon,
  Cassette as CassetteIcon,
  Cd as CdIcon,
  Dvd as DvdIcon,
  Film as FilmIcon,
  Clapperboard as ClapperboardIcon,
  Tv as TvIcon,
  MonitorPlay as MonitorPlayIcon,
  Smartphone as SmartphoneIcon2,
  Tablet as TabletIcon2,
  Laptop as LaptopIcon,
  Computer as ComputerIcon,
  Server as ServerIcon,
  Database as DatabaseIcon,
  Cloud as CloudIcon2,
  Wifi as WifiIcon2,
  Bluetooth as BluetoothIcon,
  Usb as UsbIcon,
  Plug as PlugIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  BatteryFull as BatteryFullIcon,
  BatteryLow as BatteryLowIcon,
  BatteryMedium as BatteryMediumIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
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

// ================= NEW DESIGN SYSTEM =================
// Color palette: Deep teal, coral, gold, cream, with glassmorphism
const colors = {
  primary: "#0F172A", // Deep slate
  secondary: "#F59E0B", // Amber
  accent: "#EC4899", // Pink
  success: "#10B981", // Emerald
  info: "#3B82F6", // Blue
  warning: "#F97316", // Orange
  danger: "#EF4444", // Red
  dark: "#0F172A",
  light: "#F8FAFC",
  glass: "rgba(255, 255, 255, 0.1)",
  glassDark: "rgba(15, 23, 42, 0.7)",
  gradient1: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  gradient2: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  gradient3: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  gradient4: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  gradient5: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
};

const newStyles = {
  // Global & animations
  "@keyframes float": {
    "0%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-10px)" },
    "100%": { transform: "translateY(0px)" },
  },
  "@keyframes pulse": {
    "0%": { transform: "scale(1)", opacity: 1 },
    "50%": { transform: "scale(1.05)", opacity: 0.8 },
    "100%": { transform: "scale(1)", opacity: 1 },
  },
  "@keyframes shimmer": {
    "0%": { backgroundPosition: "-1000px 0" },
    "100%": { backgroundPosition: "1000px 0" },
  },
  "@keyframes slideIn": {
    "0%": { transform: "translateX(100%)", opacity: 0 },
    "100%": { transform: "translateX(0)", opacity: 1 },
  },
  "@keyframes fadeInUp": {
    "0%": { transform: "translateY(30px)", opacity: 0 },
    "100%": { transform: "translateY(0)", opacity: 1 },
  },
  page: {
    background: "radial-gradient(circle at 10% 20%, rgba(15,23,42,0.05) 0%, rgba(245,158,11,0.02) 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 1.5rem 6rem",
  },
  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
    fontSize: "0.875rem",
  },
  breadcrumbLink: {
    color: colors.secondary,
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
    textDecoration: "none",
    "&:hover": { textDecoration: "underline", opacity: 0.8 },
  },
  breadcrumbSeparator: { color: "#94A3B8" },
  breadcrumbCurrent: { color: colors.dark, fontWeight: "600" },
  propertyCode: {
    marginLeft: "auto",
    background: "rgba(15,23,42,0.08)",
    padding: "0.25rem 1rem",
    borderRadius: "40px",
    fontSize: "0.75rem",
    fontWeight: "600",
    backdropFilter: "blur(4px)",
  },
  // Media Gallery
  gallery: {
    position: "relative",
    borderRadius: "2rem",
    overflow: "hidden",
    marginBottom: "2rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    background: colors.dark,
  },
  media: {
    width: "100%",
    height: "500px",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  galleryNav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    border: "none",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  galleryCounter: {
    position: "absolute",
    bottom: "1rem",
    right: "1rem",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    padding: "0.5rem 1rem",
    borderRadius: "40px",
    color: "white",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  // Main Content Card
  mainCard: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "2rem",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.3)",
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
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
    letterSpacing: "-0.02em",
  },
  address: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#475569",
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
    background: colors.gradient3,
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
    border: `2px solid ${colors.secondary}`,
    color: colors.secondary,
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
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1.5rem",
    background: "linear-gradient(135deg, #F8FAFC, #EFF6FF)",
    padding: "1.5rem",
    borderRadius: "1.5rem",
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
    background: "white",
    borderRadius: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  // Two column layout
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
    marginBottom: "2rem",
  },
  // Sections
  section: {
    background: "white",
    borderRadius: "1.5rem",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    border: "1px solid #E2E8F0",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #F1F5F9",
    paddingBottom: "0.75rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  // Price Grid
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  priceCard: {
    background: "linear-gradient(135deg, #F8FAFC, #FFFFFF)",
    padding: "1rem",
    borderRadius: "1rem",
    textAlign: "center",
    border: "1px solid #E2E8F0",
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
    background: "#F1F5F9",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "1rem",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
  },
  // Rules
  rulesSection: {
    marginBottom: "1rem",
    border: "1px solid #E2E8F0",
    borderRadius: "1rem",
    overflow: "hidden",
  },
  rulesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    background: "#F8FAFC",
    cursor: "pointer",
  },
  rulesContent: {
    padding: "1rem",
    display: "grid",
    gap: "1rem",
  },
  ruleItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem",
    borderRadius: "1rem",
  },
  // Map
  mapContainer: {
    borderRadius: "1rem",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  // Nearby Highlights
  highlightsPanel: {
    background: "white",
    borderRadius: "1.5rem",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  categoriesPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    padding: "1rem",
    background: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  highlightItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // Nearby PGs
  nearbyCard: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    border: "1px solid #E2E8F0",
    borderRadius: "1rem",
    marginBottom: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // Contact Card
  contactCard: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
    color: "white",
    padding: "1.5rem",
    borderRadius: "1.5rem",
    marginBottom: "1.5rem",
  },
  // Sticky Bar
  stickyBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    padding: "1rem 2rem",
    boxShadow: "0 -8px 30px rgba(0,0,0,0.08)",
    zIndex: 1000,
  },
  stickyContent: {
    maxWidth: "1400px",
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
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  modalContainer: {
    background: "white",
    borderRadius: "2rem",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "2rem",
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
  // Loading & Error
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "1rem",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #E2E8F0",
    borderTopColor: colors.secondary,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Helper components with new design
const Section = ({ title, icon, children, badge }) => (
  <div style={newStyles.section}>
    <div style={newStyles.sectionHeader}>
      <h3 style={newStyles.sectionTitle}>
        <span style={{ fontSize: "1.25rem" }}>{icon}</span> {title}
      </h3>
      {badge && <span style={newStyles.badge}>{badge}</span>}
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
    <div style={newStyles.modalOverlay}>
      <div style={newStyles.modalContainer}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>Book {pg?.pg_name}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Check-in Date *</label>
            <input type="date" name="checkInDate" value={bookingData.checkInDate} onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })} required min={getTomorrowDate()} max={getMaxDate()} style={{ width: "100%", padding: "0.75rem", borderRadius: "1rem", border: "1px solid #CBD5E1" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room Type *</label>
            <select name="roomType" value={bookingData.roomType} onChange={(e) => { setBookingData({ ...bookingData, roomType: e.target.value }); const type = getRoomTypes().find(t => t.value === e.target.value); setSelectedPrice(type?.price); }} required style={{ width: "100%", padding: "0.75rem", borderRadius: "1rem", border: "1px solid #CBD5E1" }}>
              <option value="">Select type</option>
              {getRoomTypes().map((type, i) => <option key={i} value={type.value}>{type.value} - ₹{formatPrice(type.price)}/month</option>)}
            </select>
            {selectedPrice && <p style={{ marginTop: "0.5rem", color: colors.success, fontWeight: "500" }}>Selected: ₹{formatPrice(selectedPrice)}/month</p>}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", borderRadius: "40px", border: "1px solid #CBD5E1", background: "white", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: colors.gradient1, color: "white", border: "none", borderRadius: "40px", padding: "0.75rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {loading ? <div style={newStyles.spinner} /> : <>Confirm Booking <ArrowRight size={16} /></>}
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
    if (pg.single_sharing) prices.push({ label: "Single Sharing", price: pg.single_sharing });
    if (pg.double_sharing) prices.push({ label: "Double Sharing", price: pg.double_sharing });
    if (pg.triple_sharing) prices.push({ label: "Triple Sharing", price: pg.triple_sharing });
    if (pg.four_sharing) prices.push({ label: "Four Sharing", price: pg.four_sharing });
    if (pg.single_room) prices.push({ label: "Single Room", price: pg.single_room });
    if (pg.double_room) prices.push({ label: "Double Room", price: pg.double_room });
  } else if (isCoLiving) {
    if (pg.co_living_single_room) prices.push({ label: "Single Room", price: pg.co_living_single_room });
    if (pg.co_living_double_room) prices.push({ label: "Double Room", price: pg.co_living_double_room });
  } else {
    if (pg.price_1bhk) prices.push({ label: "1 BHK", price: pg.price_1bhk });
    if (pg.price_2bhk) prices.push({ label: "2 BHK", price: pg.price_2bhk });
    if (pg.price_3bhk) prices.push({ label: "3 BHK", price: pg.price_3bhk });
    if (pg.price_4bhk) prices.push({ label: "4 BHK", price: pg.price_4bhk });
  }

  return (
    <div style={newStyles.priceGrid}>
      {prices.map((p, i) => (
        <div key={i} style={newStyles.priceCard}>
          <div style={{ fontSize: "0.875rem", color: "#64748B" }}>{p.label}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.success }}>₹{formatPrice(p.price)}</div>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>/ month</div>
        </div>
      ))}
    </div>
  );
};

const FacilityItem = ({ icon, label, active }) => (
  <div style={{ ...newStyles.facilityItem, opacity: active ? 1 : 0.5 }}>
    <span style={{ fontSize: "1.25rem" }}>{icon}</span>
    <span style={{ fontWeight: "500" }}>{label}</span>
    {active && <Check size={16} style={{ marginLeft: "auto", color: colors.success }} />}
  </div>
);

const HighlightItem = ({ name, type, icon, onView }) => (
  <div style={newStyles.highlightItem} onClick={onView}>
    <div style={{ width: "40px", height: "40px", background: colors.gradient1, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: "600" }}>{name}</div>
      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{type}</div>
    </div>
    <ExternalLink size={16} style={{ color: colors.secondary }} />
  </div>
);

const NearbyPGCard = ({ pg, onClick, distance }) => (
  <div style={newStyles.nearbyCard} onClick={onClick}>
    <div style={{ width: "80px", height: "80px", background: "#E2E8F0", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🏠</div>
    <div style={{ flex: 1 }}>
      <h4 style={{ fontWeight: "700", marginBottom: "0.25rem" }}>{pg.pg_name}</h4>
      <p style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={12} /> {pg.area || pg.city}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
        <span style={{ fontWeight: "700", color: colors.success }}>₹{formatPrice(pg.single_sharing || pg.price_1bhk)}/mo</span>
        {distance && <span style={{ fontSize: "0.75rem", background: "#F1F5F9", padding: "0.25rem 0.5rem", borderRadius: "20px" }}>{distance.toFixed(1)} km</span>}
      </div>
    </div>
  </div>
);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedRules, setExpandedRules] = useState({ visitors: true, lifestyle: false, pets: false, restrictions: false, legal: false });
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const highlightCategories = [
    { id: "all", label: "All", icon: "📍", color: colors.gradient1 },
    { id: "education", label: "Education", icon: "🎓", color: colors.gradient2 },
    { id: "transport", label: "Transport", icon: "🚌", color: colors.gradient3 },
    { id: "healthcare", label: "Healthcare", icon: "🏥", color: colors.gradient4 },
    { id: "shopping", label: "Shopping", icon: "🛒", color: colors.gradient5 },
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
    if (selectedCategory === "all") return active;
    return active.filter(f => f.category === selectedCategory);
  };

  const getTrueFacilitiesCount = (cat) => {
    const all = getAllFacilities();
    const active = all.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true"));
    if (cat === "all") return active.length;
    return active.filter(f => f.category === cat).length;
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
    // Simulate nearby places
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

  if (authLoading || loading) return <div style={newStyles.loadingContainer}><div style={newStyles.spinner} /><p>Loading...</p></div>;
  if (error || !pg) return <div style={newStyles.loadingContainer}><AlertCircle size={48} color={colors.danger} /><p>{error || "Property not found"}</p><button onClick={() => navigate("/")} style={newStyles.btnPrimary}>Go Home</button></div>;

  const current = media[index];
  const isToLet = pg.pg_category === "to_let";
  const isCoLiving = pg.pg_category === "coliving";

  return (
    <div style={newStyles.page}>
      <div style={newStyles.container}>
        {/* Breadcrumb */}
        <div style={newStyles.breadcrumb}>
          <span style={newStyles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
          <span style={newStyles.breadcrumbSeparator}>/</span>
          <span style={newStyles.breadcrumbLink} onClick={() => navigate("/properties")}>Properties</span>
          <span style={newStyles.breadcrumbSeparator}>/</span>
          <span style={newStyles.breadcrumbCurrent}>{pg.pg_name}</span>
          <span style={newStyles.propertyCode}>{getPGCode(pg.id)}</span>
        </div>

        {/* Media Gallery */}
        <div style={newStyles.gallery}>
          {current?.type === "photo" ? (
            <img src={current.src} alt={pg.pg_name} style={newStyles.media} onError={(e) => { e.target.src = "https://placehold.co/800x500?text=Image+Not+Found"; }} />
          ) : (
            <video src={current?.src} controls style={newStyles.media} />
          )}
          {media.length > 1 && (
            <>
              <button style={{ ...newStyles.galleryNav, left: "1rem" }} onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}><ChevronLeft size={24} /></button>
              <button style={{ ...newStyles.galleryNav, right: "1rem" }} onClick={() => setIndex(i => (i + 1) % media.length)}><ChevronRight size={24} /></button>
              <div style={newStyles.galleryCounter}>{index + 1} / {media.length}</div>
            </>
          )}
        </div>

        {/* Main Info Card */}
        <div style={newStyles.mainCard}>
          <div style={newStyles.headerRow}>
            <div>
              <h1 style={newStyles.title}>{pg.pg_name}</h1>
              <p style={newStyles.address}><MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}`}</p>
              {pg.landmark && <p style={newStyles.address}><Navigation size={14} /> Near {pg.landmark}</p>}
            </div>
            <div style={newStyles.actionButtons}>
              <button style={newStyles.btnPrimary} onClick={handleBookNow}><BookOpen size={18} /> Book Now</button>
              {pg.contact_phone && <button style={newStyles.btnSecondary} onClick={handleCallOwner}><Phone size={18} /> Call</button>}
              <button style={newStyles.btnOutline} onClick={() => window.open(`https://maps.google.com/?q=${pg.latitude},${pg.longitude}`)}><Navigation size={18} /> Directions</button>
            </div>
          </div>
          <div style={newStyles.badgeRow}>
            <span style={{ ...newStyles.badge, background: colors.gradient1, color: "white" }}>{isToLet ? "🏠 House" : isCoLiving ? "🤝 Co-Living" : "🏢 PG"}</span>
            {pg.pg_type && <span style={{ ...newStyles.badge, background: colors.gradient2, color: "white" }}>{pg.pg_type === "boys" ? "👨 Boys" : pg.pg_type === "girls" ? "👩 Girls" : "Mixed"}</span>}
            <span style={{ ...newStyles.badge, background: pg.available_rooms > 0 ? colors.success : colors.danger, color: "white" }}>{pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Occupied"}</span>
          </div>
          <div style={newStyles.statsGrid}>
            <div style={newStyles.statItem}><div style={newStyles.statIcon}>💰</div><div><div style={{ fontSize: "0.75rem", color: "#64748B" }}>Starting from</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>₹{formatPrice(pg.single_sharing || pg.price_1bhk)}</div></div></div>
            <div style={newStyles.statItem}><div style={newStyles.statIcon}>🏠</div><div><div style={{ fontSize: "0.75rem", color: "#64748B" }}>Total Rooms</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{pg.total_rooms || "—"}</div></div></div>
            <div style={newStyles.statItem}><div style={newStyles.statIcon}>✅</div><div><div style={{ fontSize: "0.75rem", color: "#64748B" }}>Facilities</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{getTrueFacilitiesCount("all")}+</div></div></div>
            <div style={newStyles.statItem}><div style={newStyles.statIcon}>📍</div><div><div style={{ fontSize: "0.75rem", color: "#64748B" }}>Nearby Places</div><div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{nearbyHighlights.length}+</div></div></div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={newStyles.twoColumn}>
          <div>
            {pg.description && <Section title="About" icon="📝"><p style={{ lineHeight: 1.6, color: "#334155" }}>{pg.description}</p></Section>}
            
            <Section title="Price Details" icon="💰">
              <PriceDetails pg={pg} />
              {pg.security_deposit && <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#FEF2F2", borderRadius: "1rem", color: colors.danger }}>🔒 Security Deposit: ₹{formatPrice(pg.security_deposit)}</div>}
            </Section>

            <Section title="Facilities & Amenities" icon="🏠" badge={`${getTrueFacilitiesCount("all")} items`}>
              <div style={newStyles.facilityCategories}>
                {facilityCategories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ ...newStyles.facilityChip, background: selectedCategory === cat.id ? colors.gradient1 : "#F1F5F9", color: selectedCategory === cat.id ? "white" : "#1E293B" }}>{cat.icon} {cat.label} ({getTrueFacilitiesCount(cat.id)})</button>
                ))}
              </div>
              <div style={newStyles.facilitiesGrid}>
                {getFilteredFacilities().map((f, i) => <FacilityItem key={i} icon={f.icon} label={f.label} active={true} />)}
              </div>
            </Section>

            <Section title="House Rules" icon="📜">
              <div>
                {[
                  { id: "visitors", title: "👥 Visitor Rules", items: [{ key: "visitor_allowed", label: "Visitors Allowed" }, { key: "couple_allowed", label: "Couples Allowed" }, { key: "family_allowed", label: "Family Allowed" }] },
                  { id: "lifestyle", title: "🚬 Lifestyle Rules", items: [{ key: "smoking_allowed", label: "Smoking" }, { key: "drinking_allowed", label: "Drinking" }, { key: "outside_food_allowed", label: "Outside Food" }] },
                  { id: "pets", title: "🐾 Pets & Entry", items: [{ key: "pets_allowed", label: "Pets Allowed" }, { key: "late_night_entry_allowed", label: "Late Night Entry" }] },
                ].map(section => (
                  <div key={section.id} style={newStyles.rulesSection}>
                    <div style={newStyles.rulesHeader} onClick={() => setExpandedRules({ ...expandedRules, [section.id]: !expandedRules[section.id] })}>
                      <span style={{ fontWeight: "600" }}>{section.title}</span>
                      <ChevronDown size={18} style={{ transform: expandedRules[section.id] ? "rotate(180deg)" : "none" }} />
                    </div>
                    {expandedRules[section.id] && (
                      <div style={newStyles.rulesContent}>
                        {section.items.map(item => {
                          const allowed = pg[item.key] === true || pg[item.key] === "true";
                          return (
                            <div key={item.key} style={{ ...newStyles.ruleItem, background: allowed ? "#F0FDF4" : "#FEF2F2" }}>
                              <span style={{ fontSize: "1.25rem" }}>{allowed ? "✅" : "❌"}</span>
                              <span style={{ flex: 1 }}>{item.label}</span>
                              <span style={{ fontWeight: "500", color: allowed ? colors.success : colors.danger }}>{allowed ? "Allowed" : "Not Allowed"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div>
            {/* Map */}
            {pg.latitude && pg.longitude && (
              <Section title="Location" icon="📍">
                <div id="map-section" style={newStyles.mapContainer}>
                  <MapContainer center={mapCenter} zoom={15} style={{ height: "250px", width: "100%", borderRadius: "1rem" }} key={`${mapCenter[0]}-${mapCenter[1]}`}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[pg.latitude, pg.longitude]}>
                      <Popup>{pg.pg_name}<br /><button onClick={handleBookNow} style={{ background: colors.success, color: "white", border: "none", borderRadius: "20px", padding: "4px 12px", marginTop: "4px", cursor: "pointer" }}>Book Now</button></Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div style={{ padding: "0.75rem", background: "#F8FAFC", borderRadius: "1rem", marginTop: "0.5rem" }}>
                  <p><strong>Area:</strong> {pg.area}</p>
                  <p><strong>Landmark:</strong> {pg.landmark || "—"}</p>
                </div>
              </Section>
            )}

            {/* Nearby Highlights */}
            <Section title="Nearby Places" icon="🗺️">
              <div style={newStyles.highlightsPanel}>
                <div style={newStyles.categoriesPills}>
                  {highlightCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ ...newStyles.facilityChip, background: selectedCategory === cat.id ? cat.color : "#F1F5F9", color: selectedCategory === cat.id ? "white" : "#1E293B" }}>{cat.icon} {cat.label}</button>
                  ))}
                </div>
                <div>
                  {nearbyHighlights.filter(h => selectedCategory === "all" || h.category === selectedCategory).map((h, i) => <HighlightItem key={i} name={h.name} type={h.type} icon={h.icon} onView={() => handleViewOnMap(h)} />)}
                </div>
              </div>
            </Section>

            {/* Nearby PGs */}
            {nearbyPGs.length > 0 && (
              <Section title="Nearby Properties" icon="🏘️">
                {nearbyPGs.map(p => <NearbyPGCard key={p.id} pg={p} onClick={() => navigate(`/pg/${p.id}`)} distance={p.distance} />)}
              </Section>
            )}

            {/* Contact Card */}
            <div style={newStyles.contactCard}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Phone size={20} /> Contact Owner</h3>
              {pg.contact_person && <p><strong>👤 {pg.contact_person}</strong></p>}
              {pg.contact_phone && <p style={{ margin: "0.5rem 0" }}>📞 <a href={`tel:${pg.contact_phone}`} style={{ color: "white", textDecoration: "underline" }}>{pg.contact_phone}</a></p>}
              {pg.contact_email && <p>✉️ {pg.contact_email}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={handleBookNow} style={{ flex: 1, background: "white", color: colors.primary, border: "none", borderRadius: "40px", padding: "0.5rem", fontWeight: "600", cursor: "pointer" }}>Book Now</button>
                {pg.contact_phone && <button onClick={handleCallOwner} style={{ flex: 1, background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", borderRadius: "40px", padding: "0.5rem", cursor: "pointer" }}>Call</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bar */}
      <div style={newStyles.stickyBar}>
        <div style={newStyles.stickyContent}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: colors.primary }}>₹{formatPrice(pg.single_sharing || pg.price_1bhk)}/month</div>
            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{pg.pg_name} • {pg.area}</div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleBookNow} style={newStyles.btnPrimary}><BookOpen size={18} /> Book Now</button>
            {pg.contact_phone && <button onClick={handleCallOwner} style={newStyles.btnSecondary}><Phone size={18} /> Call</button>}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showBookingModal && <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} loading={bookingLoading} />}

      {/* Toast */}
      {notification && <div style={newStyles.toast}>{notification.includes("✅") ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {notification}</div>}
    </div>
  );
}