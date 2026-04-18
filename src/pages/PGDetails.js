import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Phone, Navigation, Calendar, Users, Home, Bed, Wifi,
  Coffee, Car, Shield, Check, X, ChevronLeft, ChevronRight, Heart,
  Share2, BookOpen, Clock, DollarSign, Tv, Wind, Bath, Utensils,
  Sparkles, Zap, Dumbbell, Wrench, Volume2, Dog, PartyPopper, Ban,
  UserCheck, Lock, FileText, Info, ArrowRight, Sparkle
} from 'lucide-react';

// Mock data for demonstration
const mockPGData = {
  id: 1,
  name: "Sunshine Co-Living Spaces",
  location: "HSR Layout, Bangalore",
  rating: 4.8,
  reviews: 234,
  startingPrice: 8999,
  totalRooms: 45,
  availableRooms: 12,
  pgType: "Co-Living (Mixed)",
  images: [
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop"
  ],
  roomTypes: [
    { name: "Single Sharing", price: 15999, features: ["Private Room", "Attached Bath"], popular: true },
    { name: "Double Sharing", price: 10999, features: ["Shared Room", "Common Bath"], popular: false },
    { name: "Triple Sharing", price: 8999, features: ["Bunk Beds", "Study Desk"], popular: false }
  ],
  facilities: [
    { name: "High-Speed WiFi", icon: Wifi, category: "basic", color: "#3b82f6" },
    { name: "Air Conditioning", icon: Wind, category: "room", color: "#06b6d4" },
    { name: "Geyser", icon: DropletIcon, category: "room", color: "#ec4899" },
    { name: "Smart TV", icon: Tv, category: "common", color: "#f97316" },
    { name: "Fully Equipped Kitchen", icon: Utensils, category: "common", color: "#8b5cf6" },
    { name: "Parking", icon: Car, category: "basic", color: "#10b981" },
    { name: "Gym Access", icon: Dumbbell, category: "common", color: "#ef4444" },
    { name: "24/7 Security", icon: Shield, category: "basic", color: "#6366f1" },
    { name: "Study Lounge", icon: Sparkles, category: "common", color: "#f59e0b" },
    { name: "Laundry", icon: Wrench, category: "basic", color: "#14b8a6" }
  ],
  rules: [
    { label: "Couples Friendly", allowed: true, icon: Heart, description: "Couples are welcome" },
    { label: "Pets Allowed", allowed: false, icon: Dog, description: "Only service animals" },
    { label: "Smoking", allowed: false, icon: Ban, description: "Strictly non-smoking" },
    { label: "Parties", allowed: false, icon: PartyPopper, description: "Quiet hours after 10 PM" },
    { label: "Visitors", allowed: true, icon: UserCheck, description: "Until 11 PM" },
    { label: "Lock-in Period", allowed: true, icon: Lock, description: "6 months minimum" }
  ],
  nearbyPlaces: [
    { name: "Central Mall", distance: "1.2 km", type: "shopping" },
    { name: "Neo Hospital", distance: "800 m", type: "medical" },
    { name: "HSR Metro Station", distance: "2 km", type: "transport" },
    { name: "Starbucks", distance: "400 m", type: "cafe" }
  ]
};

// Helper icon component
const DropletIcon = () => <span className="text-lg">💧</span>;

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-[400px] bg-gray-200 rounded-3xl"></div>
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
      </div>
    </div>
  </div>
);

