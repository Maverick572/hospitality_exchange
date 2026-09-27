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
  LockIcon,
  MapPinIcon,
  MessageSquareIcon,
  SendIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  UploadCloudIcon,
  VideoIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartCard } from "@/components/ui/chart-card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { usePerspective } from "@/lib/perspective";
import { evidenceApi, requestsApi } from "@/lib/api";
import { inr } from "@/lib/format";

type EvidenceRule = {
  category: string;
  evidenceType: "photo" | "video" | "photo_video";
  label: string;
  description: string;
};

const CATEGORY_RULES: Record<string, EvidenceRule> = {
  banquet_seating: {
    category: "banquet_seating",
    evidenceType: "photo",
    label: "Banquet Seating",
    description: "Physical goods require clear still photography verifying upholstery, frames, and count.",
  },
  tables: {
    category: "tables",
    evidenceType: "photo",
    label: "Tables & Desks",
    description: "Physical furniture requires still photos of table tops, legs, and locking mechanisms.",
  },
  visual_display: {
    category: "visual_display",
    evidenceType: "video",
    label: "LED Video Wall & AV Rigs",
    description: "Powered electronics require operational video proving display panels and audio outputs function.",
  },
  cooking_ranges: {
    category: "cooking_ranges",
    evidenceType: "video",
    label: "Commercial Cooking Ranges",
    description: "Powered kitchen machinery requires operational video verifying burner ignition and thermals.",
  },
  refrigeration: {
    category: "refrigeration",
    evidenceType: "video",
    label: "Refrigeration & Walk-In Chillers",
    description: "Cooling systems require video showing digital temperature readout dropping to target temp.",
  },
  modular_staging_tents: {
    category: "modular_staging_tents",
    evidenceType: "photo_video",
    label: "Modular Staging & Tents",
    description: "Structural installations require wide still photos + full walkthrough video inspection.",
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
};

function NegotiationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { perspective } = usePerspective();

  const resourceTitle = searchParams.get("resource") ?? "300 × Cushioned Banquet Chairs (Co-loaded Route #402)";
  const initialQty = parseInt(searchParams.get("qty") ?? "300", 10);
  const initialAmount = parseInt(searchParams.get("amount") ?? "4250", 10);
  const providerAddress = searchParams.get("provider") ?? "Taj Lands End, Bandra West, Mumbai";
  const seekerAddress = searchParams.get("seeker") ?? "Jio World Centre, G Block, BKC, Mumbai";
  const initDep = searchParams.get("dep") ?? "08:15";
  const initArr = searchParams.get("arr") ?? "08:42";
  const categoryKey = searchParams.get("category") ?? "banquet_seating";
  const vehicleCount = parseInt(searchParams.get("vehicles") ?? "3", 10);

  const rule = CATEGORY_RULES[categoryKey] ?? CATEGORY_RULES.banquet_seating;

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

  // Evidence state
  const [senderEvidence, setSenderEvidence] = useState<EvidenceItem[]>([]);
  const [senderMediaUrl, setSenderMediaUrl] = useState<string>("");
  const [senderMediaType, setSenderMediaType] = useState<"photo" | "video">("photo");
  const [senderNotes, setSenderNotes] = useState("");

  const [receiverEvidence, setReceiverEvidence] = useState<EvidenceItem[]>([]);
  const [receiverMediaUrl, setReceiverMediaUrl] = useState<string>("");
  const [receiverMediaType, setReceiverMediaType] = useState<"photo" | "video">("photo");
  const [receiverNotes, setReceiverNotes] = useState("");
  const [conditionConfirmed, setConditionConfirmed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "seeker",
      senderName: "Jio World Centre (Buyer)",
      type: "request",
      text: `Proposal submitted: Renting ${initialQty} units. Scheduled transport: Departure ${initDep} → Arrival ${initArr} via ${vehicleCount} pooled vehicles.`,
      amount: initialAmount,
      depTime: initDep,
      arrTime: initArr,
      timestamp: "08:02 AM",
    },
    {
      id: "msg-2",
      sender: "provider",
      senderName: "Taj Lands End (Seller)",
      type: "message",
      text: `Hello! We reviewed your demand for ${initialQty} chairs. Loading bay 3 at Bandra is reserved for the pooled convoy. Schedule looks viable.`,
      timestamp: "08:05 AM",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Handle counter offer submission
  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(counterPrice);
    if (!priceNum || priceNum <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const isSeeker = perspective === "seeker";
    const senderName = isSeeker ? "Jio World Centre (Buyer)" : "Taj Lands End (Seller)";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isSeeker ? "seeker" : "provider",
      senderName,
      type: "counter",
      text: counterNote.trim() || `Counter-proposal: ₹${priceNum.toLocaleString("en-IN")} with departure at ${counterDep} and arrival at ${counterArr}.`,
      amount: priceNum,
      depTime: counterDep,
      arrTime: counterArr,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setCurrentAmount(priceNum);
    setDepartureTime(counterDep);
    setArrivalTime(counterArr);
    setShowCounterForm(false);
    setCounterNote("");
    toast.success("Counter-offer proposed!");
  };

  // Send simple text message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const isSeeker = perspective === "seeker";
    const senderName = isSeeker ? "Jio World Centre (Buyer)" : "Taj Lands End (Seller)";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isSeeker ? "seeker" : "provider",
      senderName,
      type: "message",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  // Accept offer and proceed to pre-transit export evidence
  const handleAcceptOffer = () => {
    const isSeeker = perspective === "seeker";
    const accepterName = isSeeker ? "Jio World Centre (Buyer)" : "Taj Lands End (Seller)";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isSeeker ? "seeker" : "provider",
      senderName: accepterName,
      type: "accept",
      text: `Offer officially accepted at ₹${currentAmount.toLocaleString("en-IN")}. Transit window finalized for Departure ${departureTime} → Arrival ${arrivalTime}. Next step: Sender pre-transit condition verification.`,
      amount: currentAmount,
      depTime: departureTime,
      arrTime: arrivalTime,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setStatus("accepted");
    toast.success("Terms finalized! Sender handover verification unlocked.", { icon: "✅" });
  };

  // Sender uploads pre-transit export evidence
  const handleSenderDispatch = () => {
    // Validate mandatory category evidence requirement
    if (!senderMediaUrl) {
      toast.error(`Mandatory ${rule.evidenceType.toUpperCase()} evidence must be attached before dispatch.`);
      return;
    }

    if (rule.evidenceType === "video" && senderMediaType !== "video") {
      toast.error(`Category '${rule.label}' requires OPERATIONAL VIDEO evidence.`);
      return;
    }

    const item: EvidenceItem = {
      id: `ev-disp-${Date.now()}`,
      stage: "PICKUP",
      mediaType: senderMediaType,
      url: senderMediaUrl,
      description: senderNotes.trim() || `All ${initialQty} units inspected at loading bay. Clean upholstery, structural integrity verified.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      uploader: "Taj Lands End Dispatch Officer",
    };

    setSenderEvidence([item]);

    // Send dispatch message into chat
    const dispatchMsg: ChatMessage = {
      id: `msg-disp-${Date.now()}`,
      sender: "provider",
      senderName: "Taj Lands End (Seller)",
      type: "dispatch",
      text: `PRE-TRANSIT EVIDENCE RECORDED: ${rule.evidenceType.toUpperCase()} verified and logged. 3-truck convoy departed Bandra loading bay at ${departureTime}. En route to Jio World Centre.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, dispatchMsg]);
    setStatus("in_transit");
    toast.success("Sender condition evidence recorded! Convoy dispatched in-transit.", { icon: "🚚" });
  };

  // Simulate arrival at destination
  const handleSimulateArrival = () => {
    setStatus("return_pending");
    toast.info("Rental period active. Goods delivered and in-use. Return phase initiated.");
  };

  // Receiver uploads mandatory return evidence & completes escrow release
  const handleReceiverReturn = () => {
    if (!receiverMediaUrl) {
      toast.error(`Mandatory ${rule.evidenceType.toUpperCase()} return evidence must be attached.`);
      return;
    }

    if (rule.evidenceType === "video" && receiverMediaType !== "video") {
      toast.error(`Category '${rule.label}' requires video return verification.`);
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
      description: receiverNotes.trim() || `All ${initialQty} units accounted for. Zero damage observed upon check-in.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      uploader: "Jio World Centre Receiving Lead",
    };

    setReceiverEvidence([item]);

    const returnMsg: ChatMessage = {
      id: `msg-ret-${Date.now()}`,
      sender: "seeker",
      senderName: "Jio World Centre (Buyer)",
      type: "return",
      text: `MANDATORY RETURN EVIDENCE RECORDED: Return media verified against initial dispatch records. Items returned undamaged. Escrow deposit released.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, returnMsg]);
    setStatus("completed");
    toast.success("Return condition verified! Escrow deposit refunded & booking completed.", { icon: "🎉" });
  };

  return (
    <Page>
      <div className="space-y-6 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/logistics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to Logistics Match
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Operational Perspective:</span>
            <Badge variant={perspective === "seeker" ? "default" : "secondary"} className="text-[11px] font-bold">
              {perspective === "seeker" ? "Buyer / Seeker View" : "Seller / Provider View"}
            </Badge>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card/90 to-primary/5 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
                <HandshakeIcon className="size-3.5" />
                <span>B2B NEGOTIATION & HANDOVER PROTOCOL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Offer Negotiation & Mandatory Handover
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Negotiate terms, lock departure & arrival schedules, and fulfill category-specific visual condition evidence at export and return.
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

          {/* Deal Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Resource Lot</span>
              <strong className="text-foreground text-sm font-bold block truncate">{resourceTitle}</strong>
              <span className="text-[11px] text-muted-foreground">{initialQty} Units</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Agreed Rate</span>
              <strong className="text-primary text-base font-extrabold block">
                ₹{currentAmount.toLocaleString("en-IN")}
              </strong>
              <span className="text-[11px] text-muted-foreground">Pooled Transit Included</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Transit Timeline (OSRM)</span>
              <strong className="text-foreground text-sm font-bold block">
                {departureTime} → {arrivalTime}
              </strong>
              <span className="text-[11px] text-muted-foreground">27 mins · 8.9 km corridor</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Category Evidence Rule</span>
              <strong className="text-foreground text-sm font-bold block">{rule.label}</strong>
              <Badge variant="outline" className="text-[10px] mt-0.5 uppercase font-bold">
                {rule.evidenceType === "photo" && "📸 Still Photo Required"}
                {rule.evidenceType === "video" && "🎥 Operational Video Required"}
                {rule.evidenceType === "photo_video" && "📸 Still + 🎥 Walkthrough"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Grid: Chat Stream on Left, Action / Evidence Panel on Right */}
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
                    <h3 className="text-sm font-bold text-foreground">Direct Buyer-Seller Channel</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Bandra Loading Bay ↔ BKC Jio World Centre
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background">
                  Verified Escrow Contract
                </Badge>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/50">
                {messages.map((msg) => {
                  const isSeeker = msg.sender === "seeker";
                  const isProvider = msg.sender === "provider";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isSeeker ? "items-end" : "items-start"
                      } space-y-1 max-w-[85%] sm:max-w-[78%] ${isSeeker ? "ml-auto" : "mr-auto"}`}
                    >
                      <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{msg.senderName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                          isSeeker
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-card border border-border text-foreground rounded-tl-xs"
                        }`}
                      >
                        {/* Offer Tag */}
                        {msg.type !== "message" && (
                          <div className="mb-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isSeeker
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
                              {msg.type === "accept" && "Offer Formally Accepted"}
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
                              isSeeker ? "border-white/20" : "border-border"
                            }`}
                          >
                            <span>Proposed Rate:</span>
                            <span className="font-extrabold text-sm">₹{msg.amount.toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {msg.depTime && msg.arrTime && (
                          <div
                            className={`mt-1 flex items-center justify-between gap-2 text-[11px] ${
                              isSeeker ? "text-white/80" : "text-muted-foreground"
                            }`}
                          >
                            <span>Window:</span>
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
                    placeholder="Type a message to your trade partner..."
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

            {/* Negotiation Offer Action Toolbar */}
            {status === "negotiating" && (
              <Card className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground">Current Active Proposal</h4>
                    <p className="text-[11px] text-muted-foreground">
                      ₹{currentAmount.toLocaleString("en-IN")} · Dep: {departureTime} · Arr: {arrivalTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => toast.info("Proposal declined. You can propose new terms.")}
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

                {/* Counter Offer Modal / Inline Form */}
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
                        Negotiation Note
                      </label>
                      <Input
                        placeholder="e.g. Can do ₹4,000 if loading starts promptly at 8:00 AM."
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

          {/* ── RIGHT: Mandatory Handover & Evidence Center (5 cols) ── */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Category Requirement Explainer Card */}
            <Card className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-primary" />
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-primary">
                  Protocol: {rule.label}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="font-bold text-foreground">Rule:</span>
                <span className="font-medium text-primary">
                  {rule.evidenceType === "photo" && "Still image capture of all units mandatory."}
                  {rule.evidenceType === "video" && "Video proving operational/power state mandatory."}
                  {rule.evidenceType === "photo_video" && "Wide photo + video walkthrough mandatory."}
                </span>
              </div>
            </Card>

            {/* ── Phase 1: Sender Pre-Transit Handover Verification (Export) ── */}
            <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CameraIcon className="size-3.5 text-primary" />
                    <span>Phase 1: Sender Pre-Transit Handover</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Before convoy departs loading bay, sender must log initial condition proof.
                  </p>
                </div>
                <Badge
                  variant={senderEvidence.length > 0 ? "default" : "outline"}
                  className="text-[10px] font-bold"
                >
                  {senderEvidence.length > 0 ? "Evidence Verified" : "Pending Sign-off"}
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
                      PRE-TRANSIT PROOF
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{senderEvidence[0].description}"</p>
                </div>
              ) : (
                /* Sender Upload Form */
                <div className="space-y-3 pt-1">
                  {status === "negotiating" ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                      <LockIcon className="size-5 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Handover evidence unlocks once offer is accepted.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Select Verification Proof Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={senderMediaType === "photo" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8 font-semibold"
                            onClick={() => {
                              setSenderMediaType("photo");
                              setSenderMediaUrl("https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80");
                            }}
                          >
                            <CameraIcon className="size-3 mr-1" />
                            Photo Evidence
                          </Button>
                          <Button
                            type="button"
                            variant={senderMediaType === "video" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8 font-semibold"
                            onClick={() => {
                              setSenderMediaType("video");
                              setSenderMediaUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
                            }}
                          >
                            <VideoIcon className="size-3 mr-1" />
                            Video Evidence
                          </Button>
                        </div>
                      </div>

                      {/* Sample Proof Preset / File URL */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Media Upload / Loading Bay Capture
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter image/video URL or select quick sample..."
                            value={senderMediaUrl}
                            onChange={(e) => setSenderMediaUrl(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-8 whitespace-nowrap"
                            onClick={() =>
                              setSenderMediaUrl(
                                senderMediaType === "video"
                                  ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                                  : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"
                              )
                            }
                          >
                            Load Sample
                          </Button>
                        </div>
                      </div>

                      {senderMediaUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          {senderMediaType === "video" ? (
                            <video src={senderMediaUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={senderMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Preview Ready
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Condition Inspection Notes
                        </label>
                        <Textarea
                          placeholder="e.g. All 300 banquet chairs inspected at Taj Lands End loading bay. Clean upholstery, zero tears, frames intact. Tagged Lot #BE-300."
                          value={senderNotes}
                          onChange={(e) => setSenderNotes(e.target.value)}
                          className="text-xs min-h-[60px]"
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
                    <span>Phase 2: Receiver Mandatory Return Handover</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Mandatory visual proof of returned items required before escrow deposit release.
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
                      RETURN VERIFICATION PROOF
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Provider Rental Payout:</span>
                      <strong className="text-foreground">₹{currentAmount.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Renter Damage Deposit:</span>
                      <strong className="text-emerald-600">₹2,000 (Refunded 100%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispute Claims:</span>
                      <strong className="text-emerald-600">0 (Clean Return)</strong>
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
                /* Return Upload Form */
                <div className="space-y-3 pt-1">
                  {status !== "return_pending" && status !== "in_transit" ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                      <LockIcon className="size-5 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Return verification activates once goods are in transit / delivered.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Return Proof Media Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={receiverMediaType === "photo" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8 font-semibold"
                            onClick={() => {
                              setReceiverMediaType("photo");
                              setReceiverMediaUrl("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80");
                            }}
                          >
                            <CameraIcon className="size-3 mr-1" />
                            Return Photo
                          </Button>
                          <Button
                            type="button"
                            variant={receiverMediaType === "video" ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8 font-semibold"
                            onClick={() => {
                              setReceiverMediaType("video");
                              setReceiverMediaUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
                            }}
                          >
                            <VideoIcon className="size-3 mr-1" />
                            Return Video
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Return Inspection Media URL
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter return photo/video URL..."
                            value={receiverMediaUrl}
                            onChange={(e) => setReceiverMediaUrl(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs h-8 whitespace-nowrap"
                            onClick={() =>
                              setReceiverMediaUrl(
                                receiverMediaType === "video"
                                  ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                                  : "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
                              )
                            }
                          >
                            Load Sample
                          </Button>
                        </div>
                      </div>

                      {receiverMediaUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          {receiverMediaType === "video" ? (
                            <video src={receiverMediaUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={receiverMediaUrl} alt="Return preview" className="w-full h-full object-cover" />
                          )}
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
                          I mandatorily confirm that all {initialQty} units have been returned in satisfactory, undamaged condition.
                        </span>
                      </label>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Return Audit Remarks
                        </label>
                        <Textarea
                          placeholder="e.g. All 300 units counted and loaded back onto carrier. Clean, undamaged, fabric intact."
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
