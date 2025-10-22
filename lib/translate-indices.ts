export function translateHeatIndexAdvisory(category: string, language: "en" | "tl" = "en"): string {
  const advisoryMap: Record<string, Record<"en" | "tl", string>> = {
    Safe: {
      en: "Normal heat conditions. No precautions needed.",
      tl: "Normal na kondisyon ng init. Walang pangangailangan ng pag-iingat.",
    },
    Caution: {
      en: "Warm conditions. Stay hydrated and limit outdoor activities.",
      tl: "Mainit na kondisyon. Manatiling hydrated at limitahan ang outdoor activities.",
    },
    "Extreme Caution": {
      en: "Very hot. Avoid prolonged sun exposure. Drink plenty of water.",
      tl: "Napakainit. Iwasan ang mahabang exposure sa araw. Uminom ng maraming tubig.",
    },
    Danger: {
      en: "Extreme heat. Heat cramps and heat exhaustion possible. Limit outdoor activities.",
      tl: "Sobrang init. Posibleng heat cramps at heat exhaustion. Limitahan ang outdoor activities.",
    },
    "Extreme Danger": {
      en: "Dangerous heat. Heat stroke likely. Avoid outdoor activities.",
      tl: "Mapanganibang init. Malamang na heat stroke. Iwasan ang outdoor activities.",
    },
  }

  return advisoryMap[category]?.[language] || advisoryMap[category]?.["en"] || ""
}

export function translateUVIndexAdvisory(category: string, language: "en" | "tl" = "en"): string {
  const advisoryMap: Record<string, Record<"en" | "tl", string>> = {
    Low: {
      en: "Low UV exposure. Minimal sun protection required.",
      tl: "Mababang UV exposure. Minimal na proteksyon mula sa araw.",
    },
    Moderate: {
      en: "Moderate UV exposure. Wear sunscreen SPF 30+.",
      tl: "Katamtamang UV exposure. Magsuot ng sunscreen SPF 30+.",
    },
    High: {
      en: "High UV exposure. Seek shade during midday. Use SPF 50+.",
      tl: "Mataas na UV exposure. Maghanap ng lilim sa tanghali. Gumamit ng SPF 50+.",
    },
    "Very High": {
      en: "Very high UV exposure. Avoid sun 10 AM-4 PM. Wear protective clothing.",
      tl: "Napakataas na UV exposure. Iwasan ang araw 10 AM-4 PM. Magsuot ng protective clothing.",
    },
    Extreme: {
      en: "Extreme UV exposure. Avoid all sun exposure. Stay indoors.",
      tl: "Sobrang UV exposure. Iwasan ang lahat ng sun exposure. Manatili sa loob.",
    },
  }

  return advisoryMap[category]?.[language] || advisoryMap[category]?.["en"] || ""
}

export function translateTyphoonImpactAdvisory(category: string, language: "en" | "tl" = "en"): string {
  const advisoryMap: Record<string, Record<"en" | "tl", string>> = {
    None: {
      en: "No typhoon threat. Normal conditions.",
      tl: "Walang banta ng bagyo. Normal na kondisyon.",
    },
    Minimal: {
      en: "Minimal typhoon impact. Monitor weather updates.",
      tl: "Minimal na epekto ng bagyo. Bantayan ang weather updates.",
    },
    Moderate: {
      en: "Moderate typhoon impact. Secure loose objects. Prepare emergency kit.",
      tl: "Katamtamang epekto ng bagyo. Siguruhin ang mga maluwag na bagay. Maghanda ng emergency kit.",
    },
    High: {
      en: "High typhoon impact. Stay indoors. Avoid travel.",
      tl: "Mataas na epekto ng bagyo. Manatili sa loob. Iwasan ang paglalakbay.",
    },
    "Very High": {
      en: "Very high typhoon impact. Seek shelter. Prepare for evacuation.",
      tl: "Napakataas na epekto ng bagyo. Maghanap ng shelter. Maghanda para sa evacuation.",
    },
    Catastrophic: {
      en: "Catastrophic typhoon impact. Evacuate immediately to safe shelter.",
      tl: "Katastropikong epekto ng bagyo. Mag-evacuate kaagad sa ligtas na shelter.",
    },
  }

  return advisoryMap[category]?.[language] || advisoryMap[category]?.["en"] || ""
}

export function translateTyphoonLevel(level: string, language: "en" | "tl" = "en"): string {
  const levelMap: Record<string, Record<"en" | "tl", string>> = {
    None: {
      en: "None",
      tl: "Wala",
    },
    "Tropical Depression (39-61 km/h)": {
      en: "Tropical Depression (39-61 km/h)",
      tl: "Tropical Depression (39-61 km/h)",
    },
    "Tropical Storm (62-88 km/h)": {
      en: "Tropical Storm (62-88 km/h)",
      tl: "Tropical Storm (62-88 km/h)",
    },
    "Severe Tropical Storm (89-117 km/h)": {
      en: "Severe Tropical Storm (89-117 km/h)",
      tl: "Severe Tropical Storm (89-117 km/h)",
    },
    "Typhoon (118-184 km/h)": {
      en: "Typhoon (118-184 km/h)",
      tl: "Bagyo (118-184 km/h)",
    },
    "Super Typhoon (≥185 km/h)": {
      en: "Super Typhoon (≥185 km/h)",
      tl: "Super Bagyo (≥185 km/h)",
    },
  }

  return levelMap[level]?.[language] || level
}
