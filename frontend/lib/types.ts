// Shapes returned by the FastAPI backend (see backend/backendAPI.md and
// schema.txt). Fields the backend may omit are optional.

export type GeoLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

export type UserProfile = {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  location: GeoLocation | null;
  profileImage?: string | null;
  rating: number;
  totalRatings: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UserProfileInput = {
  name: string;
  phone: string;
  businessName: string;
  location: GeoLocation | null;
  profileImage?: string | null;
};

export type DriverProfile = {
  driverId: string;
  name: string;
  email?: string | null;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  capacity: number;
  licenseNumber?: string | null;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  rating: number;
  totalRatings: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type DriverProfileInput = {
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  capacity: number;
  licenseNumber?: string | null;
};

export type Category = {
  id: string;
  label: string;
  evidenceType: "photo" | "video" | string;
  defaultMetric: string;
  keywords: string[];
};

export type AvailabilitySlot = { date: string; quantity: number };

export type Resource = {
  resourceId: string;
  providerId?: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  availableQuantity?: number;
  price: number;
  pricingUnit: string;
  location?: GeoLocation | null;
  availability?: AvailabilitySlot[];
  images?: string[];
  condition?: string;
  status: string;
  provider?: ProviderSummary;
  createdAt?: string;
  updatedAt?: string;
};

export type ResourceInput = {
  name: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  pricingUnit: string;
  location: GeoLocation | null;
  availability: AvailabilitySlot[];
  condition: string;
  images: string[];
};

export type ParsedItem = {
  category: string;
  name: string;
  quantity: number;
  metric: string;
};

export type Requirement = {
  requirementId: string;
  seekerId?: string;
  description: string;
  items?: ParsedItem[];
  location?: GeoLocation | null;
  requiredDate?: string;
  startTime?: string;
  endTime?: string;
  budget?: number;
  deliveryRequired?: boolean;
  status: string;
  createdAt?: string;
};

export type RequirementInput = {
  description: string;
  location: GeoLocation | null;
  requiredDate: string;
  startTime: string;
  endTime: string;
  budget: number | null;
  deliveryRequired: boolean;
};

export type ProviderSummary = {
  providerId: string;
  name?: string | null;
  businessName: string;
  email?: string | null;
  phone?: string | null;
  rating: number;
  totalRatings?: number;
  location?: Partial<GeoLocation>;
};

export type SearchProduct = {
  productId: string;
  resourceId: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  availableQuantity: number;
  price: number;
  pricingUnit: string;
  location: Partial<GeoLocation> | null;
  condition: string;
  images: string[];
  status: string;
  availability: AvailabilitySlot[];
  provider: ProviderSummary;
  distanceKm: number | null;
  availabilityScore: number;
  availableForRequestedPeriod: boolean;
  matchedItem: {
    name: string;
    category: string;
    requestedQuantity: number;
    metric: string;
  };
};

export type SearchResult = {
  description: string;
  fromTimestamp: string | null;
  toTimestamp: string | null;
  parsedItems: ParsedItem[];
  products: SearchProduct[];
  totalMatches: number;
};

export type SearchInput = {
  description: string;
  fromTimestamp?: string | null;
  toTimestamp?: string | null;
  location?: GeoLocation | null;
};

export type RequestStatus = "pending" | "countered" | "accepted" | "rejected" | string;

export type ResourceRequest = {
  requestId: string;
  requirementId?: string | null;
  seekerId: string;
  providerId: string;
  resourceId: string;
  requestedQuantity: number;
  offeredPrice: number;
  counterPrice: number | null;
  message: string;
  status: RequestStatus;
  bookingId?: string;
  seeker?: { userId: string; businessName: string };
  resource?: { resourceId: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type CreateRequestInput = {
  requirementId?: string | null;
  providerId: string;
  resourceId: string;
  requestedQuantity: number;
  offeredPrice: number;
  message: string;
};

export type CounterInput = { price: number; quantity: number; message: string };

export type BookingStatus =
  | "confirmed"
  | "driver_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | string;

export type ConditionEvidence = {
  evidenceId: string;
  bookingId: string;
  stage: "PICKUP" | "DELIVERY" | string;
  type: string;
  imageUrl: string;
  mediaType?: string;
  description?: string;
  uploadedBy?: string;
  createdAt?: string;
};

export type Booking = {
  bookingId: string;
  seekerId: string;
  providerId: string;
  resourceId: string;
  driverId: string | null;
  requirementId?: string | null;
  quantity: number;
  resourceAmount: number;
  deliveryAmount: number;
  depositAmount: number;
  totalAmount: number;
  pickupLocation?: Partial<GeoLocation> | null;
  deliveryLocation?: Partial<GeoLocation> | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  status: BookingStatus;
  escrowStatus?: string;
  escrowId?: string;
  evidence?: ConditionEvidence[];
  createdAt: string;
  updatedAt: string;
};

export type Escrow = {
  escrowId: string;
  bookingId: string;
  seekerId?: string;
  providerId?: string;
  driverId?: string | null;
  amount: number;
  depositAmount: number;
  penaltyAmount?: number;
  providerAmount?: number;
  driverAmount?: number;
  paymentReference?: string | null;
  status: "pending" | "funded" | "delivered" | "released" | "refunded" | string;
  createdAt?: string;
  fundedAt?: string | null;
  releasedAt?: string | null;
};

export type EvidenceInput = {
  bookingId: string;
  stage: "PICKUP" | "DELIVERY";
  type: string;
  imageUrl: string;
  mediaType?: "photo" | "video";
  description: string;
};

export type Review = {
  reviewId: string;
  bookingId: string;
  providerId: string;
  reviewerId?: string;
  reviewerName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
};

export type ReviewSummary = {
  rating: number;
  totalRatings: number;
  reviews: Review[];
};

export type AppNotification = {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  read: boolean;
  createdAt: string;
};

export type UserDashboard = {
  activeResources: number;
  activeRequirements: number;
  pendingRequests: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  pendingPayments: number;
};

export type DriverDashboard = {
  activeRoutes: number;
  matchedRequests: number;
  activeDeliveries: number;
  completedDeliveries: number;
  totalEarnings: number;
  pendingPayments: number;
};

export type DriverRoute = {
  routeId: string;
  driverId: string;
  startLocation: GeoLocation;
  destination: GeoLocation;
  stops: GeoLocation[];
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  availableCapacity: number;
  price: number;
  status: "active" | "inactive" | string;
  createdAt?: string;
  updatedAt?: string;
};

export type DriverRouteInput = {
  startLocation: GeoLocation;
  destination: GeoLocation;
  stops: GeoLocation[];
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  availableCapacity: number;
  price: number;
};

export type DeliveryOpportunity = {
  deliveryRequestId: string;
  bookingId?: string;
  pickupLocation: Partial<GeoLocation>;
  deliveryLocation: Partial<GeoLocation>;
  requiredCapacity: number;
  compatibility?: string;
  estimatedEarnings?: number;
  pickupDetourKm?: number;
  deliveryDetourKm?: number;
  status?: string;
};

// Mirrors backend/logistics/matcher.py find_best_routes().
export type RouteMatch = {
  routeId: string;
  driver: {
    driverId: string;
    name?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    capacity?: number;
    rating?: number;
    totalRatings?: number;
  };
  startLocation: GeoLocation;
  destination: GeoLocation;
  stops: GeoLocation[];
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  availableCapacity: number;
  price: number;
  pickup_detour_km: number;
  delivery_detour_km: number;
  total_detour_km: number;
  excess_capacity: number;
  directionallyValid: boolean;
};

export type DeliveryStatus = "pickup_pending" | "picked_up" | "in_transit" | "delivered";
