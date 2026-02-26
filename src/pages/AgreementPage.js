import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/nepxall-logo.png";
import { QRCodeCanvas } from "qrcode.react";

export default function AgreementPage() {
  const { bookingId } = useParams();
  const [agreement, setAgreement] = useState(null);

  const loadAgreement = useCallback(async () => {
    const res = await api.get(`/agreement/booking/${bookingId}`);
    setAgreement(res.data.data);
  }, [bookingId]);

  useEffect(() => {
    loadAgreement();
  }, [loadAgreement]);

  const money = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
  const formatDate = d =>
    d ? new Date(d).toLocaleDateString("en-GB") : "-";

  if (!agreement) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen py-10 bg-gradient-to-br from-[#0F5ED7] to-[#22C55E]">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="text-center py-10 bg-gradient-to-r from-[#0F5ED7] to-[#22C55E] text-white relative">

          <div className="absolute top-4 right-6 text-xs bg-white/20 px-3 py-1 rounded-full">
            DIGITAL AGREEMENT
          </div>

          <img src={logo} className="w-20 mx-auto mb-3" alt="" />

          <h1 className="text-4xl font-bold tracking-wide">
            RENTAL AGREEMENT
          </h1>

        </div>

        <div className="p-10 space-y-8">

          {/* OWNER + TENANT */}
          <div className="grid md:grid-cols-2 gap-6">
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
          <div className="grid md:grid-cols-2 gap-6">
            <Box title="PROPERTY DETAILS">
              <Row label="Name" value={agreement.pg_name} />
              <Row label="Address" value={agreement.address} />
            </Box>

            <Box title="AGREEMENT INFO">
              <Row label="Start Date" value={formatDate(agreement.move_in_date)} />
              <Row label="Lock-In" value={`${agreement.agreement_duration_months} Months`} />
              <Row label="Rent Due" value={`${agreement.rent_due_day}th`} />
            </Box>
          </div>

          {/* FINANCIAL */}
          <Box title="FINANCIAL DETAILS">
            <TableRow label="Monthly Rent" value={money(agreement.rent_amount)} />
            <TableRow label="Security Deposit" value={money(agreement.security_deposit)} />
            <TableRow label="Maintenance" value={money(agreement.maintenance_amount)} />
            <TableRow label="Electricity" value="Payable separately" />
          </Box>

          {/* TERMS */}
          <ol className="list-decimal pl-5 text-sm space-y-1 text-gray-600">
            <li>No illegal activities.</li>
            <li>No smoking or alcohol.</li>
            <li>No overnight guests.</li>
            <li>Maintain cleanliness.</li>
            <li>15-day notice after lock-in.</li>
          </ol>

          {/* SIGNATURE + QR */}
          <div className="grid md:grid-cols-3 items-center gap-6 pt-10">

            {/* QR */}
            <div className="text-center">
              <div className="p-3 bg-white rounded-xl shadow-lg inline-block">
                <QRCodeCanvas
                  value={`${window.location.origin}/public/agreement/${agreement.agreement_hash}`}
                  size={130}
                />
              </div>
              <p className="text-xs mt-2 text-gray-500">Scan to Verify</p>
            </div>

            {/* OWNER */}
            <SignatureBox title="Owner Signature" />

            {/* TENANT */}
            <SignatureBox title="Tenant Signature" />

          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-gradient-to-r from-[#0F5ED7] to-[#22C55E] text-white px-8 py-5 flex flex-col md:flex-row justify-between items-center text-sm">

          <p className="text-lg font-bold">Nepxall</p>

          <div className="text-center">
            <p>Agreement ID: {agreement.agreement_number}</p>
            <p>Verification Code: {agreement.verification_code}</p>
          </div>

          <p>Generated on {formatDate(new Date())}</p>

        </div>

      </div>
    </div>
  );
}

//////////////////////////////////////////////////////

const Box = ({ title, children }) => (
  <div className="border rounded-xl overflow-hidden shadow-sm">
    <div className="bg-gradient-to-r from-[#0F5ED7] to-[#22C55E] text-white px-4 py-2 text-sm font-semibold">
      {title}
    </div>
    <div className="p-4 text-sm space-y-1">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <p><b>{label}:</b> {value || "-"}</p>
);

const TableRow = ({ label, value }) => (
  <div className="flex justify-between border-b py-2 text-sm">
    <span>{label}</span>
    <span className="font-semibold text-green-600">{value}</span>
  </div>
);

const SignatureBox = ({ title }) => (
  <div className="text-center">
    <div className="border-t-2 border-gray-400 w-48 mx-auto h-12"></div>
    <p className="text-sm text-gray-500 mt-2">{title}</p>
  </div>
);