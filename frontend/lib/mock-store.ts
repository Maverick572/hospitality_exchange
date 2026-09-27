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

    this.emitNotification({
      userId: data.providerId,
      type: "REQUEST_RECEIVED",
      title: "New Resource Booking Request",
      message: `${this.user.businessName || "Buyer"} requested ${data.requestedQuantity} units: "${data.message || "Review proposal"}"`,
      referenceId: newReq.requestId,
    });

    return newReq;
  }
  counterRequest(id: string, data: CounterInput) {
    const req = this.requests.find((r) => r.requestId === id);
    if (req) {
      req.status = "countered";
      req.counterPrice = data.counterPrice ?? data.price;
      req.counterNotes = data.notes ?? data.message;
      req.updatedAt = new Date().toISOString();

      const recipientId = req.providerId === this.user.userId ? req.seekerId : req.providerId;
      this.emitNotification({
        userId: recipientId,
        type: "REQUEST_COUNTERED",
        title: "Counter-Offer Received",
        message: `New proposal: ₹${(req.counterPrice ?? 0).toLocaleString("en-IN")}. ${data.message || ""}`,
        referenceId: req.requestId,
      });
    }
  }
  acceptRequest(id: string): { requestId: string; status: string; bookingId: string } {
    const req = this.requests.find((r) => r.requestId === id);
    const bookingId = `bk_${Date.now()}`;
    if (req) {
      req.status = "accepted";
      req.updatedAt = new Date().toISOString();
      const totalPrice = req.counterPrice ?? req.offeredPrice;

      const otherParty = req.providerId === this.user.userId ? req.seekerId : req.providerId;
      this.emitNotification({
        userId: otherParty,
        type: "REQUEST_ACCEPTED",
        title: "Agreement Finalized!",
        message: `Booking ${bookingId} confirmed at ₹${(totalPrice ?? 0).toLocaleString("en-IN")}. Proceed with condition verification.`,
        referenceId: bookingId,
      });

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
  emitNotification(data: Partial<AppNotification>): AppNotification {
    const notif: AppNotification = {
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId || "usr_taj_lands_end",
      type: data.type || "REQUEST_RECEIVED",
      title: data.title || "New Notification",
      message: data.message || "",
      referenceId: data.referenceId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hrex_last_notif", JSON.stringify(notif));
        window.dispatchEvent(new CustomEvent("hrex_notification_received", { detail: notif }));
      } catch {
        // ignore storage errors
      }
    }
    return notif;
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
  getRequirements(): Requirement[] {
    if (this.requirements.length === 0) {
      return [
        {
          requirementId: "req_jio_gala",
          seekerId: "usr_jio_convention",
          description: "I need 250 banquet chairs, 25 round tables, and a 4K LED video wall for a 3-day tech summit gala dinner in BKC",
          items: [
            { category: "banquet_seating", name: "Banquet Chairs", quantity: 250, metric: "units" },
            { category: "tables", name: "Round Tables", quantity: 25, metric: "units" },
            { category: "visual_display", name: "4K LED Video Wall", quantity: 1, metric: "units" },
          ],
          location: { address: "Jio World Centre, G Block, BKC, Mumbai 400098", latitude: 19.0588, longitude: 72.8653 },
          requiredDate: "2026-09-28",
          budget: 125000,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          requirementId: "req_gymkhana_dinner",
          seekerId: "usr_bombay_gymkhana",
          description: "We need 30 chafing dishes, 150 fine china dinner sets, and table linen for 150 guests at our annual awards dinner",
          items: [
            { category: "buffet_serving", name: "Chafing Dishes", quantity: 30, metric: "units" },
            { category: "crockery_glassware", name: "Fine China Dinner Sets", quantity: 150, metric: "units" },
            { category: "linen_textiles", name: "Table Linen Sets", quantity: 15, metric: "units" },
          ],
          location: { address: "Bombay Gymkhana, MG Road, Fort, Mumbai 400001", latitude: 18.9327, longitude: 72.8316 },
          requiredDate: "2026-09-28",
          budget: 45000,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          requirementId: "req_nesco_expo",
          seekerId: "usr_nesco_goregaon",
          description: "Need 8 modular stage sections, PA system with line array, and 2 commercial tandoor ovens for food fest expo stalls",
          items: [
            { category: "staging_structures", name: "Modular Stage Sections", quantity: 8, metric: "units" },
            { category: "sound_system", name: "PA System Line Array", quantity: 1, metric: "units" },
            { category: "cooking_equipment", name: "Commercial Tandoor Oven", quantity: 2, metric: "units" },
          ],
          location: { address: "NESCO Exhibition Centre, Goregaon East, Mumbai 400063", latitude: 19.1545, longitude: 72.856 },
          requiredDate: "2026-09-29",
          budget: 85000,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          requirementId: "req_taj_colaba_event",
          seekerId: "usr_taj_colaba",
          description: "Require 2 walk-in cold room trailers and 200 banquet chairs for a seafood festival at Gateway of India lawns",
          items: [
            { category: "refrigeration", name: "Mobile Cold Room Trailer", quantity: 2, metric: "units" },
            { category: "banquet_seating", name: "Banquet Chairs", quantity: 200, metric: "units" },
          ],
          location: { address: "The Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai 400001", latitude: 18.9217, longitude: 72.8332 },
          requiredDate: "2026-09-28",
          budget: 60000,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          requirementId: "req_worli_cocktail",
          seekerId: "usr_blue_sea_worli",
          description: "Need 100 banquet chairs, 10 round tables, and 80 fine china sets for a rooftop cocktail reception",
          items: [
            { category: "banquet_seating", name: "Banquet Chairs", quantity: 100, metric: "units" },
            { category: "tables", name: "Round Tables", quantity: 10, metric: "units" },
            { category: "crockery_glassware", name: "Fine China Sets", quantity: 80, metric: "units" },
          ],
          location: { address: "Blue Sea Banquets, Dr Annie Besant Road, Worli, Mumbai 400018", latitude: 19.0144, longitude: 72.8159 },
          requiredDate: "2026-09-28",
          budget: 35000,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
    return this.requirements;
  }

  matchRoutes() {
    return [
      {
        routeId: "route_borivali_to_bandra_eicher",
        driver: {
          driverId: "drv_vikram_salvi",
          name: "Vikram Salvi",
          vehicleType: "Eicher Pro 2049 Light Truck",
          vehicleNumber: "MH-04-GZ-2309",
          capacity: 220,
          rating: 4.93,
        },
        startLocation: { address: "Borivali West Station, Mumbai", latitude: 19.2307, longitude: 72.8567 },
        destination: { address: "Taj Lands End, Bandra West, Mumbai", latitude: 19.044, longitude: 72.821 },
        availableCapacity: 140,
        requiredCapacity: 300,
        unitsFitted: 140,
        remainingUnits: 160,
        capacityFulfillment: "partial",
        departureTime: "08:15",
        arrivalTime: "08:42",
        price: 1850,
        total_detour_km: 3.2,
        osmDistanceKm: 8.9,
        osmDurationMinutes: 27,
        directionallyValid: true,
        pooledSolution: {
          poolId: "pool_demo_fleet",
          totalDemand: 300,
          totalAllocated: 300,
          fulfillmentPercentage: 100,
          isFullyFulfilled: true,
          vehicleCount: 3,
          totalPrice: 4250,
          dedicatedTripCost: 9500,
          totalSavings: 5250,
          savingsPercentage: 55,
          co2ReductionKg: 40.5,
          osmDistanceKm: 8.9,
          osmDurationMinutes: 27,
          routingSource: "OpenStreetMap (OSRM)",
          drivers: [
            {
              driverName: "Vikram Salvi",
              vehicleType: "Eicher Pro 2049 Light Truck",
              vehicleNumber: "MH-04-GZ-2309",
              availableCapacity: 140,
              allocatedUnits: 140,
              allocatedPrice: 1850,
              departureTime: "08:15",
              arrivalTime: "08:42",
            },
            {
              driverName: "Ganesh Shinde",
              vehicleType: "Tata 407 SFC LCV",
              vehicleNumber: "MH-03-CB-9140",
              availableCapacity: 100,
              allocatedUnits: 100,
              allocatedPrice: 1450,
              departureTime: "09:00",
              arrivalTime: "09:27",
            },
            {
              driverName: "Sunil Yadav",
              vehicleType: "Mahindra Bolero Maxi Truck",
              vehicleNumber: "MH-04-EK-7732",
              availableCapacity: 60,
              allocatedUnits: 60,
              allocatedPrice: 950,
              departureTime: "09:30",
              arrivalTime: "09:57",
            },
          ],
        },
      },
    ];
  }
}

export const mockStore = new MockStore();