// Hero Carousel Component
const HeroCarousel = ({ images, pgName, location, rating, reviews, onBookNow, onCallOwner, onDirections }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
      <div className="relative h-[500px] md:h-[600px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Slide ${currentIndex}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>
        
        {/* Dark Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-all duration-300">
              <ChevronLeft className="text-white w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-all duration-300">
              <ChevronRight className="text-white w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg">{pgName}</h1>
            <div className="flex items-center gap-2 mb-3 text-white/90">
              <MapPin className="w-5 h-5" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating}</span>
                <span className="text-sm">({reviews} reviews)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={onBookNow} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 transition-all duration-300 hover:scale-105">
                <BookOpen className="w-5 h-5" /> Book Now
              </button>
              <button onClick={onCallOwner} className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all duration-300">
                <Phone className="w-5 h-5" /> Call Owner
              </button>
              <button onClick={onDirections} className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all duration-300">
                <Navigation className="w-5 h-5" /> Directions
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Quick Info Cards Component
const QuickInfoCards = ({ startingPrice, totalRooms, availableRooms, pgType }) => {
  const cards = [
    { icon: DollarSign, label: "Starting Price", value: `₹${startingPrice.toLocaleString()}/mo`, color: "from-emerald-500 to-teal-500" },
    { icon: Home, label: "Total Rooms", value: totalRooms, color: "from-blue-500 to-cyan-500" },
    { icon: Bed, label: "Available Rooms", value: availableRooms, color: "from-purple-500 to-indigo-500" },
    { icon: Users, label: "PG Type", value: pgType, color: "from-orange-500 to-rose-500" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -12px rgba(0,0,0,0.15)" }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/40 transition-all duration-300"
        >
          <div className={`bg-gradient-to-br ${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md`}>
            <card.icon className="text-white w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm mb-1">{card.label}</p>
          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Price Cards Component (Room Types)
const PriceCards = ({ roomTypes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {roomTypes.map((room, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.03, y: -8 }}
          className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border transition-all duration-300 ${room.popular ? 'border-purple-300 shadow-purple-100' : 'border-gray-100'}`}
        >
          {room.popular && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkle className="w-3 h-3" /> Popular
            </div>
          )}
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">{room.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-black text-gray-900">₹{room.price.toLocaleString()}</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {room.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <Check className="w-4 h-4 text-green-500" /> {feature}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group">
              Select Room <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Facilities Component with Filter Tabs
const FacilitiesSection = ({ facilities }) => {
  const [activeTab, setActiveTab] = useState("all");
  const categories = [
    { id: "all", label: "All", icon: Sparkles },
    { id: "room", label: "Room", icon: Bed },
    { id: "common", label: "Common", icon: Users },
    { id: "basic", label: "Basic", icon: Shield }
  ];

  const filteredFacilities = activeTab === "all" ? facilities : facilities.filter(f => f.category === activeTab);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${activeTab === cat.id ? 'bg-gray-900 text-white shadow-lg scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
          >
            <cat.icon className="w-4 h-4" /> {cat.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFacilities.map((facility, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ scale: 1.02, x: 3 }}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${facility.color}20` }}>
              <facility.icon className="w-5 h-5" style={{ color: facility.color }} />
            </div>
            <span className="font-medium text-gray-700">{facility.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Map + Location Side Panel Component
const MapLocationPanel = ({ location, nearbyPlaces, coordinates }) => {
  // Leaflet map simulation (using static map image for simplicity, but structure matches)
  const mapSrc = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=14&size=600x300&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=YOUR_API_KEY`;
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24 border border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-xl font-bold flex items-center gap-2"><MapPin className="text-red-500" /> Location Details</h3>
        <p className="text-gray-600 mt-1">{location}</p>
      </div>
      <div className="h-64 bg-gray-100 relative">
        {/* Using a placeholder image for map - in real app use react-leaflet */}
        <img src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lng},${coordinates.lat},14/600x300?access_token=YOUR_TOKEN`} alt="Map" className="w-full h-full object-cover" onError={(e) => e.target.src = "https://placehold.co/600x400?text=Map+View"} />
      </div>
      <div className="p-5">
        <h4 className="font-semibold mb-3">Nearby Highlights</h4>
        <div className="flex flex-wrap gap-2">
          {nearbyPlaces.map((place, idx) => (
            <button key={idx} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm flex items-center gap-1 transition-colors">
              <MapPin className="w-3 h-3" /> {place.name} • {place.distance}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Nearby Properties Carousel
const NearbyCarousel = ({ properties }) => {
  const scrollRef = useRef(null);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Nearby Properties</h3>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex overflow-x-auto gap-5 pb-4 scroll-smooth hide-scrollbar">
        {properties.map((prop, idx) => (
          <motion.div key={idx} whileHover={{ y: -5 }} className="min-w-[280px] bg-white rounded-2xl shadow-lg overflow-hidden flex-shrink-0">
            <img src={prop.image} alt={prop.name} className="h-40 w-full object-cover" />
            <div className="p-4">
              <h4 className="font-bold">{prop.name}</h4>
              <p className="text-sm text-gray-500">{prop.distance}</p>
              <p className="text-green-600 font-bold mt-2">₹{prop.price.toLocaleString()}/mo</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Rules & Restrictions Cards
const RulesSection = ({ rules }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rules.map((rule, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`rounded-xl p-4 flex items-start gap-3 border-l-8 transition-all ${rule.allowed ? 'bg-green-50 border-l-green-500' : 'bg-red-50 border-l-red-500'}`}
        >
          <div className={`p-2 rounded-full ${rule.allowed ? 'bg-green-100' : 'bg-red-100'}`}>
            <rule.icon className={`w-5 h-5 ${rule.allowed ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h4 className="font-bold">{rule.label}</h4>
            <p className="text-xs text-gray-500">{rule.description}</p>
            <span className={`text-xs font-semibold mt-1 inline-block ${rule.allowed ? 'text-green-600' : 'text-red-600'}`}>
              {rule.allowed ? '✓ Allowed' : '✗ Not Allowed'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Booking Modal with Steps
const BookingModal = ({ isOpen, onClose, roomTypes, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const handleNext = () => setStep(2);
  const handleConfirm = () => {
    onConfirm({ date: selectedDate, room: selectedRoom });
    onClose();
    setStep(1);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-2xl font-bold">Book Your Stay</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            <div className="flex mb-6">
              {[1,2,3].map((s) => (
                <div key={s} className={`flex-1 text-center pb-2 border-b-2 ${step >= s ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-400'} font-semibold`}>
                  Step {s}
                </div>
              ))}
            </div>
            {step === 1 && (
              <div>
                <label className="block font-medium mb-2">Select Check-in Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" min={new Date().toISOString().split('T')[0]} />
                <button onClick={handleNext} disabled={!selectedDate} className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Continue</button>
              </div>
            )}
            {step === 2 && (
              <div>
                <label className="block font-medium mb-2">Choose Room Type</label>
                <div className="space-y-2">
                  {roomTypes.map((room, idx) => (
                    <button key={idx} onClick={() => setSelectedRoom(room.name)} className={`w-full p-3 text-left border rounded-xl transition ${selectedRoom === room.name ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <div className="font-semibold">{room.name}</div>
                      <div className="text-sm text-gray-500">₹{room.price.toLocaleString()}/month</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 rounded-xl">Back</button>
                  <button onClick={handleConfirm} disabled={!selectedRoom} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Confirm Booking</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Component
export default function ModernPGDetailPage() {
  const [loading, setLoading] = useState(true);
  const [pgData, setPgData] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setPgData(mockPGData);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleBookNow = () => setIsBookingModalOpen(true);
  const handleCallOwner = () => alert("Calling owner: +91 9876543210");
  const handleDirections = () => window.open("https://maps.google.com", "_blank");
  const handleBookingConfirm = (booking) => console.log("Booking confirmed", booking);
  
  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><SkeletonLoader /></div>;
  if (!pgData) return <div className="text-center py-20">Failed to load property details.</div>;
  
  const nearbyProperties = [
    { name: "Cozy Dorm", distance: "500m away", price: 7999, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop" },
    { name: "Elite Suites", distance: "1.2km away", price: 12999, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop" },
    { name: "Green Nest", distance: "800m away", price: 9499, image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop" }
  ];
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <HeroCarousel 
          images={pgData.images} 
          pgName={pgData.name} 
          location={pgData.location} 
          rating={pgData.rating} 
          reviews={pgData.reviews}
          onBookNow={handleBookNow}
          onCallOwner={handleCallOwner}
          onDirections={handleDirections}
        />
        
        {/* Quick Info Cards */}
        <QuickInfoCards 
          startingPrice={pgData.startingPrice} 
          totalRooms={pgData.totalRooms} 
          availableRooms={pgData.availableRooms} 
          pgType={pgData.pgType} 
        />
        
        {/* Two Column Layout for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Price Section */}
            <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><DollarSign className="text-green-500" /> Room Pricing</h2>
              <PriceCards roomTypes={pgData.roomTypes} />
            </section>
            
            {/* Facilities Section */}
            <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-purple-500" /> Amenities & Facilities</h2>
              <FacilitiesSection facilities={pgData.facilities} />
            </section>
            
            {/* Rules Section */}
            <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Shield className="text-blue-500" /> House Rules</h2>
              <RulesSection rules={pgData.rules} />
            </section>
          </div>
          
          {/* Right Sidebar - Sticky Map + Location */}
          <div className="space-y-6">
            <MapLocationPanel 
              location={`${pgData.location}, India`} 
              nearbyPlaces={pgData.nearbyPlaces} 
              coordinates={{ lat: 12.9716, lng: 77.5946 }} 
            />
          </div>
        </div>
        
        {/* Nearby Properties Carousel */}
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 mt-4">
          <NearbyCarousel properties={nearbyProperties} />
        </section>
        
        {/* Sticky Bottom Price Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-2xl z-40 p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="text-2xl font-bold text-gray-900">₹{pgData.startingPrice.toLocaleString()}<span className="text-sm font-normal">/month</span></p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleCallOwner} className="flex-1 sm:flex-none border border-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"><Phone className="w-5 h-5" /> Call</button>
              <button onClick={handleBookNow} className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"><BookOpen className="w-5 h-5" /> Book Now</button>
            </div>
          </div>
        </div>
        
        {/* Booking Modal */}
        <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} roomTypes={pgData.roomTypes} onConfirm={handleBookingConfirm} />
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}