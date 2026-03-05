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
      content: "We collect essential information to provide you with the best rental experience:",
      items: [
        "Full name and contact details",
        "Email address and phone number",
        "Aadhaar details for secure KYC verification",
        "Booking preferences and history",
        "Payment information (processed securely)",
        "Property viewing requests and feedback"
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: "Your information helps us create a seamless rental experience:",
      items: [
        "Match you with ideal PG and coliving spaces",
        "Verify your identity for secure bookings",
        "Process rental agreements digitally",
        "Communicate property updates and offers",
        "Improve our platform based on your preferences"
      ]
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Processing",
      content: "Your financial security is our priority:",
      items: [
        "100% secure payment gateway integration",
        "Multiple payment options (UPI, Cards, NetBanking)",
        "No storage of sensitive payment details",
        "Instant payment confirmation and receipts",
        "Secure refund processing when applicable"
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Protection",
      content: "We implement industry-leading security measures:",
      items: [
        "256-bit SSL encryption for all data",
        "Regular security audits and updates",
        "Strict access controls for your information",
        "Secure data centers with backup systems",
        "24/7 monitoring for suspicious activities"
      ]
    }
  ];

  const quickInfoCards = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "PG Accommodations",
      description: "Safe and verified paying guest facilities"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Coliving Spaces",
      description: "Modern shared living with like-minded people"
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "ToLet Properties",
      description: "Verified rental properties across locations"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            Your privacy matters to us. Learn how we protect and manage your personal information
            across our PG, coliving, and rental property platform.
          </p>
          <div className="mt-4 flex items-center gap-2 text-blue-200">
            <AlertCircle className="w-5 h-5" />
            <p>Last Updated: 05 March 2026</p>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickInfoCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 mb-4">{card.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <p className="text-lg text-gray-700 leading-relaxed">
            At <span className="font-semibold text-blue-600">Nepxall</span>, we're committed to protecting your privacy 
            while helping you find the perfect PG, coliving space, or rental property. This policy outlines our practices 
            regarding data collection, usage, and protection across our platform.
          </p>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
              </div>
              <p className="text-gray-600 mb-4">{section.content}</p>
              <ul className="space-y-3">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Cookies Section */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                <Cookie className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Cookie Policy</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We use cookies to enhance your browsing experience and personalize your property search:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Remember your search preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Analyze site traffic and improve performance</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Provide relevant property recommendations</span>
              </li>
            </ul>
          </div>

          {/* Policy Updates */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Policy Updates</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We regularly review and update our privacy practices to ensure maximum protection:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Changes will be posted on this page</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Material changes communicated via email</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Last updated: March 3, 2026</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Mail className="w-8 h-8" />
            Get in Touch
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Have questions about your privacy or how we handle your data? We're here to help!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Us</p>
                <p className="font-semibold">huligeshmalka@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Visit Us</p>
                <p className="font-semibold">nepxall-app.vercel.app</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Phone className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Call Us</p>
                <p className="font-semibold">+91 7483090510</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 Nepxall. All rights reserved. Your trusted partner for PG, coliving, and rental properties.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;