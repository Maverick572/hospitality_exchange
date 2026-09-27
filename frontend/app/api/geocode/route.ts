import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated Mumbai & Maharashtra hubs for instant matching and offline/rate-limit fallback
const KNOWN_HUBS: { name: string; aliases: string[]; lat: number; lng: number }[] = [
  { name: "Bandra West, Mumbai", aliases: ["bandra", "bandra west", "bandra w"], lat: 19.0596, lng: 72.8295 },
  { name: "Bandra Kurla Complex (BKC), Mumbai", aliases: ["bkc", "bandra kurla complex"], lat: 19.0664, lng: 72.8684 },
  { name: "Andheri East, Mumbai", aliases: ["andheri east", "andheri e", "midc andheri"], lat: 19.1136, lng: 72.8697 },
  { name: "Andheri West, Mumbai", aliases: ["andheri west", "andheri w", "lokhandwala"], lat: 19.1363, lng: 72.8277 },
  { name: "Powai, Mumbai", aliases: ["powai", "hiranandani", "iit bombay"], lat: 19.1176, lng: 72.906 },
  { name: "Vile Parle East, Mumbai", aliases: ["vile parle", "vile parle east"], lat: 19.0998, lng: 72.8438 },
  { name: "Goregaon East, Mumbai", aliases: ["goregaon", "goregaon east"], lat: 19.1663, lng: 72.8526 },
  { name: "Worli, Mumbai", aliases: ["worli", "worli seaface"], lat: 19.0176, lng: 72.8172 },
  { name: "Lower Parel, Mumbai", aliases: ["lower parel", "phoenix palladium"], lat: 18.9953, lng: 72.8306 },
  { name: "Fort, Mumbai", aliases: ["fort", "cst", "marine lines"], lat: 18.9322, lng: 72.8335 },
  { name: "Colaba, Mumbai", aliases: ["colaba", "gateway of india", "cuffe parade"], lat: 18.9067, lng: 72.8147 },
  { name: "Dadar, Mumbai", aliases: ["dadar", "dadar west", "shivaji park"], lat: 19.0178, lng: 72.8478 },
  { name: "Thane West, Maharashtra", aliases: ["thane", "thane west", "naupada", "ghodbunder"], lat: 19.2183, lng: 72.9781 },
  { name: "Vashi, Navi Mumbai", aliases: ["vashi", "apmc", "vashi sector 17"], lat: 19.0771, lng: 72.9986 },
  { name: "Nerul, Navi Mumbai", aliases: ["nerul", "seawoods"], lat: 19.033, lng: 73.016 },
  { name: "Belapur, Navi Mumbai", aliases: ["cbd belapur", "belapur"], lat: 19.018, lng: 73.04 },
  { name: "Panvel, Navi Mumbai", aliases: ["panvel", "khandeshwar"], lat: 18.9894, lng: 73.1175 },
  { name: "Chembur, Mumbai", aliases: ["chembur", "chembur east"], lat: 19.0623, lng: 72.8973 },
  { name: "Ghatkopar, Mumbai", aliases: ["ghatkopar", "r city mall"], lat: 19.086, lng: 72.908 },
  { name: "Kurla, Mumbai", aliases: ["kurla", "phoenix marketcity"], lat: 19.0657, lng: 72.8794 },
  { name: "Malad West, Mumbai", aliases: ["malad", "malad west", "inorbit"], lat: 19.186, lng: 72.8485 },
  { name: "Borivali West, Mumbai", aliases: ["borivali", "borivali west"], lat: 19.2307, lng: 72.8567 },
  { name: "Mumbai Central, Mumbai", aliases: ["mumbai central", "tardeo", "grant road"], lat: 18.9696, lng: 72.8193 },
];

function findKnownHub(query: string) {
  const norm = query.toLowerCase().trim();
  return KNOWN_HUBS.find(
    (h) => h.aliases.some((a) => norm.includes(a)) || norm.includes(h.name.toLowerCase())
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  // 1. REVERSE GEOCODING (lat + lon -> address)
  if (latStr && lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!isNaN(lat) && !isNaN(lon)) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "HospitalityExchange/1.0 (contact@hackcelestial.org)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        });

        if (resp.ok) {
          const data = await resp.json();
          const addr = data.address || {};
          const labelParts = [
            addr.suburb || addr.neighbourhood || addr.quarter || addr.commercial,
            addr.city || addr.town || addr.city_district || addr.county,
            addr.state,
          ].filter(Boolean);

          const formattedAddress =
            labelParts.length > 0 ? labelParts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || "Current Location";

          return NextResponse.json({
            success: true,
            data: {
              address: formattedAddress,
              latitude: lat,
              longitude: lon,
              displayName: data.display_name,
            },
          });
        }
      } catch (err) {
        console.warn("Reverse geocode OSM timeout/error, checking nearby hub:", err);
      }

      // Check if near a known Mumbai hub
      const matchedHub = KNOWN_HUBS.find((h) => {
        const dLat = Math.abs(h.lat - lat);
        const dLon = Math.abs(h.lng - lon);
        return dLat < 0.03 && dLon < 0.03;
      });

      return NextResponse.json({
        success: true,
        data: {
          address: matchedHub ? matchedHub.name : `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          latitude: lat,
          longitude: lon,
        },
      });
    }
  }

  // 2. FORWARD GEOCODING (address -> lat + lon)
  if (!query) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'q' or 'lat'/'lon' required." },
      { status: 400 }
    );
  }

  // Check known hub first for instant resolution
  const instantMatch = findKnownHub(query);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "HospitalityExchange/1.0 (contact@hackcelestial.org)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (resp.ok) {
      const results = (await resp.json()) as { lat: string; lon: string; display_name: string }[];
      if (results.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            address: query,
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
            displayName: results[0].display_name,
            suggestions: results.slice(0, 4).map((r) => ({
              displayName: r.display_name,
              latitude: parseFloat(r.lat),
              longitude: parseFloat(r.lon),
            })),
          },
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim OSM search failed/timeout, falling back:", err);
  }

  // Fallback to known hub
  if (instantMatch) {
    return NextResponse.json({
      success: true,
      data: {
        address: instantMatch.name,
        latitude: instantMatch.lat,
        longitude: instantMatch.lng,
        displayName: instantMatch.name,
      },
    });
  }

  // Default Mumbai center fallback if location query mentions Mumbai/Maharashtra
  if (query.toLowerCase().includes("mumbai") || query.toLowerCase().includes("navi mumbai")) {
    return NextResponse.json({
      success: true,
      data: {
        address: `${query}, Mumbai`,
        latitude: 19.076,
        longitude: 72.8777,
        displayName: `${query}, Mumbai, Maharashtra, India`,
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: "Couldn't find that location. Try specifying an area or city like 'Bandra West' or 'Vashi'.",
    },
    { status: 404 }
  );
}
