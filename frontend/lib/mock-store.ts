import {
  MOCK_BOOKINGS,
  MOCK_CATEGORIES,
  MOCK_DRIVER,
  MOCK_DRIVER_DASHBOARD,
  MOCK_DRIVER_ROUTES,
  MOCK_ESCROW,
  MOCK_NOTIFICATIONS,
  MOCK_REQUESTS,
  MOCK_RESOURCES,
  MOCK_SEARCH_PRODUCTS,
  MOCK_USER,
  MOCK_USER_DASHBOARD,
} from "./mock-data";
import type {
  AppNotification,
  Booking,
  Category,
  ConditionEvidence,
  CounterInput,
  CreateRequestInput,
  DeliveryOpportunity,
  DriverDashboard,
  DriverProfile,
  DriverRoute,
  DriverRouteInput,
  Escrow,
  Requirement,
  RequirementInput,
  Resource,
  ResourceInput,
  ResourceRequest,
  RouteMatch,
  SearchInput,
  SearchProduct,
  SearchResult,
  UserDashboard,
  UserProfile,
} from "./types";

class MockStore {
  user: UserProfile = { ...MOCK_USER };
  resources: Resource[] = [...MOCK_RESOURCES];
  requests: ResourceRequest[] = [...MOCK_REQUESTS];
  bookings: Booking[] = [...MOCK_BOOKINGS];
  escrows: Record<string, Escrow> = { ...MOCK_ESCROW };
  notifications: AppNotification[] = [...MOCK_NOTIFICATIONS];
  driver: DriverProfile = { ...MOCK_DRIVER };
  driverRoutes: DriverRoute[] = [...MOCK_DRIVER_ROUTES];
  requirements: Requirement[] = [];

