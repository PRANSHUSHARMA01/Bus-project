export interface ServiceItem {
  id: string;
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  icon: string;
  badge?: string;
  category: "travel" | "fares" | "safety" | "support";
  link?: string;
  details?: {
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
    title: "Find a Bus",
    title_hi: "बस खोजें",
    description: "Search 19 routes across Delhi NCR with stop timelines",
    description_hi: "स्टॉप टाइमलाइन के साथ दिल्ली एनसीआर के 19 रूट खोजें",
    icon: "Bus",
    badge: "GTFS data",
    category: "travel",
    link: "/?search=1",
    details: {
      summary: "Real-time fleet tracking covering 19 major corridors and 6,812 bus stops.",
      summary_hi: "19 प्रमुख गलियारों और 6,812 बस स्टॉप को कवर करने वाली लाइव बस ट्रैकिंग।",
      items: [
        { label: "Fleet Coverage", label_hi: "फ्लीट कवरेज", val: "193 Active Buses (Demo data)" },
        { label: "Corridors", label_hi: "कॉरिडोर", val: "Ring Road, Outer Ring, Central" },
        { label: "Tracking Protocol", label_hi: "ट्रैकिंग प्रोटोकॉल", val: "AIS-140 GPS Beacons" }
      ],
      actionLabel: "Track Live on Map",
      actionLabel_hi: "मानचित्र पर लाइव ट्रैक करें",
      actionLink: "/"
    }
  },
  {
    id: "trip_planner",
    title: "Plan a Trip",
    title_hi: "यात्रा योजना बनाएं",
    description: "Door-to-door transit route planner with candidate buses",
    description_hi: "उम्मीदवार बसों के साथ यात्रा योजनाकार",
    icon: "MapPin",
    badge: "Multi-bus",
    category: "travel",
    link: "/?plan=1",
    details: {
      summary: "Find optimal bus transfers and departure headways between any two stops.",
      summary_hi: "किन्हीं दो स्टॉप के बीच सर्वोत्तम बस ट्रांसफर और प्रस्थान खोजें।",
      items: [
        { label: "Algorithms", label_hi: "एल्गोरिदम", val: "Dijkstra Headway Routing" },
        { label: "Max Transfers", label_hi: "अधिकतम बदलाव", val: "1 Transfer Optimal" },
        { label: "Fares Estimation", label_hi: "किराया अनुमान", val: "Official Delhi DTC Slabs" }
      ],
      actionLabel: "Open Trip Planner",
      actionLabel_hi: "ट्रिप प्लानर खोलें",
      actionLink: "/?plan=1"
    }
  },
  {
    id: "seat_finder",
    title: "Seat Finder",
    title_hi: "सीट उपलब्धता खोजक",
    description: "Filter buses by predicted passenger density & vacant seats",
    description_hi: "अनुमानित यात्री घनत्व और खाली सीटों के आधार पर फ़िल्टर करें",
    icon: "Users",
    badge: "Heuristic model",
    category: "travel",
    details: {
      summary: "Predicts seated passenger availability based on conductor ticketing rate and stop history.",
      summary_hi: "कंडक्टर टिकटिंग दर और स्टॉप इतिहास के आधार पर बैठने की सीट उपलब्धता का अनुमान।",
      items: [
        { label: "Low Crowd", label_hi: "कम भीड़", val: "< 40% Capacity (Seats Available)" },
        { label: "Moderate", label_hi: "मध्यम भीड़", val: "40% - 75% Capacity" },
        { label: "High Crowd", label_hi: "अधिक भीड़", val: "> 75% Capacity (Standing Only)" }
      ],
      actionLabel: "View Low-Crowd Buses",
      actionLabel_hi: "कम भीड़ वाली बसें देखें",
      actionLink: "/?crowd=low"
    }
  },
  {
    id: "night_buses",
    title: "Night Buses",
    title_hi: "रात्रि बस सेवा",
    description: "DTC night service routes operating 11:00 PM to 05:00 AM",
    description_hi: "रात 11:00 बजे से सुबह 05:00 बजे तक चलने वाली डीटीसी बसें",
    icon: "Moon",
    badge: "Night owl",
    category: "travel",
    details: {
      summary: "Dedicated night transit connecting New Delhi Railway Station, ISBT Kashmere Gate, and Anand Vihar.",
      summary_hi: "नई दिल्ली रेलवे स्टेशन, कश्मीरी गेट और आनंद विहार को जोड़ने वाली समर्पित रात्रि सेवा।",
      items: [
        { label: "Operating Hours", label_hi: "संचालन समय", val: "23:00 - 05:00 Daily" },
        { label: "Key Terminals", label_hi: "प्रमुख टर्मिनल", val: "NDLS, ISBT, AIIMS, Anand Vihar" },
        { label: "Safety Marshall", label_hi: "सुरक्षा मार्शल", val: "Present on all night routes" }
      ],
      actionLabel: "Track Night Corridors",
      actionLabel_hi: "रात्रि कॉरिडोर ट्रैक करें",
      actionLink: "/?route=RL-77"
    }
  },
  {
    id: "fares_passes",
    title: "Fares & Passes",
    title_hi: "किराया और पास",
    description: "DTC distance fare slabs, pink passes & daily tickets",
    description_hi: "दूरी के आधार पर किराया स्लैब, पिंक पास और दैनिक टिकट",
    icon: "CreditCard",
    badge: "Official DTC slabs",
    category: "fares",
    details: {
      summary: "Standard non-AC and AC fare stages as notified by Transport Department, GNCTD.",
      summary_hi: "दिल्ली सरकार परिवहन विभाग द्वारा अधिसूचित मानक नॉन-एसी और एसी किराया स्लैब।",
      items: [
        { label: "Non-AC Slabs", label_hi: "नॉन-एसी किराया", val: "₹5 (0-4 km), ₹10 (4-10 km), ₹15 (>10 km)" },
        { label: "AC Bus Slabs", label_hi: "एसी किराया", val: "₹10, ₹15, ₹20, ₹25" },
        { label: "Women Pink Ticket", label_hi: "पिंक टिकट", val: "₹0 Free travel for women passengers" },
        { label: "Daily Pass", label_hi: "दैनिक पास", val: "₹40 (Non-AC), ₹50 (All buses)" }
      ],
      actionLabel: "Open Conductor App",
      actionLabel_hi: "कंडक्टर ऐप खोलें",
      actionLink: "/conductor"
    }
  },
  {
    id: "timetables",
    title: "Timetables & Headways",
    title_hi: "समय सारिणी और आवृत्ति",
    description: "First & last bus departure schedules across Delhi terminals",
    description_hi: "दिल्ली टर्मिनलों पर पहली और अंतिम बस का समय",
    icon: "Clock",
    badge: "Frequency GTFS",
    category: "travel",
    details: {
      summary: "Standard scheduled peak headways of 8-12 minutes and off-peak headways of 15-20 minutes.",
      summary_hi: "पीक घंटों में 8-12 मिनट और नॉन-पीक घंटों में 15-20 मिनट की निर्धारित आवृत्ति।",
      items: [
        { label: "Morning First Bus", label_hi: "प्रथम बस", val: "05:15 AM - 05:45 AM" },
        { label: "Night Last Bus", label_hi: "अंतिम बस", val: "10:45 PM - 11:15 PM" },
        { label: "Peak Headway", label_hi: "पीक आवृत्ति", val: "Every 8 to 12 minutes" }
      ],
      actionLabel: "Check Route Timelines",
      actionLabel_hi: "रूट टाइमलाइन देखें",
      actionLink: "/?route=502"
    }
  },
  {
    id: "nearby_depots",
    title: "Nearby Depots & Terminals",
    title_hi: "निकटतम डिपो और टर्मिनल",
    description: "Major bus stations, interstate terminals & maintenance sheds",
    description_hi: "प्रमुख बस स्टेशन, अंतरराज्यीय टर्मिनल और डिपो",
    icon: "MapPin",
    badge: "Directory",
    category: "travel",
    details: {
      summary: "Directory of Delhi Transport Corporation operational depots with terminal control contacts.",
      summary_hi: "टर्मिनल नियंत्रण संपर्कों के साथ दिल्ली परिवहन निगम संचालन डिपो।",
      items: [
        { label: "ISBT Kashmere Gate", label_hi: "कश्मीरी गेट आईएसबीटी", val: "Central & Northern Routes" },
        { label: "Sarojini Nagar Depot", label_hi: "सरोजिनी नगर डिपो", val: "South Delhi Cluster Hub" },
        { label: "Anand Vihar ISBT", label_hi: "आनंद विहार आईएसबीटी", val: "Trans-Yamuna & Ghaziabad Hub" }
      ]
    }
  },
  {
    id: "service_alerts",
    title: "Service Alerts",
    title_hi: "सेवा अलर्ट और डायवर्जन",
    description: "Active road maintenance, diversions and route updates",
    description_hi: "सड़क मरम्मत, डायवर्जन और मार्ग परिवर्तन की जानकारी",
    icon: "ShieldCheck",
    badge: "Live feeds",
    category: "travel",
    details: {
      summary: "Automated transit operational notices in coordination with Delhi Traffic Police.",
      summary_hi: "दिल्ली ट्रैफिक पुलिस के समन्वय में स्वचालित परिचालन सूचनाएं।",
      items: [
        { label: "Vikas Marg Diversion", label_hi: "विकास मार्ग डायवर्जन", val: "Routes 73 & 85 diverted via ITO flyover" },
        { label: "Weather Advisory", label_hi: "मौसम सलाह", val: "Fog speed restriction 35 km/h in early morning" }
      ]
    }
  },
  {
    id: "safety_sos",
    title: "Safety & SOS Portal",
    title_hi: "महिला सुरक्षा और एसओएस",
    description: "5-second buffered emergency dispatch with 112 police integration",
    description_hi: "112 पुलिस आपातकालीन डिस्पैच और लाइव सुरक्षा ट्रैकिंग",
    icon: "HeartHandshake",
    badge: "AIS-140 Safe",
    category: "safety",
    link: "/safety",
    details: {
      summary: "Dedicated safety ecosystem with panic button, live GPS sharing, and police helplines.",
      summary_hi: "पैनिक बटन, लाइव जीपीएस शेयरिंग और पुलिस हेल्पलाइन के साथ समर्पित सुरक्षा प्रणाली।",
      items: [
        { label: "Police Dispatch", label_hi: "पुलिस डिस्पैच", val: "Dial 112 Adapter (Delhi Police ERSS)" },
        { label: "Women Helpline", label_hi: "महिला हेल्पलाइन", val: "1091 (Toll-Free, 24x7)" },
        { label: "Bus Marshals", label_hi: "बस मार्शल", val: "Civil Defence volunteers on duty" }
      ],
      actionLabel: "Open Safety Portal",
      actionLabel_hi: "सुरक्षा पोर्टल खोलें",
      actionLink: "/safety"
    }
  },
  {
    id: "emergency_numbers",
    title: "Emergency Helplines",
    title_hi: "आपातकालीन हेल्पलाइन नंबर",
    description: "Instant direct dialing for Police 112, Women 1091 & DTC Control",
    description_hi: "पुलिस 112, महिला हेल्पलाइन 1091 और डीटीसी सहायता नंबर",
    icon: "PhoneCall",
    badge: "24x7 Dial",
    category: "safety",
    details: {
      summary: "Immediate touch-to-call directory for verified Delhi safety response teams.",
      summary_hi: "सत्यापित दिल्ली सुरक्षा प्रतिक्रिया टीमों के लिए तत्काल कॉल निर्देशिका।",
      items: [
        { label: "National Emergency", label_hi: "राष्ट्रीय आपातकाल", val: "112" },
        { label: "Delhi Women Helpline", label_hi: "दिल्ली महिला हेल्पलाइन", val: "1091" },
        { label: "DTC Central Control Room", label_hi: "डीटीसी कंट्रोल रूम", val: "011-23370236" }
      ],
      actionLabel: "Call Police (112)",
      actionLabel_hi: "पुलिस को कॉल करें (112)",
      actionLink: "tel:112"
    }
  },
  {
    id: "report_problem",
    title: "Report a Problem",
    title_hi: "समस्या दर्ज करें",
    description: "File issues regarding bus cleanliness, overcharging or missing stops",
    description_hi: "सफाई, अधिक किराया या स्टॉप छूटने की शिकायत दर्ज करें",
    icon: "ShieldCheck",
    badge: "Ticket ID",
    category: "support",
    details: {
      summary: "Official passenger grievance portal generating tracked token IDs stored in local audit logs.",
      summary_hi: "ट्रैक किए गए टोकन आईडी उत्पन्न करने वाला आधिकारिक यात्री शिकायत पोर्टल।",
      items: [
        { label: "Resolution SLA", label_hi: "समाधान समय", val: "24 to 48 Hours" },
        { label: "Assigned Authority", label_hi: "जिम्मेदार विभाग", val: "GNCTD Transport Vigilance" }
      ],
      actionLabel: "View Activity Logs",
      actionLabel_hi: "गतिविधि लॉग देखें",
      actionLink: "/activity"
    }
  },
  {
    id: "faqs",
    title: "FAQs & Passenger Charter",
    title_hi: "अक्सर पूछे जाने वाले प्रश्न",
    description: "Ticketing policies, baggage allowances & transit rights",
    description_hi: "टिकट नियम, सामान की सीमा और यात्री अधिकार",
    icon: "Info",
    badge: "Charter",
    category: "support",
    details: {
      summary: "Rights and guidelines for commuters travelling on Delhi public transit buses.",
      summary_hi: "दिल्ली की सार्वजनिक बसों में यात्रा करने वाले यात्रियों के अधिकार और दिशा-निर्देश।",
      items: [
        { label: "Luggage Allowance", label_hi: "सामान छूट", val: "Up to 25 kg free of charge" },
        { label: "Children Policy", label_hi: "बच्चे", val: "Free below 3 years of age" },
        { label: "Senior Citizens", label_hi: "वरिष्ठ नागरिक", val: "Reserved seats in front rows" }
      ]
    }
  },
  {
    id: "feedback",
    title: "Transit Feedback",
    title_hi: "यात्री प्रतिक्रिया",
    description: "Share recommendations to improve bus routes and frequencies",
    description_hi: "बस मार्गों और आवृत्ति में सुधार के लिए अपने सुझाव साझा करें",
    icon: "HeartHandshake",
    badge: "Community",
    category: "support",
    details: {
      summary: "Passenger feedback directly contributes to schedule calibration in our routing engine.",
      summary_hi: "यात्री प्रतिक्रिया हमारे रूटिंग इंजन में सीधे सुधार करती है।",
      items: [
        { label: "Quarterly Review", label_hi: "त्रैमासिक समीक्षा", val: "DTC Route Rationalization Team" },
        { label: "Engineering Lead", label_hi: "इंजीनियरिंग", val: "Team Qubits (pranshusharma.tech)" }
      ],
      actionLabel: "Review App Design",
      actionLabel_hi: "डिज़ाइन समीक्षा देखें",
      actionLink: "/design-system"
    }
  }
];
