"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Trash2,
  Download,
  AlertCircle,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Globe
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");

  const content = {
    en: {
      badge: "STATUTORY COMPLIANCE · INDIA DPDP ACT 2023 & GDPR",
      title: "Privacy Policy & Data Fiduciary Disclosure",
      updated: "Effective: November 1, 2026 · Version 2.1 (Production Single-Origin)",
      intro: "This Privacy Policy governs the processing of personal and telemetric transit data by Smart Public Bus (Team Qubits / pranshusharma.tech), operating as a Data Fiduciary in compliance with the Digital Personal Data Protection Act, 2023 (India) and Regulation (EU) 2016/679 (GDPR).",
      fiduciaryTitle: "1. Data Fiduciary & Grievance Redressal",
      fiduciaryBody: "Under Section 2(i) of the DPDP Act 2023, the designated Data Fiduciary is:",
      officerTitle: "Designated Grievance & Data Protection Officer:",
      officerName: "Pranshu Sharma",
      officerRole: "Lead Engineer & Data Protection Officer",
      officerEmail: "pranshusharma01@gmail.com",
      officerJurisdiction: "New Delhi, National Capital Territory of Delhi, India",
      categoriesTitle: "2. Personal & Telemetry Data We Process",
      categories: [
        {
          title: "Account Identity",
          desc: "Full name, email address, and optional phone number verified via 6-digit cryptographic OTP. Used for passenger profiles and conductor dispatch authorization."
        },
        {
          title: "Live GPS & Transit Telemetry",
          desc: "Passenger boarding/alighting stop IDs, approximate GPS coordinates when searching routes, and real-time vehicle AIS-140 beacon coordinates."
        },
        {
          title: "Emergency Safety Data (112 / SOS)",
          desc: "Emergency contacts, ambient audio snapshot (buffered for 5s prior to police PCR transmission), and live bus coordinate packets transmitted to Delhi Police (112) and DTC Command Room."
        },
        {
          title: "Conductor Ticketing & Cash Ledger",
          desc: "Ticket serial numbers, fare amounts, payment modes (UPI / Cash), and duty timestamps retained for statutory audit compliance."
        }
      ],
      retentionTitle: "3. Data Retention & Automatic Purge Schedule",
      retentionItems: [
        { label: "Live GPS Telemetry", value: "Rolling 90-day retention, then automatically anonymized." },
        { label: "Emergency SOS Logs", value: "180 days retained for Delhi Police inquiry & DTC safety auditing." },
        { label: "Ticketing & Fare Records", value: "3 years statutory retention required under transit auditing regulations." },
        { label: "User Account & Profile", value: "Purged immediately upon triggering 'Delete Account' in Account settings." }
      ],
      rightsTitle: "4. Rights of the Data Principal (Your Rights)",
      rightsItems: [
        {
          name: "Right to Access & Portability",
          desc: "You can download a complete structured JSON archive of your personal data, rides, and saved places anytime from your Account page."
        },
        {
          name: "Right to Correction & Updating",
          desc: "You have full control to edit your profile, saved commute hubs, preferred language, and emergency contacts instantly."
        },
        {
          name: "Right to Erasure (Right to Be Forgotten)",
          desc: "Tapping 'Delete Account' cascades an immediate deletion across profiles, sessions, emergency contacts, ride history, and tokens with zero retention."
        },
        {
          name: "Right to Grievance Redressal",
          desc: "You may file a grievance with our Data Protection Officer at pranshusharma01@gmail.com. We acknowledge complaints within 24 hours and resolve within 7 working days."
        }
      ],
      securityTitle: "5. Single-Origin Security Architecture",
      securityBody: "This application operates on a single-server AWS production instance with strict HTTP-only secure cookie sessions, TLS 1.3 encryption, CSP headers, rate-limited cryptographic OTPs, and zero third-party behavioral analytics or advertising trackers."
    },
    hi: {
      badge: "वैधानिक अनुपालन · भारत DPDP अधिनियम 2023 एवं GDPR",
      title: "गोपनीयता नीति एवं डेटा न्यासी प्रकटीकरण",
      updated: "प्रभावी: 1 नवंबर 2026 · संस्करण 2.1 (एकल सर्वर उत्पादन)",
      intro: "यह गोपनीयता नीति स्मार्ट पब्लिक बस (Team Qubits / pranshusharma.tech) द्वारा व्यक्तिगत और जीपीएस टेलीमेट्री डेटा के प्रसंस्करण को नियंत्रित करती है, जो डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (भारत) के अनुसार एक डेटा न्यासी (Data Fiduciary) के रूप में संचालित होती है।",
      fiduciaryTitle: "1. डेटा न्यासी एवं शिकायत निवारण",
      fiduciaryBody: "DPDP अधिनियम 2023 की धारा 2(i) के तहत अधिकृत डेटा न्यासी विवरण:",
      officerTitle: "अधिकृत शिकायत एवं डेटा सुरक्षा अधिकारी:",
      officerName: "प्रांशु शर्मा (Pranshu Sharma)",
      officerRole: "मुख्य अभियंता एवं डेटा संरक्षण अधिकारी",
      officerEmail: "pranshusharma01@gmail.com",
      officerJurisdiction: "नई दिल्ली, राष्ट्रीय राजधानी क्षेत्र दिल्ली, भारत",
      categoriesTitle: "2. व्यक्तिगत एवं टेलीमेट्री डेटा जिसका हम प्रसंस्करण करते हैं",
      categories: [
        {
          title: "खाता पहचान (Account Identity)",
          desc: "पूरा नाम, ईमेल पता और वैकल्पिक फोन नंबर जो 6-अंकीय ओटीपी द्वारा सत्यापित किया जाता है।"
        },
        {
          title: "लाइव जीपीएस एवं बस टेलीमेट्री",
          desc: "यात्री बस स्टॉप आईडी, रूट खोज के समय अनुमानित जीपीएस निर्देशांक और वास्तविक समय AIS-140 वाहन स्थिति।"
        },
        {
          title: "आपातकालीन सुरक्षा डेटा (112 / SOS)",
          desc: "आपातकालीन संपर्क, दिल्ली पुलिस (112) और डीटीसी कमांड सेंटर को प्रेषित लाइव निर्देशांक और आपातकालीन ऑडियो स्नैपशॉट।"
        },
        {
          title: "कंडक्टर टिकट एवं कैश लेज़र",
          desc: "टिकट संख्या, किराया राशि, भुगतान माध्यम (UPI / कैश) जो ऑडिट नियमों के तहत सुरक्षित रखे जाते हैं।"
        }
      ],
      retentionTitle: "3. डेटा प्रतिधारण एवं ऑटो-डिलीट समय सीमा",
      retentionItems: [
        { label: "लाइव जीपीएस टेलीमेट्री", value: "90 दिन के बाद स्वतः अनाम (anonymized) कर दिया जाता है।" },
        { label: "आपातकालीन SOS रिकॉर्ड्स", value: "पुलिस जांच और सुरक्षा ऑडिट हेतु 180 दिन तक सुरक्षित।" },
        { label: "टिकट एवं किराया रिकॉर्ड्स", value: "परिवहन ऑडिट नियमों के तहत 3 वर्ष तक प्रतिधारित।" },
        { label: "उपयोगकर्ता खाता एवं प्रोफाइल", value: "खाता सेटिंग्स में 'Delete Account' दबाने पर तुरंत पूर्णतः मिटा दिया जाता है।" }
      ],
      rightsTitle: "4. डेटा स्वामी (Data Principal) के अधिकार",
      rightsItems: [
        {
          name: "पहुंच एवं डेटा पोर्टेबिलिटी का अधिकार",
          desc: "आप अपने खाते के पेज से कभी भी अपने व्यक्तिगत डेटा का संपूर्ण JSON निर्यात डाउनलोड कर सकते हैं।"
        },
        {
          name: "डेटा सुधार का अधिकार",
          desc: "आप अपनी प्रोफ़ाइल, सहेजे गए स्थान, भाषा प्राथमिकता और आपातकालीन संपर्कों को कभी भी संपादित कर सकते हैं।"
        },
        {
          name: "विस्मृत किए जाने का अधिकार (Right to Erasure)",
          desc: "खाता हटाने पर आपका सारा व्यक्तिगत डेटा, सत्र, संपर्क और सवारी इतिहास तुरंत स्थायी रूप से मिटा दिया जाता है।"
        },
        {
          name: "शिकायत निवारण का अधिकार",
          desc: "आप हमारे डेटा सुरक्षा अधिकारी (pranshusharma01@gmail.com) से संपर्क कर सकते हैं। 24 घंटे में पावती और 7 दिनों में निवारण किया जाता है।"
        }
      ],
      securityTitle: "5. एकल-सर्वर सुरक्षा वास्तुकला",
      securityBody: "यह एप्लिकेशन बिना किसी तीसरे पक्ष के विज्ञापन ट्रैकर्स के, एडब्ल्यूएस पर एकल-उत्पत्ति (Single-Origin) सुरक्षित एचटीटीपी-ओनली कुकीज़ और टीएलएस 1.3 एन्क्रिप्शन के साथ संचालित होता है।"
    }
  };

  const t = content[lang];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "#F1F5F9",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        paddingBottom: 80,
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: "1px solid #1E293B",
          background: "rgba(8, 12, 20, 0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#1E293B",
              color: "#94A3B8",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 10px #10B981",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981", letterSpacing: 1 }}>
                {t.badge}
              </span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: "2px 0 0 0", color: "#fff" }}>
              {t.title}
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1E293B",
              color: "#E2E8F0",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Globe size={14} />
            {lang === "en" ? "हिन्दी" : "English"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px" }}>
        {/* Intro Card */}
        <div
          style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#064E3B",
                border: "1px solid #059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34D399",
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{t.updated}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#34D399" }}>
                Single-Server AWS Architecture · Zero Third-Party Trackers
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
            {t.intro}
          </p>
        </div>

        {/* Section 1: Data Fiduciary */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            {t.fiduciaryTitle}
          </h2>
          <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.5, marginBottom: 16 }}>
            {t.fiduciaryBody}
          </p>

          <div
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 14,
              padding: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 800 }}>
                {t.officerTitle}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 4 }}>
                {t.officerName}
              </div>
              <div style={{ fontSize: 13, color: "#10B981", marginTop: 2 }}>{t.officerRole}</div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#CBD5E1", marginBottom: 8 }}>
                <Mail size={16} style={{ color: "#34D399" }} />
                <a href={`mailto:${t.officerEmail}`} style={{ color: "#34D399", textDecoration: "none" }}>
                  {t.officerEmail}
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94A3B8" }}>
                <MapPin size={16} style={{ color: "#94A3B8" }} />
                <span>{t.officerJurisdiction}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Data Processed */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            {t.categoriesTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {t.categories.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  background: "#0F172A",
                  border: "1px solid #1E293B",
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#1E293B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38BDF8",
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#fff" }}>
                    {cat.title}
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Retention */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            {t.retentionTitle}
          </h2>
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {t.retentionItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "16px 20px",
                  borderBottom: idx < t.retentionItems.length - 1 ? "1px solid #1E293B" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={16} style={{ color: "#F59E0B" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: "#94A3B8",
                    background: "#1E293B",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontFamily: "monospace",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Rights of Data Principal */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            {t.rightsTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            {t.rightsItems.map((right, idx) => (
              <div
                key={idx}
                style={{
                  background: "#0F172A",
                  border: "1px solid #1E293B",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#064E3B",
                    color: "#34D399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px 0", color: "#fff" }}>
                    {right.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
                    {right.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Action Box */}
        <div
          style={{
            background: "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)",
            border: "1px solid #059669",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px 0", color: "#fff" }}>
              Exercise Your DPDP Data Rights
            </h3>
            <p style={{ fontSize: 13, color: "#A7F3D0", margin: 0 }}>
              Download your complete personal data archive or request immediate account erasure.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/account"
              style={{
                background: "#059669",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download size={16} /> Open Account Rights
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
