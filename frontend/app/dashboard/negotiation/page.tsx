"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  CameraIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileCheck2Icon,
  HandshakeIcon,
  InfoIcon,
  LayersIcon,
  LockIcon,
  MapPinIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  TruckIcon,
  UploadCloudIcon,
  UserCheckIcon,
  UsersIcon,
  VideoIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSession } from "@/lib/session";
import { usePerspective } from "@/lib/perspective";
import { notificationsApi, requestsApi } from "@/lib/api";
import { resolveBusinessUid } from "@/lib/business-uids";
import { inr } from "@/lib/format";
import categoriesData from "@/lib/categories.json";

// Type definitions from categories.json
export type CategoryDef = {
  id: string;
  label: string;
  evidenceType: "photo" | "video" | "photo_video";
  defaultMetric: string;
  keywords: string[];
};

// Rich operational guidelines for each category
const CATEGORY_GUIDELINES: Record<string, string> = {
  banquet_seating: "Still photo evidence mandatory: Capture stacked lots and close-ups of upholstery, frames, and clean feet without tears or stains.",
  tables: "Still photo evidence mandatory: Capture table top laminate/polish, folding/locking mechanisms, and structural stability.",
  linen_textiles: "Still photo evidence mandatory: Inspect fabric cleanliness, absence of food stains, iron press finish, and folded lot count.",
  crockery_glassware: "Still photo evidence mandatory: Overhead photo of crates verifying zero chipped rims, cracks, or missing pieces.",
  cutlery_flatware: "Still photo evidence mandatory: Count verification and polish finish check in cutlery caddies.",
  buffet_serving: "Still photo evidence mandatory: Inspect chafer frames, food pans, water pans, fuel burners, and roll-top lids.",
  cookware_utensils: "Still photo evidence mandatory: Inspect base flatness, handles, and clean interior surfaces without dents.",
  decor_signage: "Still photo evidence mandatory: Inspect visual fabric, framing, easel stands, and sign legibility.",
  lighting_fixtures: "Still photo evidence mandatory: Inspect lens condition, mounting clamps, cables, and bulb housing.",
  cleaning_housekeeping: "Still photo evidence mandatory: Unit count and clean mechanical condition of trolleys and caddies.",
  guest_amenities: "Still photo evidence mandatory: Sealed packaging verification and inventory count.",
  uniforms_apparel: "Still photo evidence mandatory: Laundered condition, size assortment, and button/zipper integrity.",
  safety_fire: "Still photo evidence mandatory: Pressure gauge needle in green zone and valid inspection tag.",
  storage_shelving: "Still photo evidence mandatory: Bolt integrity, upright frame alignment, and shelf load capacity check.",
  raw_ingredients: "Still photo evidence mandatory: Expiry dates, batch numbers, temperature seal, and packaging integrity.",
  disposables_packaging: "Still photo evidence mandatory: Factory seal on carton lots and piece count verification.",
  mattress_bedding: "Still photo evidence mandatory: High-resolution photos of mattress covers, seams, and absence of stains.",
  cooking_equipment: "Operational video mandatory: Must record burner ignition spark, steady flame, gas valve check, and heat response.",
  refrigeration: "Operational video mandatory: Must record digital temperature display dropping to target chill temp and compressor sound.",
  dishwashing_equipment: "Operational video mandatory: Must record wash cycle pump start, water spray rotation, and drainage cycle.",
  bar_beverage: "Operational video mandatory: Must record espresso pressure gauge pump test or beverage dispenser solenoid valve flow.",
  laundry_equipment: "Operational video mandatory: Must record wash drum rotation, spin cycle acceleration, and motor sound.",
  sound_system: "Operational video mandatory: Must record audio sweep through speakers/subwoofers verifying clean output without distortion.",
  visual_display: "Operational video mandatory: Must record full color/white screen test across all LED panels verifying zero dead pixels.",
  pos_technology: "Operational video mandatory: Must record terminal boot-up, touchscreen responsiveness, and test receipt printout.",
  security_surveillance: "Operational video mandatory: Must record camera feed pan-tilt-zoom motion and live NVR recording signal.",
  fitness_wellness: "Operational video mandatory: Must record motorized belt running, incline actuation, and digital console display.",
  venue_space: "Combined photo + video mandatory: Structural wide photos of floor/walls plus walkthrough video of utilities.",
  staging_structures: "Combined photo + video mandatory: Wide photos of erected truss/platform plus walkthrough video of safety locking pins.",
  vehicle_transport: "Combined photo + video mandatory: 360° exterior photos plus engine start and refrigeration unit operational video.",
  other: "Still photo evidence mandatory: High-resolution photos verifying physical condition and lot count.",
};

