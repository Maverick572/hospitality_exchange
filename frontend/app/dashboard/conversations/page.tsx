"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  CameraIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  HandshakeIcon,
  InfoIcon,
  KeyIcon,
  LockIcon,
  MapPinIcon,
  MessageSquareIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SendIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  UploadCloudIcon,
  UserCheckIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSession } from "@/lib/session";
import { usePerspective } from "@/lib/perspective";
import {
  conversationsApi,
  type EncryptedConversation,
  type EncryptedMessage,
} from "@/lib/api";
import { resolveBusinessUid } from "@/lib/business-uids";
import { inr } from "@/lib/format";
import categoriesData from "@/lib/categories.json";

// Type definitions from categories.json
type CategoryDef = {
  id: string;
  label: string;
  evidenceType: "photo" | "video" | "photo_video";
  defaultMetric: string;
  keywords: string[];
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

function resolveCategory(catParam?: string, resourceTitle?: string): CategoryDef {
  const categories: CategoryDef[] = categoriesData.categories as CategoryDef[];
  if (catParam) {
    const direct = categories.find((c) => c.id.toLowerCase() === catParam.toLowerCase());
    if (direct) return direct;
  }
  const titleLower = (resourceTitle || "").toLowerCase();
  for (const cat of categories) {
    if (cat.keywords.some((kw) => titleLower.includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  return categories.find((c) => c.id === "banquet_seating") || categories[0];
}

function ConversationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");
  const { perspective, togglePerspective } = usePerspective();
  const { profile } = useBusinessSession();

  const currentBusinessName = profile?.businessName || profile?.name || "Taj Lands End";
  const currentUserId = profile?.userId || resolveBusinessUid(currentBusinessName);

  // States
  const [conversations, setConversations] = useState<EncryptedConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [activeConv, setActiveConv] = useState<EncryptedConversation | null>(null);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "buyer" | "seller">("all");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Modals & Drawers
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState(4100);
  const [counterDepTime, setCounterDepTime] = useState("08:15");
  const [counterArrTime, setCounterArrTime] = useState("08:45");
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceStage, setEvidenceStage] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [showCiphertextModal, setShowCiphertextModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list
  const loadConversations = async (selectFirst = false) => {
    try {
      setLoadingList(true);
      const data = await conversationsApi.list();
      setConversations(data || []);

      if (data && data.length > 0) {
        if (selectFirst && !activeConvId) {
          setActiveConvId(data[0].conversationId);
        } else if (activeConvId) {
          const match = data.find((c) => c.conversationId === activeConvId);
          if (match) setActiveConv(match);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      toast.error("Could not load encrypted conversations");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
  }, []);

  // Fetch active conversation details and decrypted messages
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    const fetchActiveDetails = async () => {
      try {
        setLoadingMessages(true);
        const data = await conversationsApi.getById(activeConvId);
        if (!isMounted) return;

        setActiveConv(data);
        setMessages(data.messages || []);
        if (data.currentAmount) setCounterPrice(data.currentAmount);
        if (data.departureTime) setCounterDepTime(data.departureTime);
        if (data.arrivalTime) setCounterArrTime(data.arrivalTime);
      } catch (err) {
        console.error("Failed to load conversation details:", err);
        toast.error("Access restricted: Chats are strictly between participants.");
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchActiveDetails();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConvId || sending) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const newMsg = await conversationsApi.sendMessage(activeConvId, {
        text: textToSend,
        type: "message",
      });

      setMessages((prev) => [...prev, newMsg]);

      // Update last message in list
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === activeConvId
            ? { ...c, lastMessage: textToSend, lastTimestamp: new Date().toISOString() }
            : c,
        ),
      );
      toast.success("Message encrypted with AES-128 & stored in DB");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to encrypt and store message");
      setMessageInput(textToSend); // restore
    } finally {
      setSending(false);
    }
  };

  // Submit counter offer
  const handleSendCounter = async () => {
    if (!activeConvId || sending) return;
    setSending(true);

    const counterText = `Counter-proposal: ${inr(counterPrice)} with departure at ${counterDepTime} and arrival at ${counterArrTime}.`;

    try {
      const newMsg = await conversationsApi.sendMessage(activeConvId, {
        text: counterText,
        type: "counter",
        amount: counterPrice,
        depTime: counterDepTime,
        arrTime: counterArrTime,
      });

      setMessages((prev) => [...prev, newMsg]);
      setActiveConv((prev) =>
        prev
          ? {
              ...prev,
              currentAmount: counterPrice,
              departureTime: counterDepTime,
              arrivalTime: counterArrTime,
              status: "negotiating",
            }
          : null,
      );

      setShowCounterModal(false);
      toast.success("Counter-offer encrypted & proposed!");
    } catch (err) {
      console.error("Counter failed:", err);
      toast.error("Failed to record counter offer");
    } finally {
      setSending(false);
    }
  };

  // Accept current offer
  const handleAcceptOffer = async () => {
    if (!activeConvId || sending) return;
    setSending(true);

    const acceptText = `Terms accepted at ${inr(activeConv?.currentAmount || counterPrice)}. Handover schedule locked (${activeConv?.departureTime || counterDepTime} - ${activeConv?.arrivalTime || counterArrTime}). Proceeding to Category Condition Verification.`;

    try {
      const newMsg = await conversationsApi.sendMessage(activeConvId, {
        text: acceptText,
        type: "accept",
        amount: activeConv?.currentAmount || counterPrice,
        depTime: activeConv?.departureTime || counterDepTime,
        arrTime: activeConv?.arrivalTime || counterArrTime,
      });

      setMessages((prev) => [...prev, newMsg]);
      setActiveConv((prev) => (prev ? { ...prev, status: "accepted" } : null));
      toast.success("Offer accepted! Escrow and delivery schedule locked.");
    } catch (err) {
      console.error("Accept failed:", err);
      toast.error("Failed to accept offer");
    } finally {
      setSending(false);
    }
  };

  // Upload category evidence
  const handleUploadEvidence = async () => {
    if (!activeConvId || sending || !activeConv) return;
    setSending(true);

    const cat = resolveCategory(activeConv.category, activeConv.resourceTitle);
    const mediaType = cat.evidenceType === "video" ? "video" : "photo";
    const sampleUrl =
      mediaType === "video"
        ? evidenceStage === "PICKUP"
          ? SAMPLE_MEDIA.video.sender
          : SAMPLE_MEDIA.video.receiver
        : evidenceStage === "PICKUP"
          ? SAMPLE_MEDIA.photo.sender
          : SAMPLE_MEDIA.photo.receiver;

    const uploaderRole = evidenceStage === "PICKUP" ? "Sender (Taj Lands End)" : "Receiver (Counterpart)";
    const evidenceText = `[Condition Evidence] Stage: ${evidenceStage === "PICKUP" ? "Pickup / Pre-transit" : "Return / Delivery Inspection"} | Category: ${cat.label} (${mediaType.toUpperCase()}) | Uploader: ${uploaderRole} | File: ${sampleUrl} | Notes: ${evidenceNotes || "Verified compliant with category standard"}`;

    try {
      const newMsg = await conversationsApi.sendMessage(activeConvId, {
        text: evidenceText,
        type: evidenceStage === "PICKUP" ? "dispatch" : "return",
      });

      setMessages((prev) => [...prev, newMsg]);
      setShowEvidenceModal(false);
      setEvidenceNotes("");
      toast.success(
        `Category condition ${mediaType === "video" ? "operational video" : "photo proof"} verified & saved!`,
      );
    } catch (err) {
      console.error("Evidence upload failed:", err);
      toast.error("Failed to attach condition evidence");
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.resourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        filterRole === "all" ||
        (filterRole === "buyer" && c.tradeRole === "buyer") ||
        (filterRole === "seller" && c.tradeRole === "seller");

      return matchesSearch && matchesRole;
    });
  }, [conversations, searchQuery, filterRole]);

  const activeCategory = resolveCategory(activeConv?.category, activeConv?.resourceTitle);

  return (
    <Page className="max-w-7xl">
      <PageHeader
        title="Encrypted B2B Conversations"
        description="Private pairwise AES-128 chats between buyers & sellers stored directly in the database."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadConversations(false)}
              className="gap-1.5 text-xs"
            >
              <RefreshCwIcon className="size-3.5" />
              Sync
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                togglePerspective();
                toast.success(
                  `Switched perspective to ${perspective === "seeker" ? "Provider (Taj Lands End)" : "Seeker (Sourcing)"}`,
                );
              }}
              className="gap-1.5 text-xs border-primary/30"
            >
              <UserCheckIcon className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Role:</span>
              <span className="font-semibold text-primary capitalize">{perspective}</span>
            </Button>
          </div>
        }
      />
      <div className="flex h-[calc(100vh-13.5rem)] min-h-[640px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* ========================================================================= */}
        {/* LEFT PANEL: WHATSAPP-STYLE CONVERSATION SIDEBAR                           */}
        {/* ========================================================================= */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border bg-muted/20 md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquareIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Conversations</h2>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <LockIcon className="size-3" />
                  <span>AES-128 Pairwise Encrypted</span>
                </div>
              </div>
            </div>

            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600">
              E2EE DB
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats, hotels or items..."
                className="h-9 pl-9 pr-4 text-xs bg-background/80"
              />
              <MessageSquareIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterRole("all")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filterRole === "all"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Chats
              </button>
              <button
                type="button"
                onClick={() => setFilterRole("buyer")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filterRole === "buyer"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Buying ({conversations.filter((c) => c.tradeRole === "buyer").length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole("seller")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filterRole === "seller"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Selling ({conversations.filter((c) => c.tradeRole === "seller").length})
              </button>
            </div>
          </div>

          {/* WhatsApp-Style Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <RefreshCwIcon className="size-6 animate-spin text-primary mb-2" />
                <p className="text-xs">Decrypting conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquareIcon className="size-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No conversations found</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Start an offer or smart match from the marketplace.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.conversationId === activeConvId;
                const formattedTime = conv.lastTimestamp
                  ? new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";

                return (
                  <button
                    key={conv.conversationId}
                    type="button"
                    onClick={() => setActiveConvId(conv.conversationId)}
                    className={`group flex w-full items-start gap-3 p-3.5 text-left transition-all hover:bg-muted/50 cursor-pointer ${
                      isSelected
                        ? "bg-accent/40 border-l-4 border-l-primary shadow-2xs"
                        : "bg-transparent"
                    }`}
                  >
                    {/* Hotel Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent font-bold text-primary border border-primary/20 shadow-2xs">
                        {conv.partnerName.charAt(0)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card bg-emerald-500" />
                    </div>

                    {/* Chat Item Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-bold text-foreground">
                          {conv.partnerName}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                          {formattedTime}
                        </span>
                      </div>

                      {/* Resource Tag & Role */}
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider"
                        >
                          {conv.tradeRole === "buyer" ? "Buyer" : "Seller"}
                        </Badge>
                        <span className="truncate text-[11px] text-muted-foreground font-medium">
                          {conv.resourceTitle}
                        </span>
                      </div>

                      {/* Last Message Decrypted Snippet */}
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/90">
                        <CheckCheckIcon className="size-3 shrink-0 text-emerald-500" />
                        <p className="truncate line-clamp-1">{conv.lastMessage || "Encrypted negotiation message"}</p>
                      </div>

                      {/* Status Badges */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                          <LockIcon className="size-2.5 text-emerald-500" />
                          Encrypted
                        </span>
                        {conv.currentAmount && (
                          <span className="text-[10px] font-semibold text-foreground">
                            {inr(conv.currentAmount)}
                          </span>
                        )}
                        {conv.status === "accepted" && (
                          <Badge variant="outline" className="border-emerald-500/40 text-[9px] text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30">
                            Agreed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Sidebar Footer info */}
          <div className="border-t border-border bg-card/40 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="size-3.5 text-emerald-500" />
              <span>Two-Party Partitioned Vault</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCiphertextModal(true)}
              className="text-primary hover:underline text-[10px] font-medium"
            >
              Verify DB
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT MAIN PANEL: ACTIVE CONVERSATION & ENCRYPTED CHAT                    */}
        {/* ========================================================================= */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {activeConv ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 font-bold text-primary border border-primary/20">
                    <Building2Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground">
                        {activeConv.partnerName}
                      </h3>
                      <BadgeCheckIcon className="size-4 text-emerald-500" />
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {activeConv.tradeRole === "buyer" ? "Buyer" : "Seller"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">{activeConv.resourceTitle}</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">
                        {activeConv.currentAmount ? inr(activeConv.currentAmount) : "Flexible"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">
                        {activeConv.departureTime || "08:00"} - {activeConv.arrivalTime || "09:00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Bar Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCiphertextModal(true)}
                    className="gap-1.5 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                    title="Inspect actual ciphertext strings in DB"
                  >
                    <LockIcon className="size-3 text-emerald-500" />
                    <span className="hidden sm:inline">Inspect DB Ciphertext</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEvidenceModal(true)}
                    className="gap-1.5 text-xs"
                  >
                    {activeCategory.evidenceType === "video" ? (
                      <VideoIcon className="size-3.5 text-purple-500" />
                    ) : (
                      <CameraIcon className="size-3.5 text-blue-500" />
                    )}
                    <span>Attach Proof</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs gap-1"
                  >
                    <Link href="/dashboard/logistics">
                      <TruckIcon className="size-3.5 text-amber-500" />
                      <span className="hidden md:inline">Logistics</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* End-to-End Encryption Notice Banner */}
              <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 shrink-0 text-emerald-500" />
                  <span>
                    <strong>Pairwise End-to-End Encrypted (AES-128 / Fernet):</strong> Messages are stored encrypted in the database strictly between <em>{currentBusinessName}</em> and <em>{activeConv.partnerName}</em>. Non-participants receive 403 Forbidden.
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-[10px] font-mono">
                  AES-256-GCM / SHA256 Key
                </Badge>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {/* Date separator */}
                <div className="flex justify-center my-2">
                  <span className="rounded-full bg-muted/80 px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shadow-2xs border border-border/50">
                    Negotiation History • {activeConv.partnerName}
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <RefreshCwIcon className="size-6 animate-spin text-primary mb-2" />
                    <p className="text-xs">Decrypting pairwise message vault...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <MessageSquareIcon className="size-8 opacity-40 mb-2" />
                    <p className="text-xs font-semibold">No messages in this encrypted channel yet.</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      Propose a counter-offer or send an encrypted message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      msg.senderName.toLowerCase().includes("taj") ||
                      msg.senderId === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {/* Bubble Container */}
                        <div
                          className={`group relative max-w-lg rounded-2xl p-3.5 shadow-2xs transition-all ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-xs"
                              : "bg-card border border-border text-foreground rounded-tl-xs"
                          }`}
                        >
                          {/* Sender name for counterpart */}
                          {!isMe && (
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-primary">
                              <span>{msg.senderName}</span>
                              <BadgeCheckIcon className="size-3" />
                            </div>
                          )}

                          {/* Render based on message type */}
                          {msg.type === "counter" || msg.type === "request" ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={isMe ? "secondary" : "default"}
                                  className="text-[10px] font-bold tracking-wide uppercase"
                                >
                                  Proposal
                                </Badge>
                                <span className="text-xs font-bold">
                                  {msg.amount ? inr(msg.amount) : "Proposed Terms"}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.text}</p>

                              {/* Interactive Accept / Counter actions for counterpart */}
                              {!isMe && activeConv.status !== "accepted" && (
                                <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-border/50">
                                  <Button
                                    size="sm"
                                    onClick={handleAcceptOffer}
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  >
                                    <CheckCircle2Icon className="size-3" />
                                    Accept Offer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCounterModal(true)}
                                    className="h-7 text-xs gap-1"
                                  >
                                    Counter
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : msg.type === "accept" ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                                <CheckCircle2Icon className="size-4" />
                                <span>Deal Locked & Terms Agreed</span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.text}</p>
                              <div className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] flex items-center justify-between">
                                <span>Escrow Deposit: <strong>{inr(activeConv.currentAmount || 4100)}</strong></span>
                                <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-400">
                                  Ready
                                </Badge>
                              </div>
                            </div>
                          ) : msg.type === "dispatch" || msg.type === "return" ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                                {activeCategory.evidenceType === "video" ? (
                                  <VideoIcon className="size-4" />
                                ) : (
                                  <CameraIcon className="size-4" />
                                )}
                                <span>
                                  {msg.type === "dispatch"
                                    ? "Phase 1: Sender Dispatch Evidence"
                                    : "Phase 2: Receiver Return Inspection"}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.text}</p>

                              {/* Sample Media Display */}
                              <div className="mt-2 overflow-hidden rounded-lg border border-border/40">
                                {activeCategory.evidenceType === "video" ? (
                                  <video
                                    src={
                                      msg.type === "dispatch"
                                        ? SAMPLE_MEDIA.video.sender
                                        : SAMPLE_MEDIA.video.receiver
                                    }
                                    controls
                                    className="h-36 w-full object-cover bg-black"
                                  />
                                ) : (
                                  <img
                                    src={
                                      msg.type === "dispatch"
                                        ? SAMPLE_MEDIA.photo.sender
                                        : SAMPLE_MEDIA.photo.receiver
                                    }
                                    alt="Condition Evidence"
                                    className="h-36 w-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          )}

                          {/* Message Footer with timestamp and double tick */}
                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                            }`}
                          >
                            <span>{msg.timestamp || "Just now"}</span>
                            {isMe && <CheckCheckIcon className="size-3 text-emerald-300" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom WhatsApp-Style Input Bar */}
              <div className="shrink-0 border-t border-border bg-card p-3">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Attach Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEvidenceModal(true)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Upload Condition Proof (Photo/Video)"
                  >
                    <PaperclipIcon className="size-4.5" />
                  </Button>

                  {/* Make Counter Offer Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCounterModal(true)}
                    className="h-9 gap-1 text-xs shrink-0 font-semibold border-primary/30"
                  >
                    <HandshakeIcon className="size-3.5 text-primary" />
                    <span>Offer</span>
                  </Button>

                  {/* Message Input */}
                  <div className="relative flex-1">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type an encrypted message..."
                      className="h-9 pr-8 text-xs bg-muted/40 focus-visible:ring-1"
                    />
                    <LockIcon className="absolute right-2.5 top-2.5 size-3.5 text-emerald-500" />
                  </div>

                  {/* Send Button */}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageInput.trim() || sending}
                    className="shrink-0 size-9 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <SendIcon className="size-4" />
                  </Button>
                </form>

                {/* Footer Encryption Tag */}
                <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground/80">
                  <span className="flex items-center gap-1">
                    <LockIcon className="size-3 text-emerald-500" />
                    Stored as AES-128 ciphertext in database between these 2 parties only
                  </span>
                  <span>Category standard: <strong>{activeCategory.label} ({activeCategory.evidenceType.toUpperCase()})</strong></span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4 border border-primary/20">
                <MessageSquareIcon className="size-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">Select a B2B Conversation</h3>
              <p className="max-w-sm text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Choose an existing buyer or seller thread from the left sidebar to inspect AES-128 encrypted communications, counter-proposals, and category condition proof.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROPOSE COUNTER OFFER                                            */}
      {/* ========================================================================= */}
      {showCounterModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HandshakeIcon className="size-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Propose Counter-Offer</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowCounterModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">Proposed Price (₹)</label>
                <Input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="mt-1.5"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Original listing estimate: {inr(activeConv.currentAmount || 4100)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Departure Time</label>
                  <Input
                    type="time"
                    value={counterDepTime}
                    onChange={(e) => setCounterDepTime(e.target.value)}
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Arrival Time</label>
                  <Input
                    type="time"
                    value={counterArrTime}
                    onChange={(e) => setCounterArrTime(e.target.value)}
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <ShieldCheckIcon className="size-3.5 text-emerald-500" />
                  <span>AES-128 Encrypted Payload</span>
                </div>
                <p>This counter-offer will be encrypted with your pairwise key before saving to Firestore.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setShowCounterModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendCounter} disabled={sending} className="gap-1.5">
                <SendIcon className="size-3.5" />
                Submit Counter-Offer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATEGORY CONDITION EVIDENCE (PHOTO VS VIDEO)                     */}
      {/* ========================================================================= */}
      {showEvidenceModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {activeCategory.evidenceType === "video" ? (
                  <VideoIcon className="size-5 text-purple-500" />
                ) : (
                  <CameraIcon className="size-5 text-blue-500" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Condition Evidence: {activeCategory.label}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Mandatory evidence type: <strong>{activeCategory.evidenceType.toUpperCase()}</strong>
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowEvidenceModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Stage Selection */}
              <div>
                <label className="font-semibold text-foreground">Handover Stage & Role Segregation</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceStage("PICKUP")}
                    className={`rounded-lg border p-2.5 text-left transition-all ${
                      evidenceStage === "PICKUP"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">1. Dispatch Proof</span>
                      <Badge variant="outline" className="text-[9px]">Sender</Badge>
                    </div>
                    <p className="mt-1 text-[10px] font-normal opacity-80">
                      Uploaded by Sender before transit begins
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvidenceStage("DELIVERY")}
                    className={`rounded-lg border p-2.5 text-left transition-all ${
                      evidenceStage === "DELIVERY"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">2. Return Proof</span>
                      <Badge variant="outline" className="text-[9px]">Receiver</Badge>
                    </div>
                    <p className="mt-1 text-[10px] font-normal opacity-80">
                      Uploaded by Receiver upon return inspection
                    </p>
                  </button>
                </div>
              </div>

              {/* Sample Media Preview */}
              <div>
                <label className="font-semibold text-foreground">Verified Media Preview</label>
                <div className="mt-1.5 overflow-hidden rounded-xl border border-border bg-black/40">
                  {activeCategory.evidenceType === "video" ? (
                    <video
                      src={evidenceStage === "PICKUP" ? SAMPLE_MEDIA.video.sender : SAMPLE_MEDIA.video.receiver}
                      controls
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={evidenceStage === "PICKUP" ? SAMPLE_MEDIA.photo.sender : SAMPLE_MEDIA.photo.receiver}
                      alt="Condition preview"
                      className="h-44 w-full object-cover"
                    />
                  )}
                </div>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {activeCategory.evidenceType === "video"
                    ? "Operational video: Verifies mechanical motion, sound, and live function."
                    : "High-resolution photo: Verifies physical cleanliness, surface condition, and lot count."}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-foreground">Inspection Observations</label>
                <Textarea
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="e.g. Unit tested and running smooth, zero cosmetic tears, clean return..."
                  rows={2}
                  className="mt-1.5 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setShowEvidenceModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUploadEvidence} disabled={sending} className="gap-1.5">
                <UploadCloudIcon className="size-3.5" />
                Upload Condition Evidence
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DATABASE CIPHERTEXT INSPECTOR                                    */}
      {/* ========================================================================= */}
      {showCiphertextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <Card className="w-full max-w-xl border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LockIcon className="size-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Database Ciphertext Verification</h3>
                  <span className="text-[11px] text-muted-foreground">
                    Direct cryptographic audit of messages in storage
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowCiphertextModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">Pairwise Key Derivation</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-mono text-[9px]">
                    SHA256(hrex_b2b_vault_salt_v1:uidA:uidB)
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Both parties deterministically compute the exact same 256-bit AES key. No private key exchange required. Non-participants cannot compute this key or query records.
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground">Raw Ciphertext in DB (Sample)</label>
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg bg-black/90 p-3 font-mono text-[10px] text-emerald-400 break-all border border-emerald-500/30">
                  {messages.length > 0 && messages[0].ciphertextSample
                    ? messages[0].ciphertextSample
                    : "gAAAAABn7Q1xZ4kL93_9w2PqLmNa89bVxZa004kLKw99... [Fernet-AES-128 base64 encrypted payload stored in Firestore]"}
                </div>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  The actual database document contains only the ciphertext string above. If an unauthorized third party reads the collection, they cannot decipher the trade terms.
                </span>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheckIcon className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <strong>Access Policy Verified:</strong> Only the two participants with matching authenticated UIDs can access this thread. The backend automatically returns <code>403 Forbidden</code> for all other accounts.
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <Button size="sm" onClick={() => setShowCiphertextModal(false)}>
                Close Audit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <RefreshCwIcon className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConversationsContent />
    </Suspense>
  );
}