  isDemoMode = false;
  forceDemo = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hrex_demo_mode");
      if (saved === "true") {
        this.forceDemo = true;
      }
    }
  }

  setForceDemo(enabled: boolean) {
    this.forceDemo = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("hrex_demo_mode", enabled ? "true" : "false");
      window.dispatchEvent(new Event("hrex_demo_mode_changed"));
    }
  }

  // --- Users ---
  getUser(): UserProfile {
    return this.user;
  }
  updateUser(data: Partial<UserProfile>): UserProfile {
    this.user = { ...this.user, ...data, updatedAt: new Date().toISOString() };
    return this.user;
  }

  // --- Categories ---
  getCategories(): Category[] {
    return MOCK_CATEGORIES;
  }

  // --- Resources ---
  getResources(): Resource[] {
    return this.resources;
  }
  getResourceById(id: string): Resource | undefined {
    return this.resources.find((r) => r.resourceId === id);
  }
  createResource(data: ResourceInput): Resource {
    const newRes: Resource = {
      ...data,
      resourceId: `res_${Date.now()}`,
      userId: this.user.userId,
      availableQuantity: data.quantity,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.resources.unshift(newRes);
    return newRes;
  }
  updateResource(id: string, data: Partial<ResourceInput>): Resource {
    const idx = this.resources.findIndex((r) => r.resourceId === id);
    if (idx >= 0) {
      this.resources[idx] = { ...this.resources[idx], ...data, updatedAt: new Date().toISOString() };
      return this.resources[idx];
    }
    throw new Error("Resource not found");
  }
  deleteResource(id: string): boolean {
    const idx = this.resources.findIndex((r) => r.resourceId === id);
    if (idx >= 0) {
      this.resources[idx].status = "inactive";
      return true;
    }
    return false;
  }

  // --- Search & Discovery ---
  search(data: SearchInput): SearchResult {
    const query = (data.description || "").toLowerCase();
    let matches: SearchProduct[] = this.resources.map((res): SearchProduct => {
      const matchScore = query.includes("chair") && res.category === "furniture" ? 96
        : query.includes("table") && res.category === "furniture" ? 92
        : query.includes("oven") || query.includes("combi") ? 98
        : query.includes("projector") || query.includes("sound") ? 94
        : 85;

      return {
        productId: res.resourceId,
        resourceId: res.resourceId,
        name: res.name,
        category: res.category,
        description: res.description ?? "",
        condition: res.condition ?? "excellent",
        quantity: res.quantity,
        availableQuantity: res.availableQuantity ?? res.quantity,
        price: res.price,
        pricingUnit: res.pricingUnit,
        status: res.status,
        images: res.images ?? [],
        location: res.location ?? null,
        availability: res.availability ?? [],
        provider: {
          providerId: res.providerId ?? res.userId ?? "usr_grand_hyatt_bkc",
          businessName: (res.providerId ?? res.userId) === this.user.userId ? (this.user.businessName ?? "Grand Hyatt Mumbai") : "Mumbai Hospitality Partner",
          rating: 4.9,
          reviewCount: 38,
          location: res.location ?? undefined,
        },
        matchedItem: {
          name: res.name.split(" ")[0] || "Hospitality Item",
          category: res.category,
          requestedQuantity: Math.min(100, res.quantity),
          matchedQuantity: Math.min(100, res.quantity),
          metric: "units",
        },
        availableForRequestedPeriod: true,
        availabilityScore: 100,
        distanceKm: 2.4,
        matchScore,
        matchReasons: [
          "Verified inventory in BKC corridor",
          "Matches required rental schedule",
          "Fast-response hospitality provider",
        ],
      };
    });

    if (matches.length === 0) {
      matches = [...MOCK_SEARCH_PRODUCTS];
    }

    return {
      description: data.description,
      fromTimestamp: data.fromTimestamp ?? null,
      toTimestamp: data.toTimestamp ?? null,
      totalMatches: matches.length,
      parsedItems: [
        {
          name: "Banquet Chairs",
          category: "furniture",
          quantity: 100,
          metric: "units",
        },
        {
          name: "Round Tables",
          category: "furniture",
          quantity: 10,
          metric: "units",
        },
      ],
      products: matches,
    };
  }

  // --- Requests ---
  getRequests(): ResourceRequest[] {
    return this.requests;
  }
  createRequest(data: CreateRequestInput): ResourceRequest {
    const res = this.getResourceById(data.resourceId);
    const newReq: ResourceRequest = {
      requestId: `req_${Date.now()}`,
      seekerId: this.user.userId,
      providerId: data.providerId,
      resourceId: data.resourceId,
      requestedQuantity: data.requestedQuantity,
      offeredPrice: data.offeredPrice,
      status: "pending",
      message: data.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resource: res ? { resourceId: res.resourceId, name: res.name } : undefined,
      seeker: {
        userId: this.user.userId,
        businessName: this.user.businessName ?? "Grand Hyatt Mumbai",
        contactName: this.user.contactName ?? this.user.name ?? "Rajesh Kumar",
        phone: this.user.phone ?? "+91 98201 12345",
        rating: 4.92,
      },
    };
    this.requests.unshift(newReq);
    return newReq;
  }
  counterRequest(id: string, data: CounterInput) {
    const req = this.requests.find((r) => r.requestId === id);
    if (req) {
      req.status = "countered";
      req.counterPrice = data.counterPrice ?? data.price;
      req.counterNotes = data.notes ?? data.message;
      req.updatedAt = new Date().toISOString();
    }
  }
  acceptRequest(id: string): { requestId: string; status: string; bookingId: string } {
    const req = this.requests.find((r) => r.requestId === id);
    const bookingId = `bk_${Date.now()}`;
    if (req) {
      req.status = "accepted";
      req.updatedAt = new Date().toISOString();
      const totalPrice = req.counterPrice ?? req.offeredPrice;
      const newBooking: Booking = {
        bookingId,
        requestId: req.requestId,
        seekerId: req.seekerId,
        providerId: req.providerId,
        resourceId: req.resourceId,
        quantity: req.requestedQuantity,
        totalPrice,
        totalAmount: totalPrice,
        resourceAmount: totalPrice,
        deliveryAmount: 1200,
        depositAmount: 2000,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.bookings.unshift(newBooking);
      this.escrows[bookingId] = {
        escrowId: `esc_${Date.now()}`,
        bookingId,
        totalAmount: totalPrice,
        amount: totalPrice,
        providerPayout: Math.round(totalPrice * 0.9),
        driverPayout: Math.round(totalPrice * 0.08),
        platformFee: Math.round(totalPrice * 0.02),
        damageDeposit: 2000,
        depositAmount: 2000,
        status: "funded",
        paymentReference: `PAY_DEMO_${Date.now()}`,
        fundedAt: new Date().toISOString(),
      };
    }
    return { requestId: id, status: "accepted", bookingId };
  }
  rejectRequest(id: string, reason?: string) {
    const req = this.requests.find((r) => r.requestId === id);
    if (req) {
      req.status = "rejected";
      req.rejectionReason = reason;
      req.updatedAt = new Date().toISOString();
    }
  }

  // --- Bookings ---
  getBookings(): Booking[] {
    return this.bookings;
  }
  getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.bookingId === id);
  }
  confirmReceipt(id: string) {
    const b = this.bookings.find((item) => item.bookingId === id);
    if (b) {
      b.status = "delivered";
      b.updatedAt = new Date().toISOString();
    }
  }

  // --- Escrow ---
  getEscrow(id: string): Escrow | undefined {
    return this.escrows[id] || {
      escrowId: `esc_${id}`,
      bookingId: id,
      totalAmount: 15000,
      providerPayout: 13500,
      driverPayout: 1200,
      platformFee: 300,
      damageDeposit: 2000,
      status: "funded",
      fundedAt: new Date().toISOString(),
    };
  }
  fundEscrow(id: string, ref: string = "PAY_DEMO"): Escrow {
    const esc = this.getEscrow(id)!;
    esc.status = "funded";
    esc.paymentReference = ref;
    esc.fundedAt = new Date().toISOString();
    return esc;
  }
  releaseEscrow(id: string): Escrow {
    const esc = this.getEscrow(id)!;
    esc.status = "released";
    esc.releasedAt = new Date().toISOString();
    return esc;
  }

  // --- Notifications ---
  getNotifications(): AppNotification[] {
    return this.notifications;
  }
  markNotificationRead(id: string) {
    const n = this.notifications.find((item) => item.notificationId === id);
    if (n) n.read = true;
  }

  // --- Dashboards ---
  getUserDashboard(): UserDashboard {
    return {
      activeResources: this.resources.filter((r) => r.status === "active").length,
      activeBookings: this.bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
      completedBookings: 24,
      pendingRequests: this.requests.filter((r) => ["pending", "countered"].includes(r.status)).length,
      totalEarnings: 184500,
    };
  }
  getDriverDashboard(): DriverDashboard {
    return MOCK_DRIVER_DASHBOARD;
  }

  // --- Drivers ---
  getDriver(): DriverProfile {
    return this.driver;
  }
  getDriverRoutes(): DriverRoute[] {
    return this.driverRoutes;
  }
  createDriverRoute(data: DriverRouteInput): DriverRoute {
    const newRoute: DriverRoute = {
      ...data,
      routeId: `route_${Date.now()}`,
      driverId: this.driver.driverId,
      availableCapacity: data.availableCapacity ?? data.capacity ?? data.totalCapacity ?? 500,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    this.driverRoutes.unshift(newRoute);
    return newRoute;
  }
  getDriverMatches(): DeliveryOpportunity[] {
    return [
      {
        deliveryRequestId: "del_match_01",
        bookingId: "bk_94821a_hyatt_taj",
        pickupLocation: {
          address: "Bandra Kurla Complex, Mumbai",
          latitude: 19.0728,
          longitude: 72.855,
        },
        deliveryLocation: {
          address: "Apollo Bunder, Colaba, Mumbai",
          latitude: 18.9217,
          longitude: 72.8332,
        },
        requiredCapacity: 350,
        estimatedEarnings: 2400,
        estimatedPayout: 2400,
        pickupDetourKm: 1.8,
        status: "available",
      },
    ];
  }
  matchRoutes(): RouteMatch[] {
    return [
      {
        routeId: "route_mumbai_spine_01",
        driver: {
          driverId: "drv_ramesh_pawar",
          name: "Ramesh Pawar",
          phone: "+91 97690 12345",
          vehicleType: "Tata Ace XL (1.2 Ton)",
          rating: 4.88,
        },
        startLocation: { address: "Bandra Kurla Complex", latitude: 19.0728, longitude: 72.855 },
        destination: { address: "Apollo Bunder, Colaba", latitude: 18.9217, longitude: 72.8332 },
        stops: [],
        travelDate: "2026-09-28",
      },
    ];
  }
}

export const mockStore = new MockStore();