const SAMPLE_MEDIA = {
  photo: {
    sender: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    receiver: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  },
  video: {
    sender: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    receiver: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
};

type ChatMessage = {
  id: string;
  sender: "seeker" | "provider" | "system";
  senderName: string;
  type: "request" | "counter" | "accept" | "message" | "dispatch" | "return";
  text: string;
  amount?: number;
  depTime?: string;
  arrTime?: string;
  timestamp: string;
};

type EvidenceItem = {
  id: string;
  stage: "PICKUP" | "DELIVERY";
  mediaType: "photo" | "video";
  url: string;
  description: string;
  timestamp: string;
  uploader: string;
  categoryLabel: string;
};

function extractShortName(text: string | null): string {
  if (!text) return "";
  return text.split(",")[0].trim();
}

function resolveCategory(catParam: string | null, resourceTitle: string): CategoryDef {
  const categories: CategoryDef[] = categoriesData.categories as CategoryDef[];
  if (catParam) {
    const direct = categories.find((c) => c.id.toLowerCase() === catParam.toLowerCase());
    if (direct) return direct;
  }
  const titleLower = resourceTitle.toLowerCase();
  for (const cat of categories) {
    if (cat.keywords.some((kw) => titleLower.includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  const labelMatch = categories.find((c) => titleLower.includes(c.label.toLowerCase()));
  if (labelMatch) return labelMatch;

  return categories.find((c) => c.id === "banquet_seating") || categories[0];
}

function NegotiationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { perspective, togglePerspective } = usePerspective();
  const { profile } = useBusinessSession();

  const currentBusinessName = profile?.businessName || profile?.name || "My Business";

  const rawProvider = searchParams.get("provider");
  const rawSeeker = searchParams.get("seeker");
  const providerNameParam = searchParams.get("providerName");
  const seekerNameParam = searchParams.get("seekerName");

  // Fixed transaction roles: Buyer is the seeker (requester), Seller is the provider (inventory owner)
  // These roles NEVER flip when the viewing perspective is toggled.
  const [userRole] = useState<"seeker" | "provider">(() => {
    const myName = currentBusinessName.toLowerCase();
    const sName = (seekerNameParam || rawSeeker || "").toLowerCase();
    const pName = (providerNameParam || rawProvider || "").toLowerCase();
    if (sName && sName.includes(myName)) return "seeker";
    if (pName && pName.includes(myName)) return "provider";
    return perspective === "provider" ? "provider" : "seeker";
  });
  const isCurrentSeeker = userRole === "seeker";

  const [buyerName] = useState<string>(() => {
    if (seekerNameParam) return seekerNameParam;
    if (rawSeeker) return extractShortName(rawSeeker);
    if (userRole === "seeker") return currentBusinessName;
    return "Trade Buyer";
  });

  const [sellerName] = useState<string>(() => {
    if (providerNameParam) return providerNameParam;
    if (rawProvider) return extractShortName(rawProvider);
    if (userRole === "provider") return currentBusinessName;
    return "Trade Supplier";
  });

  const [resourceTitle, setResourceTitle] = useState(
    searchParams.get("resource") ?? "Hospitality Inventory"
  );
  const initialQty = parseInt(searchParams.get("qty") ?? "1", 10);
  const initialAmount = parseInt(searchParams.get("amount") ?? "0", 10);
  const initDep = searchParams.get("dep") ?? "09:00";
  const initArr = searchParams.get("arr") ?? "10:00";
  const vehicleCount = parseInt(searchParams.get("vehicles") ?? "1", 10);

  // Dynamic category resolution from categories.json
  const initialCatParam = searchParams.get("category");
  const [selectedCatId, setSelectedCatId] = useState<string>(() => {
    return resolveCategory(initialCatParam, resourceTitle).id;
  });

  const categoryDef = (categoriesData.categories as CategoryDef[]).find((c) => c.id === selectedCatId) ||
    resolveCategory(null, resourceTitle);
  const guidanceText = CATEGORY_GUIDELINES[categoryDef.id] || CATEGORY_GUIDELINES.banquet_seating;

  // Negotiation state
  const [status, setStatus] = useState<
    "negotiating" | "accepted" | "in_transit" | "return_pending" | "completed"
  >("negotiating");

  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [departureTime, setDepartureTime] = useState(initDep);
  const [arrivalTime, setArrivalTime] = useState(initArr);
  const [counterPrice, setCounterPrice] = useState(String(initialAmount));
  const [counterDep, setCounterDep] = useState(initDep);
  const [counterArr, setCounterArr] = useState(initArr);
  const [counterNote, setCounterNote] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [inputText, setInputText] = useState("");

  // Sender Pre-transit evidence state (DISPATCH - Uploaded by Seller only)
  const [senderEvidence, setSenderEvidence] = useState<EvidenceItem[]>([]);
  const [senderMediaUrl, setSenderMediaUrl] = useState<string>("");
  const [senderMediaType, setSenderMediaType] = useState<"photo" | "video">(
    categoryDef.evidenceType === "video" ? "video" : "photo"
  );
  const [senderNotes, setSenderNotes] = useState("");

  // Receiver Return evidence state (RETURN - Uploaded by Buyer only)
  const [receiverEvidence, setReceiverEvidence] = useState<EvidenceItem[]>([]);
  const [receiverMediaUrl, setReceiverMediaUrl] = useState<string>("");
  const [receiverMediaType, setReceiverMediaType] = useState<"photo" | "video">(
    categoryDef.evidenceType === "video" ? "video" : "photo"
  );
  const [receiverNotes, setReceiverNotes] = useState("");
  const [conditionConfirmed, setConditionConfirmed] = useState(false);

  // Keep media type in sync when category changes
  useEffect(() => {
    if (categoryDef.evidenceType === "video") {
      setSenderMediaType("video");
      setReceiverMediaType("video");
    } else if (categoryDef.evidenceType === "photo") {
      setSenderMediaType("photo");
      setReceiverMediaType("photo");
    }
  }, [categoryDef.evidenceType]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reqIdParam = searchParams.get("requestId");
  const [activeReqId] = useState(() => reqIdParam || `req_${Date.now()}`);
  const hasNotifiedInitialRef = useRef(false);
  const CHAT_SYNC_KEY = `hrex_chat_sync_${activeReqId}`;

  // Initial chat stream: Sender names are fixed to the trade parties and never flip
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg-1",
      sender: "seeker",
      senderName: `${buyerName} (Buyer)`,
      type: "request",
      text: `Proposal submitted for ${resourceTitle} (${initialQty} unit${initialQty > 1 ? "s" : ""}). Terms: ${initialAmount > 0 ? inr(initialAmount) : "Standard rate"}${initDep && initArr ? ` • Scheduled window: ${initDep} → ${initArr}` : ""}. Inspection protocol: ${categoryDef.label} (${categoryDef.evidenceType.toUpperCase()}).`,
      amount: initialAmount,
      depTime: initDep,
      arrTime: initArr,
      timestamp: "09:00 AM",
    },
    {
      id: "msg-2",
      sender: "provider",
      senderName: `${sellerName} (Seller)`,
      type: "message",
      text: `Inquiry acknowledged for ${resourceTitle}. Loading bay and inventory check initiated at ${sellerName}. Ready to coordinate delivery schedule and condition verification.`,
      timestamp: "09:05 AM",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Broadcast and local storage sync helper for zero-latency multi-tab sync
  const broadcastSync = (state: {
    messages?: ChatMessage[];
    amount?: number;
    depTime?: string;
    arrTime?: string;
    status?: "negotiating" | "accepted" | "in_transit" | "return_pending" | "completed";
    senderEvidence?: EvidenceItem[];
    receiverEvidence?: EvidenceItem[];
    category?: string;
  }) => {
    const payload = {
      activeReqId,
      messages: state.messages ?? messages,
      amount: state.amount ?? currentAmount,
      depTime: state.depTime ?? departureTime,
      arrTime: state.arrTime ?? arrivalTime,
      status: state.status ?? status,
      senderEvidence: state.senderEvidence ?? senderEvidence,
      receiverEvidence: state.receiverEvidence ?? receiverEvidence,
      category: state.category ?? selectedCatId,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(CHAT_SYNC_KEY, JSON.stringify(payload));
      localStorage.setItem("hrex_chat_sync_latest", JSON.stringify(payload));
    } catch {}
    try {
      const bc = new BroadcastChannel("hrex_chat_channel");
      bc.postMessage(payload);
      bc.close();
    } catch {}
  };

  // Restore saved messages on mount and listen for real-time broadcasts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_SYNC_KEY) || localStorage.getItem("hrex_chat_sync_latest");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }
        if (parsed.amount) setCurrentAmount(parsed.amount);
        if (parsed.depTime) setDepartureTime(parsed.depTime);
        if (parsed.arrTime) setArrivalTime(parsed.arrTime);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.senderEvidence) setSenderEvidence(parsed.senderEvidence);
        if (parsed.receiverEvidence) setReceiverEvidence(parsed.receiverEvidence);
        if (parsed.category) setSelectedCatId(parsed.category);
      }
    } catch {}

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("hrex_chat_channel");
      channel.onmessage = (event) => {
        const data = event.data;
        if (data && data.reset) {
          setStatus("negotiating");
          setCurrentAmount(initialAmount);
          setDepartureTime(initDep);
          setArrivalTime(initArr);
          setCounterPrice(String(initialAmount));
          setShowCounterForm(false);
          setSenderEvidence([]);
          setSenderMediaUrl("");
          setSenderNotes("");
          setReceiverEvidence([]);
          setReceiverMediaUrl("");
          setReceiverNotes("");
          setConditionConfirmed(false);
          setMessages([
            {
              id: "msg-1",
              sender: "seeker",
              senderName: `${buyerName} (Buyer)`,
              type: "request",
              text: `Proposal submitted: Renting ${initialQty} units. Scheduled transport: Departure ${initDep} → Arrival ${initArr} via ${vehicleCount} pooled vehicles. Category protocol: [${categoryDef.label}] requires ${categoryDef.evidenceType.toUpperCase()} evidence.`,
              amount: initialAmount,
              depTime: initDep,
              arrTime: initArr,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              id: "msg-2",
              sender: "provider",
              senderName: `${sellerName} (Seller)`,
              type: "message",
              text: `Hello! We reviewed your demand for ${initialQty} units (${categoryDef.label}). Loading bay at ${sellerName} is reserved for the pooled convoy. Pre-transit inspection ready.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          return;
        }
        if (data && (data.activeReqId === activeReqId || !data.activeReqId)) {
          if (data.messages) setMessages(data.messages);
          if (data.amount !== undefined) setCurrentAmount(data.amount);
          if (data.depTime) setDepartureTime(data.depTime);
          if (data.arrTime) setArrivalTime(data.arrTime);
          if (data.status) setStatus(data.status);
          if (data.senderEvidence) setSenderEvidence(data.senderEvidence);
          if (data.receiverEvidence) setReceiverEvidence(data.receiverEvidence);
          if (data.category) setSelectedCatId(data.category);
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === CHAT_SYNC_KEY || e.key === "hrex_chat_sync_latest") && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.reset) {
            setStatus("negotiating");
            setCurrentAmount(initialAmount);
            setDepartureTime(initDep);
            setArrivalTime(initArr);
            setCounterPrice(String(initialAmount));
            setSenderEvidence([]);
            setReceiverEvidence([]);
            return;
          }
          if (data.messages) setMessages(data.messages);
          if (data.amount !== undefined) setCurrentAmount(data.amount);
          if (data.depTime) setDepartureTime(data.depTime);
          if (data.arrTime) setArrivalTime(data.arrTime);
          if (data.status) setStatus(data.status);
          if (data.senderEvidence) setSenderEvidence(data.senderEvidence);
          if (data.receiverEvidence) setReceiverEvidence(data.receiverEvidence);
          if (data.category) setSelectedCatId(data.category);
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);

    // Periodically poll backend if activeReqId exists
    const pollTimer = window.setInterval(async () => {
      if (!activeReqId) return;
      try {
        const res = await requestsApi.getById(activeReqId);
        if (res && res.messages && Array.isArray(res.messages) && res.messages.length > 0) {
          setMessages((current) => {
            if (res.messages!.length > current.length) {
              return res.messages!.map((m: any, idx: number) => ({
                id: m.id || `msg-be-${idx}`,
                sender: m.senderId === resolveBusinessUid(buyerName) ? "seeker" : "provider",
                senderName: m.senderName || (m.senderId === resolveBusinessUid(buyerName) ? buyerName : sellerName),
                type: m.type || "message",
                text: m.content || m.message || "",
                amount: m.amount,
                depTime: m.departureTime,
                arrTime: m.arrivalTime,
                timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
              }));
            }
            return current;
          });
        }
      } catch {}
    }, 4000);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(pollTimer);
    };
  }, [activeReqId, buyerName, sellerName, CHAT_SYNC_KEY]);

  // Initial notification to counterpart
  useEffect(() => {
    if (isCurrentSeeker && !hasNotifiedInitialRef.current && !reqIdParam) {
      hasNotifiedInitialRef.current = true;
      const sellerUid = resolveBusinessUid(sellerName);
      void notificationsApi.create({
        userId: sellerUid,
        type: "REQUEST_RECEIVED",
        title: `New Booking Proposal from ${buyerName}`,
        message: `Proposal submitted for ${initialQty} units (${categoryDef.label}). Review commercial terms.`,
        referenceId: activeReqId,
      }).catch(() => undefined);
    }
  }, [isCurrentSeeker, sellerName, buyerName, initialQty, activeReqId, reqIdParam, categoryDef.label]);

  // Handle counter offer submission
  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(counterPrice);
    if (!priceNum || priceNum <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const myRole = userRole;
    const senderName = myRole === "seeker"
      ? `${buyerName} (Buyer)`
      : `${sellerName} (Seller)`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: myRole,
      senderName,
      type: "counter",
      text: counterNote.trim() || `Counter-proposal: ₹${priceNum.toLocaleString("en-IN")} with departure at ${counterDep} and arrival at ${counterArr}.`,
      amount: priceNum,
      depTime: counterDep,
      arrTime: counterArr,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setCurrentAmount(priceNum);
    setDepartureTime(counterDep);
    setArrivalTime(counterArr);
    setShowCounterForm(false);
    setCounterNote("");
    toast.success("Counter-offer proposed!");

    broadcastSync({
      messages: updated,
      amount: priceNum,
      depTime: counterDep,
      arrTime: counterArr,
    });

    const counterpartUid = myRole === "seeker" ? resolveBusinessUid(sellerName) : resolveBusinessUid(buyerName);
    void notificationsApi.create({
      userId: counterpartUid,
      type: "REQUEST_COUNTERED",
      title: `Counter-Offer from ${senderName}`,
      message: `Counter-proposal: ₹${priceNum.toLocaleString("en-IN")} (Departure ${counterDep} → Arrival ${counterArr}). ${counterNote}`.trim(),
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // Send simple chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const myRole = userRole;
    const senderName = myRole === "seeker"
      ? `${buyerName} (Buyer)`
      : `${sellerName} (Seller)`;
    const messageContent = inputText.trim();

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: myRole,
      senderName,
      type: "message",
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText("");

    broadcastSync({ messages: updated });

    const counterpartUid = myRole === "seeker" ? resolveBusinessUid(sellerName) : resolveBusinessUid(buyerName);
    void notificationsApi.create({
      userId: counterpartUid,
      type: "NEGOTIATION_MESSAGE",
      title: `Message from ${senderName}`,
      message: messageContent,
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // Accept offer and proceed to pre-transit export evidence
  const handleAcceptOffer = () => {
    const myRole = userRole;
    const accepterName = myRole === "seeker"
      ? `${buyerName} (Buyer)`
      : `${sellerName} (Seller)`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: myRole,
      senderName: accepterName,
      type: "accept",
      text: `Terms officially finalized at ₹${currentAmount.toLocaleString("en-IN")}. Transit window locked: Departure ${departureTime} → Arrival ${arrivalTime}. Next step: Sender pre-transit condition verification by ${sellerName}.`,
      amount: currentAmount,
      depTime: departureTime,
      arrTime: arrivalTime,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setStatus("accepted");
    toast.success("Offer accepted! Sender handover verification unlocked.", { icon: "✅" });

    broadcastSync({ messages: updated, status: "accepted" });

    const counterpartUid = userRole === "seeker" ? resolveBusinessUid(sellerName) : resolveBusinessUid(buyerName);
    void notificationsApi.create({
      userId: counterpartUid,
      type: "REQUEST_ACCEPTED",
      title: `Agreement Finalized with ${accepterName}!`,
      message: `Offer accepted at ₹${currentAmount.toLocaleString("en-IN")}. Pre-transit handover unlocked.`,
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // File upload handler (converts local file to preview data URL with category check)
  const handleFileChange = (file: File | undefined, isSender: boolean) => {
    if (!file) return;

    if (categoryDef.evidenceType === "photo" && !file.type.startsWith("image/")) {
      toast.error(`Category '${categoryDef.label}' strictly mandates photo evidence. Video files are rejected.`);
      return;
    }
    if (categoryDef.evidenceType === "video" && !file.type.startsWith("video/")) {
      toast.error(`Category '${categoryDef.label}' strictly mandates operational video evidence. Still photos are rejected.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (isSender) {
        setSenderMediaUrl(dataUrl);
        setSenderMediaType(file.type.startsWith("video/") ? "video" : "photo");
      } else {
        setReceiverMediaUrl(dataUrl);
        setReceiverMediaType(file.type.startsWith("video/") ? "video" : "photo");
      }
      toast.success(`${file.name} loaded as inspection media.`);
    };
    reader.readAsDataURL(file);
  };

  // 1. SENDER DISPATCH: Uploaded ONLY by Sender (Seller / Provider) during dispatch
  const handleSenderDispatch = () => {
    if (isCurrentSeeker) {
      toast.error(`Only the Sender (${sellerName}) can upload pre-transit dispatch evidence.`);
      return;
    }

    if (!senderMediaUrl) {
      toast.error(`Mandatory ${categoryDef.evidenceType.toUpperCase()} evidence must be attached before dispatch.`);
      return;
    }

    if (categoryDef.evidenceType === "photo" && senderMediaType !== "photo") {
      toast.error(`Category '${categoryDef.label}' strictly mandates still photo evidence.`);
      return;
    }

    if (categoryDef.evidenceType === "video" && senderMediaType !== "video") {
      toast.error(`Category '${categoryDef.label}' strictly mandates operational video evidence.`);
      return;
    }

    const item: EvidenceItem = {
      id: `ev-disp-${Date.now()}`,
      stage: "PICKUP",
      mediaType: senderMediaType,
      url: senderMediaUrl,
      description: senderNotes.trim() || `All ${initialQty} units inspected at loading bay. Category [${categoryDef.label}] requirements met.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      uploader: `${sellerName} Dispatch Lead (Sender)`,
      categoryLabel: categoryDef.label,
    };

    setSenderEvidence([item]);

    const dispatchMsg: ChatMessage = {
      id: `msg-disp-${Date.now()}`,
      sender: "provider",
      senderName: `${sellerName} (Seller)`,
      type: "dispatch",
      text: `SENDER DISPATCH VERIFIED: Pre-transit ${categoryDef.evidenceType.toUpperCase()} evidence recorded by ${sellerName} for category [${categoryDef.label}]. Transport departed loading bay at ${departureTime}. En route to ${buyerName}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, dispatchMsg];
    setMessages(updated);
    setStatus("in_transit");
    toast.success("Sender condition evidence recorded! Convoy dispatched in-transit.", { icon: "🚚" });

    broadcastSync({ messages: updated, status: "in_transit", senderEvidence: [item] });

    const buyerUid = resolveBusinessUid(buyerName);
    void notificationsApi.create({
      userId: buyerUid,
      type: "DELIVERY_DISPATCHED",
      title: `Goods Dispatched from ${sellerName}!`,
      message: `Sender condition verified. ${vehicleCount}-truck convoy departed loading bay at ${departureTime}.`,
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // Simulate arrival at destination
  const handleSimulateArrival = () => {
    setStatus("return_pending");
    toast.info("Rental period active. Goods delivered and in-use. Return phase initiated.");

    broadcastSync({ status: "return_pending" });

    const sellerUid = resolveBusinessUid(sellerName);
    void notificationsApi.create({
      userId: sellerUid,
      type: "DELIVERY_ARRIVED",
      title: `Shipment Arrived at ${buyerName}!`,
      message: `Goods arrived safely at destination venue. Rental period actively in progress.`,
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // 2. RECEIVER RETURN: Uploaded ONLY by Receiver (Buyer / Seeker) during return
  const handleReceiverReturn = () => {
    if (!isCurrentSeeker) {
      toast.error(`Only the Receiver (${buyerName}) can upload return condition evidence.`);
      return;
    }

    if (!receiverMediaUrl) {
      toast.error(`Mandatory ${categoryDef.evidenceType.toUpperCase()} return evidence must be attached.`);
      return;
    }

    if (categoryDef.evidenceType === "photo" && receiverMediaType !== "photo") {
      toast.error(`Category '${categoryDef.label}' strictly mandates return photo evidence.`);
      return;
    }

    if (categoryDef.evidenceType === "video" && receiverMediaType !== "video") {
      toast.error(`Category '${categoryDef.label}' strictly mandates return operational video evidence.`);
      return;
    }

    if (!conditionConfirmed) {
      toast.error("Please confirm that all items are in undamaged condition.");
      return;
    }

    const item: EvidenceItem = {
      id: `ev-ret-${Date.now()}`,
      stage: "DELIVERY",
      mediaType: receiverMediaType,
      url: receiverMediaUrl,
      description: receiverNotes.trim() || `All ${initialQty} units accounted for. Zero damage observed upon check-in. Category [${categoryDef.label}] return verified.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      uploader: `${buyerName} Receiving Lead (Receiver)`,
      categoryLabel: categoryDef.label,
    };

    setReceiverEvidence([item]);

    const returnMsg: ChatMessage = {
      id: `msg-ret-${Date.now()}`,
      sender: "seeker",
      senderName: `${buyerName} (Buyer)`,
      type: "return",
      text: `RECEIVER RETURN VERIFIED: Return ${categoryDef.evidenceType.toUpperCase()} evidence submitted by ${buyerName} and matched against initial dispatch baseline. All ${initialQty} units of [${categoryDef.label}] returned undamaged to ${sellerName}. Escrow deposit released.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, returnMsg];
    setMessages(updated);
    setStatus("completed");
    toast.success("Return condition verified! Escrow deposit refunded & transaction completed.", { icon: "🎉" });

    broadcastSync({ messages: updated, status: "completed", receiverEvidence: [item] });

    const sellerUid = resolveBusinessUid(sellerName);
    void notificationsApi.create({
      userId: sellerUid,
      type: "RETURN_COMPLETED",
      title: `Return Verified & Escrow Released!`,
      message: `${buyerName} completed return condition inspection. All items accounted for and undamaged.`,
      referenceId: activeReqId,
    }).catch(() => undefined);
  };

  // Helper to change category and test dynamic adaptation
  const handleCategoryChange = (newCatId: string) => {
    setSelectedCatId(newCatId);
    const cat = (categoriesData.categories as CategoryDef[]).find((c) => c.id === newCatId);
    if (!cat) return;

    if (cat.evidenceType === "video") {
      setSenderMediaType("video");
      setReceiverMediaType("video");
      setSenderMediaUrl(SAMPLE_MEDIA.video.sender);
      setReceiverMediaUrl(SAMPLE_MEDIA.video.receiver);
    } else {
      setSenderMediaType("photo");
      setReceiverMediaType("photo");
      setSenderMediaUrl(SAMPLE_MEDIA.photo.sender);
      setReceiverMediaUrl(SAMPLE_MEDIA.photo.receiver);
    }

    toast.info(`Category set to '${cat.label}'. Evidence rule: ${cat.evidenceType.toUpperCase()}`);
    broadcastSync({ category: newCatId });
  };

  // Completely wipe conversation history and start fresh
  const handleResetNegotiation = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("hrex_chat_sync_") || key === "hrex_chat_sync_latest")) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    try {
      const bc = new BroadcastChannel("hrex_chat_channel");
      bc.postMessage({ reset: true, timestamp: Date.now() });
      bc.close();
    } catch {}

    setStatus("negotiating");
    setCurrentAmount(initialAmount);
    setDepartureTime(initDep);
    setArrivalTime(initArr);
    setCounterPrice(String(initialAmount));
    setShowCounterForm(false);
    setCounterNote("");
    setInputText("");
    setSenderEvidence([]);
    setSenderMediaUrl("");
    setSenderNotes("");
    setReceiverEvidence([]);
    setReceiverMediaUrl("");
    setReceiverNotes("");
    setConditionConfirmed(false);
    setMessages([
      {
        id: "msg-1",
        sender: "seeker",
        senderName: `${buyerName} (Buyer)`,
        type: "request",
        text: `Proposal submitted for ${resourceTitle} (${initialQty} unit${initialQty > 1 ? "s" : ""}). Terms: ${initialAmount > 0 ? inr(initialAmount) : "Standard rate"}${initDep && initArr ? ` • Scheduled window: ${initDep} → ${initArr}` : ""}. Category protocol: [${categoryDef.label}] requires ${categoryDef.evidenceType.toUpperCase()} evidence.`,
        amount: initialAmount,
        depTime: initDep,
        arrTime: initArr,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: "msg-2",
        sender: "provider",
        senderName: `${sellerName} (Seller)`,
        type: "message",
        text: `Inquiry acknowledged for ${resourceTitle}. Loading bay at ${sellerName} is reserved. Pre-transit inspection ready.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    toast.success("Conversations and negotiation history reset cleanly.", { icon: "🧹" });
  };

  return (
    <Page>
      <div className="space-y-6 pb-16">
        
        {/* Navigation Breadcrumb & Operational Role Switcher Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/dashboard/logistics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to Multi-Carrier Logistics
          </Link>

          {/* Interactive Role Switcher Pill for Two-Party Simulation */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Contract Role:</span>
              <strong className="text-foreground font-bold">
                {currentBusinessName} ({isCurrentSeeker ? "Buyer / Requester" : "Seller / Provider"})
              </strong>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline" className="text-xs py-0.5 px-2 font-semibold border-primary/30 text-primary">
              {isCurrentSeeker ? "Buyer Perspective" : "Seller Perspective"}
            </Badge>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetNegotiation}
              className="text-xs h-7 px-2 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1"
              title="Clear all chat messages and reset to clean proposal"
            >
              <RotateCcwIcon className="size-3" />
              <span>Reset & Start Over</span>
            </Button>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card/90 to-primary/5 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
                <HandshakeIcon className="size-3.5" />
                <span>B2B NEGOTIATION & CATEGORY-DRIVEN HANDOVER PROTOCOL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Offer Negotiation & Two-Party Condition Verification
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Negotiate terms in real-time. Sender uploads pre-transit evidence at dispatch; Receiver uploads return evidence at check-in. Evidence format is strictly dictated by the product category.
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex flex-col items-start md:items-end gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Lifecycle Phase:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                  status === "negotiating"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : status === "accepted"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : status === "in_transit"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                    : status === "return_pending"
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                {status === "negotiating" && <ClockIcon className="size-3.5 animate-pulse" />}
                {status === "accepted" && <FileCheck2Icon className="size-3.5" />}
                {status === "in_transit" && <TruckIcon className="size-3.5 animate-bounce" />}
                {status === "return_pending" && <ShieldAlertIcon className="size-3.5" />}
                {status === "completed" && <CheckCircle2Icon className="size-3.5" />}
                <span>
                  {status === "negotiating" && "Terms Under Negotiation"}
                  {status === "accepted" && "Offer Accepted · Sender Dispatch Verification"}
                  {status === "in_transit" && "Dispatched & In-Transit"}
                  {status === "return_pending" && "Return Verification Pending"}
                  {status === "completed" && "Completed · Escrow Released"}
                </span>
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Deal Metadata & Interactive Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Resource Lot</span>
              <strong className="text-foreground text-sm font-bold block truncate">{resourceTitle}</strong>
              <span className="text-[11px] text-muted-foreground">{initialQty} Units · Pooled Fleet</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Agreed Rate</span>
              <strong className="text-primary text-base font-extrabold block">
                ₹{currentAmount.toLocaleString("en-IN")}
              </strong>
              <span className="text-[11px] text-muted-foreground">Co-loaded Route Included</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Transit Window (OSRM)</span>
              <strong className="text-foreground text-sm font-bold block">
                {departureTime} → {arrivalTime}
              </strong>
              <span className="text-[11px] text-muted-foreground">27 mins · 8.9 km Bandra-BKC</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Active Category & Evidence Rule</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <select
                  value={selectedCatId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="bg-background border border-border rounded text-xs font-bold text-foreground py-0.5 px-2 focus:ring-1 focus:ring-primary"
                >
                  <optgroup label="Physical Goods (Photo Evidence)">
                    <option value="banquet_seating">Banquet Seating</option>
                    <option value="tables">Tables & Desks</option>
                    <option value="linen_textiles">Linen & Textiles</option>
                    <option value="crockery_glassware">Crockery & Glassware</option>
                    <option value="cutlery_flatware">Cutlery & Flatware</option>
                    <option value="buffet_serving">Buffet & Serving</option>
                    <option value="cookware_utensils">Cookware & Utensils</option>
                  </optgroup>
                  <optgroup label="Powered Machinery / Tech (Video Evidence)">
                    <option value="cooking_equipment">Commercial Cooking Equipment</option>
                    <option value="refrigeration">Refrigeration & Cold Storage</option>
                    <option value="dishwashing_equipment">Dishwashing Equipment</option>
                    <option value="sound_system">Sound & PA Systems</option>
                    <option value="visual_display">Visual & Display Technology</option>
                    <option value="bar_beverage">Bar & Beverage Equipment</option>
                  </optgroup>
                  <optgroup label="Structural / Transport (Photo + Video)">
                    <option value="staging_structures">Staging & Structures</option>
                    <option value="venue_space">Venue & Space</option>
                    <option value="vehicle_transport">Vehicles & Transport</option>
                  </optgroup>
                </select>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] mt-1 uppercase font-bold ${
                  categoryDef.evidenceType === "video"
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                    : categoryDef.evidenceType === "photo_video"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                }`}
              >
                {categoryDef.evidenceType === "photo" && "📸 Still Photo Required"}
                {categoryDef.evidenceType === "video" && "🎥 Operational Video Required"}
                {categoryDef.evidenceType === "photo_video" && "📸 Photo + 🎥 Video Required"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Grid: Chat Stream on Left, Two-Party Evidence Center on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT: Negotiation Chat Thread (7 cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="flex flex-col h-[620px] rounded-2xl border border-border shadow-xs overflow-hidden bg-card">
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Direct Trade Negotiation Room</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {sellerName} (Sender / Loading Bay) ↔ {buyerName} (Receiver / Destination)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Live Sync</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetNegotiation}
                    className="text-[11px] h-7 px-2 font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1"
                    title="Clear all chat history and start over"
                  >
                    <RotateCcwIcon className="size-3" />
                    <span>Reset Chat</span>
                  </Button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/50">
                {messages.map((msg) => {
                  const isMyMessage = msg.sender === userRole;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMyMessage ? "items-end" : "items-start"
                      } space-y-1 max-w-[85%] sm:max-w-[78%] ${isMyMessage ? "ml-auto" : "mr-auto"}`}
                    >
                      <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{msg.senderName}</span>
                        {isMyMessage && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">You</span>
                        )}
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                          isMyMessage
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-card border border-border text-foreground rounded-tl-xs"
                        }`}
                      >
                        {/* Offer Tag */}
                        {msg.type !== "message" && (
                          <div className="mb-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isMyMessage
                                  ? "bg-white/20 text-white"
                                  : msg.type === "counter"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                  : msg.type === "accept"
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : msg.type === "dispatch"
                                  ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                                  : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {msg.type === "request" && "Initial Proposal"}
                              {msg.type === "counter" && "Counter Proposal"}
                              {msg.type === "accept" && "Offer Officially Accepted"}
                              {msg.type === "dispatch" && "Pre-Transit Evidence Signed"}
                              {msg.type === "return" && "Return Verification Completed"}
                            </span>
                          </div>
                        )}

                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Amount & Time Details */}
                        {msg.amount !== undefined && (
                          <div
                            className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-4 text-xs ${
                              isMyMessage ? "border-white/20" : "border-border"
                            }`}
                          >
                            <span>Proposed Commercial Rate:</span>
                            <span className="font-extrabold text-sm">₹{msg.amount.toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {msg.depTime && msg.arrTime && (
                          <div
                            className={`mt-1 flex items-center justify-between gap-2 text-[11px] ${
                              isMyMessage ? "text-white/80" : "text-muted-foreground"
                            }`}
                          >
                            <span>Transit Window:</span>
                            <span className="font-medium">
                              Dep {msg.depTime} → Arr {msg.arrTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    placeholder={`Type a message to ${isCurrentSeeker ? sellerName : buyerName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 gap-1.5 font-bold">
                    <span>Send</span>
                    <SendIcon className="size-3.5" />
                  </Button>
                </form>
              </div>
            </Card>

            {/* Negotiation Action Toolbar */}
            {status === "negotiating" && (
              <Card className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground">Current Active Proposal</h4>
                    <p className="text-[11px] text-muted-foreground">
                      ₹{currentAmount.toLocaleString("en-IN")} · Dep: {departureTime} · Arr: {arrivalTime} · [{categoryDef.label}]
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => toast.info("Proposal declined. You can propose counter terms.")}
                    >
                      <XIcon className="size-3 mr-1" />
                      Decline
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 font-semibold"
                      onClick={() => setShowCounterForm(!showCounterForm)}
                    >
                      <MessageSquareIcon className="size-3 mr-1" />
                      Counter Offer
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs h-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleAcceptOffer}
                    >
                      <HandshakeIcon className="size-3.5 mr-1" />
                      Accept Offer ({inr(currentAmount)})
                    </Button>
                  </div>
                </div>

                {/* Counter Offer Form */}
                {showCounterForm && (
                  <form onSubmit={handleSendCounter} className="pt-3 border-t border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Revised Price (₹)
                        </label>
                        <Input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          className="h-8 text-xs font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Departure Time
                        </label>
                        <Input
                          type="time"
                          value={counterDep}
                          onChange={(e) => setCounterDep(e.target.value)}
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Arrival Time
                        </label>
                        <Input
                          type="time"
                          value={counterArr}
                          onChange={(e) => setCounterArr(e.target.value)}
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Commercial Remarks
                      </label>
                      <Input
                        placeholder="e.g. Can do ₹4,000 if loading begins promptly at 08:00 AM."
                        value={counterNote}
                        onChange={(e) => setCounterNote(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setShowCounterForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="h-8 text-xs font-bold">
                        Submit Counter Proposal
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            )}
          </div>

          {/* ── RIGHT: Role-Segregated Category Evidence Center (5 cols) ── */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Category Protocol Explainer Card */}
            <Card className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-primary" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-primary">
                    Category Evidence Rule: {categoryDef.label}
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-black uppercase ${
                    categoryDef.evidenceType === "video"
                      ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {categoryDef.evidenceType.toUpperCase()} ONLY
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{guidanceText}</p>
              <div className="pt-1.5 border-t border-primary/10 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">1. Pre-Transit Dispatch Evidence:</span>
                  <strong className="text-foreground">Uploaded by Sender ({sellerName})</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">2. Return Check-in Evidence:</span>
                  <strong className="text-foreground">Uploaded by Receiver ({buyerName})</strong>
                </div>
              </div>
            </Card>

            {/* ── Phase 1: Sender Pre-Transit Handover Verification (Export) ── */}
            <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CameraIcon className="size-3.5 text-primary" />
                    <span>Stage 1: Sender Dispatch Handover ({sellerName})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Before convoy departs, Sender ({sellerName}) must log pre-transit {categoryDef.evidenceType.toUpperCase()} evidence.
                  </p>
                </div>
                <Badge
                  variant={senderEvidence.length > 0 ? "default" : "outline"}
                  className="text-[10px] font-bold"
                >
                  {senderEvidence.length > 0 ? "Evidence Logged" : "Pending Dispatch"}
                </Badge>
              </div>

              {senderEvidence.length > 0 ? (
                /* Verified Sender Evidence Display */
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheckIcon className="size-4" />
                      <span>Loading Bay Dispatch Evidence Logged</span>
                    </span>
                    <span className="text-[11px] font-medium">{senderEvidence[0].timestamp}</span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/20 bg-muted">
                    {senderEvidence[0].mediaType === "video" ? (
                      <video src={senderEvidence[0].url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={senderEvidence[0].url} alt="Dispatch proof" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      SENDER PRE-TRANSIT PROOF ({senderEvidence[0].mediaType.toUpperCase()})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Uploader: <strong>{senderEvidence[0].uploader}</strong></span>
                    <span>Category: <strong>{senderEvidence[0].categoryLabel}</strong></span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{senderEvidence[0].description}"</p>
                </div>
              ) : (
                /* Sender Upload Form / Role Restriction */
                <div className="space-y-3 pt-1">
                  {status === "negotiating" ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                      <LockIcon className="size-5 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Handover evidence unlocks once offer is officially accepted.
                      </p>
                    </div>
                  ) : isCurrentSeeker ? (
                    /* Receiver is viewing: cannot upload sender evidence */
                    <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-2.5">
                      <div className="size-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <ClockIcon className="size-4 animate-spin" />
                      </div>
                      <h5 className="text-xs font-bold text-foreground">
                        Awaiting Sender Pre-Transit Evidence ({sellerName})
                      </h5>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        As the Receiver ({buyerName}), you cannot upload dispatch proof. 
                        {sellerName} (Sender) must record and sign mandatory {categoryDef.evidenceType.toUpperCase()} evidence at their loading bay prior to departure.
                      </p>
                      <div className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                          onClick={togglePerspective}
                        >
                          Switch to Sender ({sellerName}) View to Upload
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Sender (Seller) is viewing: Active Upload Controls */
                    <div className="space-y-3">
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary flex items-start gap-2">
                        <InfoIcon className="size-4 shrink-0 mt-0.5" />
                        <span>
                          You are logged in as the <strong>Sender ({sellerName})</strong>. Category <strong>{categoryDef.label}</strong> strictly mandates <strong>{categoryDef.evidenceType.toUpperCase()}</strong> evidence.
                        </span>
                      </div>

                      {/* File Upload / Camera Input */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Upload {categoryDef.evidenceType === "video" ? "Operational Video" : "Inspection Photo"}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="file"
                            accept={categoryDef.evidenceType === "video" ? "video/*" : "image/*"}
                            onChange={(e) => handleFileChange(e.target.files?.[0], true)}
                            className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-8 whitespace-nowrap font-semibold"
                            onClick={() => {
                              const sampleUrl = categoryDef.evidenceType === "video"
                                ? SAMPLE_MEDIA.video.sender
                                : SAMPLE_MEDIA.photo.sender;
                              setSenderMediaUrl(sampleUrl);
                              setSenderMediaType(categoryDef.evidenceType === "video" ? "video" : "photo");
                              toast.success(`Loaded sample ${categoryDef.evidenceType.toUpperCase()} inspection media.`);
                            }}
                          >
                            Load Sample {categoryDef.evidenceType === "video" ? "Video" : "Photo"}
                          </Button>
                        </div>
                      </div>

                      {/* Direct URL input fallback */}
                      <div>
                        <Input
                          placeholder={`Enter ${categoryDef.evidenceType.toUpperCase()} URL...`}
                          value={senderMediaUrl}
                          onChange={(e) => setSenderMediaUrl(e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>

                      {senderMediaUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          {senderMediaType === "video" ? (
                            <video src={senderMediaUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={senderMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {senderMediaType.toUpperCase()} Preview Ready
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Loading Bay Dispatch Notes
                        </label>
                        <Textarea
                          placeholder={`e.g. All ${initialQty} units of ${categoryDef.label} inspected at ${sellerName} loading bay. Compliant with condition standards.`}
                          value={senderNotes}
                          onChange={(e) => setSenderNotes(e.target.value)}
                          className="text-xs min-h-[55px]"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleSenderDispatch}
                        className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                      >
                        <UploadCloudIcon className="size-3.5" />
                        <span>Sign & Dispatch Convoy ({vehicleCount} Vehicles)</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* In-Transit Telemetry Card */}
            {status === "in_transit" && (
              <Card className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <TruckIcon className="size-4 animate-bounce" />
                    <span>Convoy Active in Transit</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">ETA {arrivalTime}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  3 coordinated vehicles (Eicher Pro, Tata 407, Bolero Maxi) en route along Bandra-BKC corridor.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-bold border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40"
                  onClick={handleSimulateArrival}
                >
                  Simulate Delivery & Initiate Return Phase
                </Button>
              </Card>
            )}

            {/* ── Phase 2: Receiver Mandatory Return Handover (Check-In) ── */}
            <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <FileCheck2Icon className="size-3.5 text-emerald-600" />
                    <span>Stage 2: Receiver Return Handover ({buyerName})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Receiver ({buyerName}) must upload return {categoryDef.evidenceType.toUpperCase()} evidence to certify condition and trigger escrow refund.
                  </p>
                </div>
                <Badge
                  variant={receiverEvidence.length > 0 ? "default" : "outline"}
                  className="text-[10px] font-bold"
                >
                  {receiverEvidence.length > 0 ? "Return Verified" : "Pending Return"}
                </Badge>
              </div>

              {receiverEvidence.length > 0 ? (
                /* Completed Return & Escrow Release Box */
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2Icon className="size-4 text-emerald-600" />
                    <span>Return Condition Confirmed · Escrow Released</span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30 bg-muted">
                    {receiverEvidence[0].mediaType === "video" ? (
                      <video src={receiverEvidence[0].url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={receiverEvidence[0].url} alt="Return proof" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      RECEIVER RETURN PROOF ({receiverEvidence[0].mediaType.toUpperCase()})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Uploader: <strong>{receiverEvidence[0].uploader}</strong></span>
                    <span>Category: <strong>{receiverEvidence[0].categoryLabel}</strong></span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-emerald-500/20">
                    <div className="flex justify-between">
                      <span>Provider Rental Payout:</span>
                      <strong className="text-foreground">₹{currentAmount.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Renter Security Deposit:</span>
                      <strong className="text-emerald-600">₹2,000 (Refunded 100%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Condition Audit:</span>
                      <strong className="text-emerald-600">Verified Undamaged</strong>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    asChild
                  >
                    <Link href="/dashboard/bookings">View Completed Booking in Ledger</Link>
                  </Button>
                </div>
              ) : (
                /* Return Upload Form / Role Restriction */
                <div className="space-y-3 pt-1">
                  {status !== "return_pending" && status !== "in_transit" ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                      <LockIcon className="size-5 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Return verification unlocks once goods are delivered and in-use.
                      </p>
                    </div>
                  ) : !isCurrentSeeker ? (
                    /* Sender is viewing: cannot upload return evidence */
                    <div className="rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 p-4 text-center space-y-2.5">
                      <div className="size-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                        <ClockIcon className="size-4 animate-spin" />
                      </div>
                      <h5 className="text-xs font-bold text-foreground">
                        Awaiting Return Verification by Receiver ({buyerName})
                      </h5>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        As the Sender ({sellerName}), return check-in must be completed by the Receiver ({buyerName}). 
                        They must record mandatory {categoryDef.evidenceType.toUpperCase()} return evidence and certify undamaged return to release escrow.
                      </p>
                      <div className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 text-blue-600 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                          onClick={togglePerspective}
                        >
                          Switch to Receiver ({buyerName}) View to Upload
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Receiver (Buyer) is viewing: Active Upload Controls */
                    <div className="space-y-3">
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <InfoIcon className="size-4 shrink-0 mt-0.5" />
                        <span>
                          You are logged in as the <strong>Receiver ({buyerName})</strong>. Category <strong>{categoryDef.label}</strong> strictly mandates <strong>{categoryDef.evidenceType.toUpperCase()}</strong> evidence for return check-in.
                        </span>
                      </div>

                      {/* File Upload / Camera Input */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Upload Return {categoryDef.evidenceType === "video" ? "Operational Video" : "Inspection Photo"}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="file"
                            accept={categoryDef.evidenceType === "video" ? "video/*" : "image/*"}
                            onChange={(e) => handleFileChange(e.target.files?.[0], false)}
                            className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-8 whitespace-nowrap font-semibold"
                            onClick={() => {
                              const sampleUrl = categoryDef.evidenceType === "video"
                                ? SAMPLE_MEDIA.video.receiver
                                : SAMPLE_MEDIA.photo.receiver;
                              setReceiverMediaUrl(sampleUrl);
                              setReceiverMediaType(categoryDef.evidenceType === "video" ? "video" : "photo");
                              toast.success(`Loaded sample ${categoryDef.evidenceType.toUpperCase()} return inspection media.`);
                            }}
                          >
                            Load Sample {categoryDef.evidenceType === "video" ? "Video" : "Photo"}
                          </Button>
                        </div>
                      </div>

                      {/* Direct URL input fallback */}
                      <div>
                        <Input
                          placeholder={`Enter return ${categoryDef.evidenceType.toUpperCase()} URL...`}
                          value={receiverMediaUrl}
                          onChange={(e) => setReceiverMediaUrl(e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>

                      {receiverMediaUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          {receiverMediaType === "video" ? (
                            <video src={receiverMediaUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={receiverMediaUrl} alt="Return preview" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {receiverMediaType.toUpperCase()} Return Preview
                          </span>
                        </div>
                      )}

                      {/* Mandatory Confirmation Checkbox */}
                      <label className="flex items-start gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={conditionConfirmed}
                          onChange={(e) => setConditionConfirmed(e.target.checked)}
                          className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-foreground font-semibold">
                          I mandatorily confirm that all {initialQty} units of {categoryDef.label} have been returned in satisfactory, undamaged condition.
                        </span>
                      </label>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Return Audit Remarks
                        </label>
                        <Textarea
                          placeholder={`e.g. All ${initialQty} units of ${categoryDef.label} inspected and handed over to carrier by ${buyerName}. Zero damage observed.`}
                          value={receiverNotes}
                          onChange={(e) => setReceiverNotes(e.target.value)}
                          className="text-xs min-h-[50px]"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleReceiverReturn}
                        className="w-full text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                      >
                        <ShieldCheckIcon className="size-3.5" />
                        <span>Verify Return & Release Escrow Deposit (₹2,000)</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>
    </Page>
  );
}

export default function NegotiationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading negotiation channel...</div>}>
      <NegotiationContent />
    </Suspense>
  );
}
