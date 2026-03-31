import React from "react";
import {
  Shield,
  Lock,
  CreditCard,
  Users,
  Cookie,
  Mail,
  Globe,
  Phone,
  Home,
  Building,
  Key,
  ChevronRight,
  AlertCircle
} from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Information We Collect",
      content: "We collect only necessary information to provide rental services:",
      items: [
        "Full name, mobile number, and email",
        "Address and booking details",
        "Aadhaar (only last 4 digits for verification)",
        "PAN details (stored securely and protected)",
        "Agreement and digital signature data",
        "IP address and device details for security logs"
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: "Your data is used strictly for service purposes:",
      items: [
        "Create and manage rental agreements",
        "Verify identity using OTP and KYC",
        "Enable PG, coliving, and rental bookings",
        "Provide customer support and updates",
        "Ensure legal compliance and fraud prevention"
      ]
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Processing",
      content: "We ensure secure payments:",
      items: [
        "Secure payment gateway integration",
        "UPI, Card, NetBanking supported",
        "We DO NOT store card or bank details",
        "All payments are handled by trusted providers"
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Protection",
      content: "We follow Indian legal standards for data protection:",
      items: [
        "Data encrypted and securely stored",
        "Restricted admin access",
        "IP & audit logs maintained",
        "Compliance with IT Act, 2000",
        "Regular security monitoring"
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Legal Compliance",
      content: "Our platform follows Indian laws:",
      items: [
        "Information Technology Act, 2000",
        "Indian Contract Act, 1872",
        "Aadhaar Act, 2016 (partial storage only)",
        "IT Rules 2011 for data protection"
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Platform Disclaimer",
      content: "Important legal clarification:",
      items: [
        "We are only an intermediary platform",
        "We do NOT own properties",
        "We are NOT responsible for disputes",
        "Owner and Tenant are solely responsible",
        "We do not guarantee property condition"
      ]
    }
  ];

  const quickInfoCards = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "PG Accommodations",
      description: "Verified and secure PG facilities"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Coliving Spaces",
      description: "Modern shared living solutions"
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "ToLet Properties",
      description: "Trusted rental properties"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            We protect your data while providing PG, coliving, and rental services.
          </p>
          <p className="text-sm mt-2">Last Updated: 2026</p>
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {quickInfoCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              {card.icon}
              <h3 className="font-bold mt-2">{card.title}</h3>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((sec, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <div className="flex gap-2 items-center mb-3">
                {sec.icon}
                <h2 className="font-bold text-lg">{sec.title}</h2>
              </div>
              <p className="text-gray-600 mb-2">{sec.content}</p>
              <ul>
                {sec.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <ChevronRight size={16} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* EXTRA LEGAL */}
        <div className="mt-10 bg-yellow-50 p-6 rounded-xl border">
          <h2 className="font-bold text-lg mb-2">User Consent</h2>
          <p className="text-sm text-gray-700">
            By using this platform, you consent to the collection and processing of your data
            for rental agreement and verification purposes.
          </p>
        </div>

        {/* CONTACT */}
        <div className="mt-10 bg-gray-900 text-white p-6 rounded-xl">
          <h2 className="font-bold text-xl mb-4">Contact</h2>
          <p>Email: huligeshmalka@gmail.com</p>
          <p>Website: nepxall-app.vercel.app</p>
          <p>Phone: +91 7483090510</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;