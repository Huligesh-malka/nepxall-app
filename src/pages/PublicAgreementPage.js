import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/nepxall-logo.png";

export default function PublicAgreementPage() {

  const { hash } = useParams();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgreement();
  }, []);

  const loadAgreement = async () => {
    try {
      const res = await api.get(`/agreement/public/${hash}`);
      setAgreement(res.data.data);
    } catch {
      setAgreement(null);
    }
    setLoading(false);
  };

  const money = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
  const formatDate = d => d ? new Date(d).toLocaleDateString("en-GB") : "-";

  if (loading) return <div className="p-10 text-center">Loading agreement...</div>;

  if (!agreement)
    return (
      <div className="p-10 text-center text-red-600 font-semibold">
        Invalid or tampered agreement ❌
      </div>
    );

  return (
    <div className="bg-gradient-to-b from-blue-200 to-blue-600 min-h-screen py-10">

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="text-center py-10 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
          <img src={logo} className="w-20 mx-auto mb-3" alt="" />
          <h1 className="text-4xl font-bold">RENTAL AGREEMENT</h1>
          <p className="text-sm mt-2 bg-green-500 inline-block px-3 py-1 rounded">
            ✔ VERIFIED DOCUMENT
          </p>
        </div>

        <div className="p-10 space-y-6">

          {/* OWNER + TENANT */}
          <div className="grid grid-cols-2 gap-6">
            <Box title="LANDLORD DETAILS">
              <Row label="Name" value={agreement.owner_name} />
              <Row label="Contact" value={agreement.owner_phone} />
              <Row label="Email" value={agreement.owner_email} />
            </Box>

            <Box title="TENANT DETAILS">
              <Row label="Name" value={agreement.tenant_name} />
              <Row label="Contact" value={agreement.tenant_phone} />
              <Row label="Email" value={agreement.tenant_email} />
            </Box>
          </div>

          {/* PROPERTY */}
          <div className="grid grid-cols-2 gap-6">
            <Box title="PROPERTY DETAILS">
              <Row label="Name" value={agreement.pg_name} />
              <Row label="Address" value={agreement.address} />
            </Box>

            <Box title="AGREEMENT INFO">
              <Row label="Start Date" value={formatDate(agreement.move_in_date)} />
              <Row label="Duration" value={`${agreement.agreement_duration_months} Months`} />
              <Row label="Rent Due Date" value={`${agreement.rent_due_day}th of Every Month`} />
            </Box>
          </div>

          {/* FINANCIAL */}
          <Box title="FINANCIAL DETAILS">
            <TableRow label="Monthly Rent" value={money(agreement.rent_amount)} />
            <TableRow label="Security Deposit" value={money(agreement.security_deposit)} />
            <TableRow label="Maintenance" value={money(agreement.maintenance_amount)} />
          </Box>

        </div>

        {/* FOOTER */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-4 flex justify-between text-sm">

          <p className="font-bold text-lg">Nepxall</p>

          <div>
            <p>Agreement ID: {agreement.agreement_number}</p>
            <p>Verification Code: {agreement.verification_code}</p>
          </div>

          <p>Signed on {formatDate(agreement.signed_at)}</p>

        </div>

      </div>
    </div>
  );
}

//////////////////////////////////////////////////////

const Box = ({ title, children }) => (
  <div className="border rounded">
    <div className="bg-blue-700 text-white px-4 py-2 font-semibold text-sm">
      {title}
    </div>
    <div className="p-4 text-sm space-y-1">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <p><b>{label}:</b> {value || "-"}</p>
);

const TableRow = ({ label, value }) => (
  <div className="flex justify-between border-b py-2">
    <span>{label}</span>
    <span className="font-semibold text-green-600">{value}</span>
  </div>
);