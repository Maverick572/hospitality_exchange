import type { LucideIcon } from "lucide-react";
import {
  CameraIcon,
  LayersIcon,
  MessageSquareTextIcon,
  RouteIcon,
  ShieldCheckIcon,
  StoreIcon,
  TruckIcon,
  WarehouseIcon,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Who it's for", href: "#roles" },
  { label: "Examples", href: "#examples" },
];

/** Labels from shared/categories.json, minus the "Other" fallback. */
export const CATEGORIES = [
  "Banquet Seating",
  "Tables",
  "Linen & Textiles",
  "Crockery & Glassware",
  "Cutlery & Flatware",
  "Buffet & Serving Equipment",
  "Cookware & Utensils",
  "Décor & Signage",
  "Lighting & Fixtures",
  "Commercial Cooking Equipment",
  "Refrigeration & Cold Storage",
  "Dishwashing Equipment",
  "Bar & Beverage Equipment",
  "Sound & PA Systems",
  "Visual & Display Technology",
  "Venue & Space",
  "Staging & Structures",
  "Mattresses & Bedding",
  "Raw Ingredients & Supplies",
  "Vehicles & Transport",
];

export const STEPS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Describe it",
    description: "Type the requirement the way you'd say it. Quantities, place, deadline and budget are pulled out for you.",
    icon: MessageSquareTextIcon,
  },
  {
    title: "Get a bundle",
    description: "Providers are ranked on price, distance, stock and timing, and combined when one can't cover it all.",
    icon: LayersIcon,
  },
  {
    title: "Ship on a route",
    description: "A driver already heading your way picks up from each provider and delivers in one run.",
    icon: RouteIcon,
  },
  {
    title: "Release on proof",
    description: "Payment sits in escrow until the condition photos check out on both ends.",
    icon: ShieldCheckIcon,
  },
];

export const PERKS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Earn from idle stock",
    description: "Chairs in storage, a spare fryer, an empty hall on a Tuesday: list it once and rent it out whenever it's free.",
    icon: WarehouseIcon,
  },
  {
    title: "Never short on quantity",
    description: "Need 300 when nobody has 300? Stock from several providers is merged into one booking.",
    icon: LayersIcon,
  },
  {
    title: "Cheaper delivery",
    description: "Loads ride on routes drivers are already running, so you aren't paying for an empty return trip.",
    icon: TruckIcon,
  },
  {
    title: "Paid when it's right",
    description: "Funds are held in escrow and released only after delivery is confirmed.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Condition on record",
    description: "Timestamped photos or video at pickup and drop-off. Powered equipment needs video, so disputes are short.",
    icon: CameraIcon,
  },
  {
    title: "One bill, one plan",
    description: "Several providers and a driver, settled as a single fulfillment with one consolidated price.",
    icon: StoreIcon,
  },
];

export type Role = {
  id: string;
  title: string;
  tagline: string;
  points: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export const ROLES: Role[] = [
  {
    id: "seeker",
    title: "Seekers",
    tagline: "Hotels, caterers, event teams and restaurants that need extra stock for a day or a season.",
    points: [
      "Post a requirement in plain language",
      "Matches ranked against your budget",
      "Multi-provider bundles when stock is thin",
      "Delivery arranged in the same booking",
    ],
    cta: "Find resources",
    href: "/signup",
    featured: true,
  },
  {
    id: "provider",
    title: "Providers",
    tagline: "Businesses with furniture, equipment, space or supplies sitting idle between their own events.",
    points: [
      "List items with your own pricing unit",
      "Set when and how much is available",
      "Accept or decline each booking request",
      "Get paid from escrow after handover",
    ],
    cta: "List your inventory",
    href: "/signup",
  },
  {
    id: "driver",
    title: "Drivers",
    tagline: "Tempo, pickup and truck owners with spare capacity on routes they already drive.",
    points: [
      "Publish your routes and time windows",
      "Set vehicle capacity and your rate",
      "Get deliveries that fit your route",
      "Paid on confirmed drop-off",
    ],
    cta: "Drive with us",
    href: "/driver/signup",
  },
];

export type ExampleRequest = { text: string; tags: string[] };

export const EXAMPLE_REQUESTS: ExampleRequest[] = [
  {
    text: "300 chairs and 20 round tables in Navi Mumbai tomorrow, delivered before 3 PM. Budget ₹25,000.",
    tags: ["Banquet Seating", "Tables", "Before 3 PM"],
  },
  {
    text: "Need a PA system with two wireless mics for a Saturday evening wedding in Thane.",
    tags: ["Sound & PA", "Video evidence"],
  },
  {
    text: "Two commercial fryers for a food festival stall, 3 days, Andheri West.",
    tags: ["Cooking Equipment", "3 days"],
  },
  {
    text: "Looking for 150 sets of white table linen and napkins for Friday brunch.",
    tags: ["Linen & Textiles", "150 units"],
  },
  {
    text: "A 2,000 sq ft banquet space in Powai for a corporate offsite next weekend.",
    tags: ["Venue & Space", "2,000 sq ft"],
  },
  {
    text: "Extra walk-in cold storage for a week — around 500 kg of produce.",
    tags: ["Refrigeration", "500 kg"],
  },
  {
    text: "LED wall and projector for a product launch in BKC, setup by 10 AM.",
    tags: ["Display Tech", "By 10 AM"],
  },
  {
    text: "Chafing dishes and buffet stands for 400 guests, Vashi, this Sunday.",
    tags: ["Buffet Equipment", "400 guests"],
  },
];
