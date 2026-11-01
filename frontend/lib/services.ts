export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  title_hi: string;
  subtitle: string;
  subtitle_hi: string;
  description: string;
  description_hi: string;
  icon: string;
  badge?: "GTFS data" | "Demo data" | "Beta" | "New" | "SOS";
  category: "travel" | "fares" | "safety" | "support";
  details: {
    summary: string;
    summary_hi: string;
    items: { label: string; label_hi: string; val: string }[];
    actionLabel?: string;
    actionLabel_hi?: string;
    actionLink?: string;
  };
}

export const STATIC_SERVICES: ServiceItem[] = [
  {
    id: "find_bus",
    slug: "find-a-bus",
    title: "Find a bus",
    title_hi: "बस खोजें",
    subtitle: "Search all 19 routes",
    subtitle_hi: "सभी 19 रूट खोजें",
    description: "Search 19 routes across Delhi NCR with stop timelines and live arrival ETAs.",
    description_hi: "स्टॉप टाइमलाइन और लाइव आगमन ईटीए के साथ दिल्ली एनसीआर के 19 रूट खोजें।",
    icon: "Bus",
    badge: "GTFS data",
    category: "travel",
    details: {
      summary: "Real-time fleet tracking covering 19 major corridors and 6,812 bus stops.",
      summary_hi: "19 प्रमुख गलियारों और 6,812 बस स्टॉप को कवर करने वाली लाइव बस ट्रैकिंग।",
      items: [
        { label: "Fleet Coverage", label_hi: "फ्लीट कवरेज", val: "193 Active Buses (Demo data)" },
        { label: "Corridors", label_hi: "कॉरिडोर", val: "Ring Road, Outer Ring, Central" },
        { label: "Tracking Protocol", label_hi: "ट्रैकिंग प्रोटोकॉल", val: "AIS-140 GPS Beacons" }
      ],
      actionLabel: "Search bus routes",
      actionLabel_hi: "बस रूट खोजें",
      actionLink: "/services/find-a-bus"
    }
  },
  {
    id: "plan_trip",
    slug: "plan-a-trip",
    title: "Plan a trip",
    title_hi: "यात्रा योजना बनाएं",
    subtitle: "Direct & 1-change routes",
    subtitle_hi: "सीधे व 1-बदलाव वाले रूट",
    description: "Door-to-door transit route planner with candidate buses and transfer stops.",
    description_hi: "उम्मीदवार बसों और ट्रांसफर स्टॉप के साथ यात्रा योजना बनाएं।",
    icon: "MapPin",
    badge: "Beta",
    category: "travel",
    details: {
      summary: "Find optimal bus transfers and departure headways between any two Delhi NCR stops.",
      summary_hi: "किन्हीं दो स्टॉप के बीच सर्वोत्तम बस ट्रांसफर और प्रस्थान खोजें।",
      items: [
        { label: "Algorithms", label_hi: "एल्गोरिदम", val: "Dijkstra Headway Routing" },
        { label: "Max Transfers", label_hi: "अधिकतम बदलाव", val: "1 Transfer Optimal" },
        { label: "Fares Estimation", label_hi: "किराया अनुमान", val: "Official Delhi DTC Slabs" }
      ],
      actionLabel: "Plan transit journey",
      actionLabel_hi: "यात्रा योजना बनाएं",
      actionLink: "/services/plan-a-trip"
    }
  },
  {
    id: "seat_finder",
    slug: "seat-finder",
    title: "Seat finder",
    title_hi: "सीट उपलब्धता",
    subtitle: "Predict vacant seats live",
    subtitle_hi: "खाली सीटों का लाइव अनुमान",
    description: "Filter buses by predicted passenger density and probability of getting a seat.",
    description_hi: "अनुमानित यात्री घनत्व और सीट मिलने की संभावना के आधार पर बसें फ़िल्टर करें।",
    icon: "Users",
    badge: "New",
    category: "travel",
    details: {
      summary: "Predicts seated passenger availability based on conductor ticketing rate and stop history.",
      summary_hi: "कंडक्टर टिकटिंग दर और स्टॉप इतिहास के आधार पर बैठने की सीट उपलब्धता का अनुमान।",
      items: [
        { label: "Low Crowd", label_hi: "कम भीड़", val: "< 40% Capacity (Seats Available)" },
        { label: "Moderate", label_hi: "मध्यम भीड़", val: "40% - 75% Capacity" },
        { label: "High Crowd", label_hi: "अधिक भीड़", val: "> 75% Capacity (Standing Only)" }
      ],
      actionLabel: "Find vacant seats",
      actionLabel_hi: "खाली सीटें खोजें",
      actionLink: "/services/seat-finder"
    }
  },
  {
    id: "night_buses",
    slug: "night-buses",
    title: "Night buses",
    title_hi: "रात्रि बस सेवा",
    subtitle: "22:00 to 05:00 corridors",
    subtitle_hi: "22:00 से 05:00 कॉरिडोर",
    description: "DTC night service routes operating 22:00 to 05:00 across key railway hubs.",
    description_hi: "प्रमुख रेलवे स्टेशनों और अस्पतालों को जोड़ने वाली रात्रि बस सेवाएं।",
    icon: "Moon",
    badge: "GTFS data",
    category: "travel",
    details: {
      summary: "Dedicated night transit connecting New Delhi Railway Station, ISBT Kashmere Gate, AIIMS, and Mehrauli.",
      summary_hi: "नई दिल्ली रेलवे स्टेशन, कश्मीरी गेट, एम्स और महरौली को जोड़ने वाली समर्पित रात्रि पारगमन।",
      items: [
        { label: "Night Routes", label_hi: "रात्रि रूट", val: "044, 073, 0114, 0205, 0261" },
        { label: "Frequency", label_hi: "आवृत्ति", val: "Every 25–40 minutes" },
        { label: "Security", label_hi: "सुरक्षा", val: "Bus Marshal on every vehicle" }
      ],
      actionLabel: "Explore night corridors",
      actionLabel_hi: "रात्रि बसें देखें",
      actionLink: "/services/night-buses"
    }
  },
  {
    id: "fares_passes",
    slug: "fares-passes",
    title: "Fares & passes",
    title_hi: "किराया एवं पास",
    subtitle: "DTC fare slabs & pink pass",
    subtitle_hi: "डीटीसी किराया व पिंक पास",
    description: "Official fare slabs for AC & Non-AC buses, daily transit passes, and free Pink Pass.",
    description_hi: "एसी व नॉन-एसी बसों के लिए आधिकारिक किराया स्लैब और महिलाओं के लिए मुफ्त पिंक पास।",
    icon: "CreditCard",
    badge: "GTFS data",
    category: "fares",
    details: {
      summary: "Regulated fare structure implemented by Delhi Transport Corporation (DTC).",
      summary_hi: "दिल्ली परिवहन निगम (DTC) द्वारा निर्धारित आधिकारिक किराया संरचना।",
      items: [
        { label: "Non-AC Bus", label_hi: "नॉन-एसी बस", val: "₹5 (0-4 km) / ₹10 (4-10 km) / ₹15 (10+ km)" },
        { label: "AC Bus", label_hi: "एसी बस", val: "₹10 / ₹15 / ₹20 / ₹25 (by distance)" },
        { label: "Daily Pass", label_hi: "दैनिक पास", val: "₹40 (Non-AC) / ₹50 (AC fleets)" },
        { label: "Women Commuters", label_hi: "महिला यात्री", val: "100% Free Pink Single-Journey Ticket" }
      ],
      actionLabel: "View DTC fare table",
      actionLabel_hi: "किराया विवरण देखें",
      actionLink: "/services/fares-passes"
    }
  },
  {
    id: "timetables",
    slug: "timetables",
    title: "Timetables & headways",
    title_hi: "समय सारणी",
    subtitle: "Corridor headways & times",
    subtitle_hi: "कॉरिडोर समय व अंतराल",
    description: "Published GTFS timetable headways, first and last trip times across Delhi terminals.",
    description_hi: "दिल्ली के टर्मिनलों पर पहली और अंतिम यात्रा का समय और बस अंतराल।",
    icon: "Clock",
    badge: "GTFS data",
    category: "travel",
    details: {
      summary: "First/last bus schedules and headway frequency across all Delhi terminals.",
      summary_hi: "सभी दिल्ली टर्मिनलों पर पहली/अंतिम बस का समय और आवृत्ति।",
      items: [
        { label: "Peak Headway", label_hi: "पीक अंतराल", val: "6 to 10 minutes" },
        { label: "Off-Peak Headway", label_hi: "ऑफ-पीक अंतराल", val: "12 to 18 minutes" },
        { label: "Service Span", label_hi: "सेवा अवधि", val: "05:00 AM – 11:30 PM" }
      ],
      actionLabel: "Check terminal timetables",
      actionLabel_hi: "समय सारणी जांचें",
      actionLink: "/services/timetables"
    }
  },
  {
    id: "depots",
    slug: "depots",
    title: "Nearby depots & terminals",
    title_hi: "डिपो और टर्मिनल",
    subtitle: "Major Delhi depots & bays",
    subtitle_hi: "प्रमुख डिपो व टर्मिनल",
    description: "Directory of DTC and DIMTS bus depots, major ISBT terminals, bay numbers, and contacts.",
    description_hi: "डीटीसी बस डिपो, आईएसबीटी टर्मिनल, बे नंबर और संपर्क निर्देशिका।",
    icon: "Building2",
    badge: "Demo data",
    category: "travel",
    details: {
      summary: "Directory of 38 operational bus depots and 4 Inter-State Bus Terminals in Delhi NCR.",
      summary_hi: "दिल्ली एनसीआर में 38 चालू बस डिपो और 4 अंतर्राज्यीय बस टर्मिनलों की निर्देशिका।",
      items: [
        { label: "Major ISBTs", label_hi: "प्रमुख आईएसबीटी", val: "Kashmere Gate, Anand Vihar, Sarai Kale Khan" },
        { label: "Electric Depots", label_hi: "इलेक्ट्रिक डिपो", val: "Rohini-1, Mayapuri, Rajghat, Banda Bahadur" },
        { label: "Contact Helpline", label_hi: "संपर्क हेल्पलाइन", val: "011-23317523 (DTC Central Control)" }
      ],
      actionLabel: "View depot directory",
      actionLabel_hi: "डिपो सूची देखें",
      actionLink: "/services/depots"
    }
  },
  {
    id: "service_alerts",
    slug: "service-alerts",
    title: "Service alerts",
    title_hi: "सेवा अलर्ट",
    subtitle: "Active diversions & delays",
    subtitle_hi: "मार्ग परिवर्तन व देरी",
    description: "Real-time route diversions, road construction alerts, VIP movements, and seasonal delays.",
    description_hi: "सड़क निर्माण, वीआईपी आवाजाही और मौसम संबंधी देरी के लिए रियल-टाइम अलर्ट।",
    icon: "AlertTriangle",
    badge: "Beta",
    category: "travel",
    details: {
      summary: "Transit notices issued by Delhi Traffic Police and Delhi Transport Department.",
      summary_hi: "दिल्ली ट्रैफिक पुलिस और परिवहन विभाग द्वारा जारी की गई आधिकारिक सूचनाएं।",
      items: [
        { label: "Active Diversions", label_hi: "सक्रिय मार्ग परिवर्तन", val: "Route 502 via Aurobindo Marg" },
        { label: "Central Secretariat", label_hi: "केंद्रीय सचिवालय", val: "Normal operations on Janpath" },
        { label: "Update Frequency", label_hi: "अपडेट आवृत्ति", val: "Refreshed every 15 minutes" }
      ],
      actionLabel: "View traffic advisories",
      actionLabel_hi: "ट्रैफिक सूचनाएं देखें",
      actionLink: "/services/service-alerts"
    }
  },
  {
    id: "safety_sos",
    slug: "safety-sos",
    title: "Safety & SOS",
    title_hi: "सुरक्षा एवं एसओएस",
    subtitle: "Emergency SOS & dispatch",
    subtitle_hi: "आपातकालीन एसओएस और सहायता",
    description: "In-bus panic button system, GPS coordinate broadcast to Delhi Police 112, and bus marshal alerts.",
    description_hi: "इन-बस पैनिक बटन, दिल्ली पुलिस 112 को जीपीएस प्रसारण और मार्शल सहायता।",
    icon: "ShieldAlert",
    badge: "SOS",
    category: "safety",
    details: {
      summary: "Integrated safety protocol equipped with physical panic buttons and CCTV live feeds on all DTC fleets.",
      summary_hi: "सभी डीटीसी बसों में पैनिक बटन और सीसीटीवी से लैस एकीकृत सुरक्षा प्रणाली।",
      items: [
        { label: "Panic Response", label_hi: "पैनिक प्रतिक्रिया", val: "Instant SMS + GPS to Police PCR" },
        { label: "Bus Marshals", label_hi: "बस मार्शल", val: "Stationed inside all standard buses" },
        { label: "Camera Coverage", label_hi: "कैमरा कवरेज", val: "3 CCTVs per bus with cloud storage" }
      ],
      actionLabel: "Open Safety Screen",
      actionLabel_hi: "सुरक्षा स्क्रीन खोलें",
      actionLink: "/safety"
    }
  },
  {
    id: "emergency_contacts",
    slug: "emergency-helplines",
    title: "Help & emergency numbers",
    title_hi: "आपातकालीन हेल्पलाइन",
    subtitle: "Police, women & medical",
    subtitle_hi: "पुलिस, महिला व चिकित्सा",
    description: "Verified direct contact numbers for Delhi Police, Women's Helpline, Medical Ambulance, and DTC Lost & Found.",
    description_hi: "दिल्ली पुलिस, महिला हेल्पलाइन और एम्बुलेंस के लिए सत्यापित सीधे फोन नंबर।",
    icon: "PhoneCall",
    badge: "SOS",
    category: "safety",
    details: {
      summary: "Direct verified emergency hotlines operational 24x7 in the National Capital Territory of Delhi.",
      summary_hi: "राष्ट्रीय राजधानी क्षेत्र दिल्ली में 24x7 कार्यरत सीधे सत्यापित आपातकालीन नंबर।",
      items: [
        { label: "National Emergency", label_hi: "राष्ट्रीय आपातकाल", val: "112 (Toll Free)" },
        { label: "Women in Distress", label_hi: "महिला हेल्पलाइन", val: "1091 (Delhi Police)" },
        { label: "DTC Lost & Found", label_hi: "खोया-पाया विभाग", val: "011-23370210" },
        { label: "Ambulance", label_hi: "एम्बुलेंस सेवा", val: "102 / 108" }
      ],
      actionLabel: "Call 112 Emergency",
      actionLabel_hi: "112 डायल करें",
      actionLink: "tel:112"
    }
  },
  {
    id: "report_problem",
    slug: "report-problem",
    title: "Report a problem",
    title_hi: "समस्या दर्ज करें",
    subtitle: "File transit grievance",
    subtitle_hi: "शिकायत दर्ज करें",
    description: "Lodge transit complaints regarding conductor overcharging, bus skipping stops, rash driving, or AC breakdown.",
    description_hi: "कंडक्टर द्वारा अधिक किराया, स्टॉप छोड़ना, या एसी खराबी की शिकायत दर्ज करें।",
    icon: "FileQuestion",
    badge: "New",
    category: "support",
    details: {
      summary: "Official grievance redressal portal generating tracking tickets for DTC and Delhi Transport Department.",
      summary_hi: "डीटीसी और परिवहन विभाग के लिए ट्रैकिंग टिकट उत्पन्न करने वाला आधिकारिक पोर्टल।",
      items: [
        { label: "Average Resolution", label_hi: "औसत समाधान समय", val: "Within 48 hours" },
        { label: "Tracking", label_hi: "ट्रैकिंग", val: "Automated Ticket ID & SMS updates" },
        { label: "Escalation", label_hi: "अपील अधिकारी", val: "Joint Commissioner (Transport)" }
      ],
      actionLabel: "File new complaint",
      actionLabel_hi: "नई शिकायत दर्ज करें",
      actionLink: "/services/report-problem"
    }
  },
  {
    id: "faqs",
    slug: "faqs",
    title: "Transit FAQs",
    title_hi: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle: "Rules, tickets & lost items",
    subtitle_hi: "नियम, टिकट व खोया सामान",
    description: "Answers to common questions regarding metro card validity, luggage allowances, child fares, and route timings.",
    description_hi: "मेट्रो कार्ड की वैधता, सामान सीमा, बाल किराया और रूट समय के बारे में अक्सर पूछे जाने वाले प्रश्न।",
    icon: "HelpCircle",
    badge: "Demo data",
    category: "support",
    details: {
      summary: "Comprehensive guide to ticketing rules, luggage limits, and smart card usage in Delhi public buses.",
      summary_hi: "दिल्ली की बसों में टिकटिंग नियमों और स्मार्ट कार्ड के उपयोग के लिए व्यापक गाइड।",
      items: [
        { label: "Metro Card on Bus", label_hi: "बस में मेट्रो कार्ड", val: "Valid on all DTC & Cluster buses with 10% discount" },
        { label: "Luggage Allowance", label_hi: "सामान की अनुमति", val: "Free up to 25 kg per passenger" },
        { label: "Children Under 3", label_hi: "3 वर्ष से कम बच्चे", val: "Travel free without ticket" }
      ],
      actionLabel: "Browse all FAQs",
      actionLabel_hi: "सभी प्रश्न पढ़ें",
      actionLink: "/services/faqs"
    }
  },
  {
    id: "feedback",
    slug: "feedback",
    title: "Passenger feedback",
    title_hi: "यात्री प्रतिक्रिया",
    subtitle: "Rate your bus commute",
    subtitle_hi: "अपनी बस यात्रा रेट करें",
    description: "Rate fleet cleanliness, driving smoothness, conductor politeness, and help improve Delhi transit.",
    description_hi: "सफाई, चालक के व्यवहार और कंडक्टर की विनम्रता को रेट करें और दिल्ली परिवहन को बेहतर बनाएं।",
    icon: "MessageSquare",
    badge: "New",
    category: "support",
    details: {
      summary: "Direct commuter feedback channel analyzed weekly by the Delhi Transport Department.",
      summary_hi: "दिल्ली परिवहन विभाग द्वारा साप्ताहिक रूप से विश्लेषित किया जाने वाला प्रत्यक्ष यात्री फीडबैक।",
      items: [
        { label: "Survey Scope", label_hi: "सर्वेक्षण दायरा", val: "Cleanliness, Punctuality, Driving Quality" },
        { label: "Impact", label_hi: "प्रभाव", val: "Used for driver training & fleet upgrades" },
        { label: "Time Needed", label_hi: "आवश्यक समय", val: "< 60 seconds" }
      ],
      actionLabel: "Submit transit review",
      actionLabel_hi: "प्रतिक्रिया सबमिट करें",
      actionLink: "/services/feedback"
    }
  }
];
