import React from "react";
import {
  Shield,
  Lock,
  CreditCard,
  Users,
  Mail,
  Globe,
  Phone,
  Home,
  Building,
  Key,
  ChevronRight,
  AlertCircle,
  Database,
  UserCheck,
  Trash2,
  Clock,
  Fingerprint,
  Scale,
  Banknote,
  FileText
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
        "Aadhaar is partially stored (only last 4 digits) for verification purposes. Full Aadhaar numbers are never stored on our servers.",
        "PAN details (stored securely and protected)",
        "Agreement and digital signature data",
        "IP address and device details for security logs"
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Bank Data Encryption & Security",
      content: "We take bank data security seriously:",
      items: [
        "We store bank details in encrypted format for payout purposes",
        "Sensitive data such as account number and IFSC are protected using AES-256 encryption and strict access controls",
        "Only authorized administrators can access decrypted data for settlement processing",
        "We use industry-standard encryption techniques to protect sensitive data",
        "All bank and personal data are encrypted before storage",
        "Secure HTTPS protocols (TLS 1.3) are used for all communications"
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Data Access Control",
      content: "Strict access controls protect your information:",
      items: [
        "Only authorized personnel (Admin) can access sensitive financial data",
        "Owners can view only masked bank details (e.g., ****1234)",
        "Users cannot access any bank information of others",
        "All access is logged and monitored with audit trails",
        "Regular security audits performed quarterly"
      ]
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Data Retention Policy",
      content: "We retain your data only as necessary:",
      items: [
        "Financial and agreement data may be stored for audit and compliance (up to 7 years as per legal requirements)",
        "Users can request deletion of personal data where applicable via email",
        "Inactive accounts may have data archived after 2 years",
        "Log data retained for 1 year for security purposes",
        "Transaction records retained for 7 years (tax compliance)"
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "User Rights (GDPR-Style)",
      content: "You have full control over your data:",
      items: [
        "✓ Right to access your data",
        "✓ Right to request corrections",
        "✓ Right to request deletion (subject to legal requirements)",
        "✓ Right to withdraw consent",
        "✓ Right to data portability",
        "✓ Right to lodge a complaint with grievance officer"
      ]
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Processing",
      content: "Secure payment handling - Updated:",
      items: [
        "We do NOT store card details",
        "Bank details used for settlements are stored in encrypted format only",
        "Payments are processed through secure third-party providers (Razorpay/Stripe)",
        "UPI, Card, NetBanking supported",
        "All transactions use TLS 1.2+ encryption",
        "PCI DSS compliant payment gateway"
      ]
    },
    {
      icon: <Fingerprint className="w-6 h-6" />,
      title: "Data Protection & Encryption",
      content: "Industry-standard security measures:",
      items: [
        "AES-256 encryption for sensitive data at rest",
        "TLS 1.3 for data in transit",
        "Regular security patches and updates",
        "24/7 security monitoring",
        "Two-factor authentication for admin access",
        "Automated backup with encryption"
      ]
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Legal Compliance",
      content: "Our platform follows Indian laws:",
      items: [
        "Information Technology Act, 2000",
        "Indian Contract Act, 1872",
        "Aadhaar Act, 2016 (partial storage only)",
        "IT (Reasonable Security Practices) Rules, 2011",
        "Consumer Protection Act, 2019",
        "Digital Personal Data Protection Act, 2023"
      ]
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
          <p className="text-sm mt-2 opacity-80">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
          <p className="text-sm opacity-70">Version 2.1 - Enhanced Security Edition</p>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((sec, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex gap-3 items-center mb-4">
                <div className="text-blue-600">{sec.icon}</div>
                <h2 className="font-bold text-xl text-gray-800">{sec.title}</h2>
              </div>
              <p className="text-gray-600 mb-3 text-sm">{sec.content}</p>
              <ul className="space-y-2">
                {sec.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <ChevronRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" /> 
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* STRONG DISCLAIMER */}
        <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-red-600 w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-lg text-red-800 mb-2">Platform Disclaimer (Important Legal Notice)</h2>
              <p className="text-sm text-red-700 mb-3">
                The platform is not responsible for misuse of information once shared between users and property owners. 
                Users are responsible for verifying property and payment details.
              </p>
              <p className="text-sm text-red-700">
                Nepxall acts only as an intermediary platform between property owners and tenants. 
                We do not own, manage, or control any property listed. The platform is not responsible for property condition, 
                availability, refund disputes between owner and tenant, or payment-related conflicts.
              </p>
            </div>
          </div>
        </div>

        {/* USER CONSENT */}
        <div className="mt-6 bg-green-50 p-6 rounded-xl border border-green-200">
          <div className="flex gap-3 items-start">
            <UserCheck className="text-green-600 w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg text-green-800 mb-2">User Consent</h2>
              <p className="text-sm text-green-700">
                By using this platform, you consent to the collection, processing, and storage of your data
                for rental agreement, verification, and settlement purposes. You acknowledge that you have read
                and understood this Privacy Policy and agree to its terms.
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className="mt-8 bg-gray-900 text-white p-6 rounded-xl">
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Contact Us
          </h2>
          <div className="space-y-2">
            <p className="flex items-center gap-2"><Mail size={16} /> huligeshmalka@gmail.com</p>
            <p className="flex items-center gap-2"><Globe size={16} /> nepxall-app.vercel.app</p>
            <p className="flex items-center gap-2"><Phone size={16} /> +91 7483090510</p>
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700">
            For data deletion requests or privacy concerns, please contact our Grievance Officer at the email above.
            Response time: Within 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;