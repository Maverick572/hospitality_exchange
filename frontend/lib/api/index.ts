// One service object per backend area, following section 24 of
// frontendAPI.md. Every call resolves to the envelope's `data`.

import { api } from "./client";
import type {
  AppNotification,
  Booking,
  Category,
  ConditionEvidence,
  CounterInput,
  CreateRequestInput,
  DeliveryOpportunity,
  DeliveryStatus,
  DriverDashboard,
  DriverProfile,
  DriverProfileInput,
  DriverRoute,
  DriverRouteInput,
  Escrow,
  EvidenceInput,
  GeoLocation,
  ParsedItem,
  Requirement,
  RequirementInput,
  Resource,
  ResourceInput,
  ResourceRequest,
  ReviewSummary,
  RouteMatch,
  SearchInput,
  SearchResult,
  UserDashboard,
  UserProfile,
  UserProfileInput,
} from "@/lib/types";

export { ApiError, API_BASE_URL } from "./client";

export const usersApi = {
  getMe: () => api.get<UserProfile>("/users/me"),
  createProfile: (data: UserProfileInput) => api.post<UserProfile>("/users/profile", data),
  updateMe: (data: Partial<UserProfileInput>) => api.patch<UserProfile>("/users/me", data),
};

export const categoriesApi = {
  list: async () => (await api.get<{ categories: Category[] }>("/categories")).categories,
};

export const resourcesApi = {
  create: (data: ResourceInput) => api.post<Resource>("/resources", data),
  getMine: (status?: string) => api.get<Resource[]>("/resources/my", { status }),
  getById: (id: string) => api.get<Resource>(`/resources/${id}`),
  update: (id: string, data: Partial<ResourceInput>) => api.patch<Resource>(`/resources/${id}`, data),
  remove: (id: string) => api.delete<unknown>(`/resources/${id}`),
};

export const requirementsApi = {
  create: (data: RequirementInput) => api.post<Requirement>("/requirements", data),
  getMine: () => api.get<Requirement[]>("/requirements/my"),
  getById: (id: string) => api.get<Requirement>(`/requirements/${id}`),
  update: (id: string, data: Partial<RequirementInput>) =>
    api.patch<Requirement>(`/requirements/${id}`, data),
  cancel: (id: string) => api.delete<unknown>(`/requirements/${id}`),
  parse: (description: string) =>
    api.post<{ description: string; items: ParsedItem[] }>("/requirements/parse", { description }),
};

export const seekerApi = {
  search: (data: SearchInput) => api.post<SearchResult>("/seeker/search", data),
};

export const logisticsApi = {
  matchRoutes: (data: {
    pickupLocation: Partial<GeoLocation>;
    deliveryLocation: Partial<GeoLocation>;
    requiredCapacity: number;
    travelDate?: string | null;
  }) => api.post<RouteMatch[]>("/logistics/match-routes", data),
};

export const requestsApi = {
  create: (data: CreateRequestInput) => api.post<ResourceRequest>("/requests", data),
  getProviderRequests: (status?: string) =>
    api.get<ResourceRequest[]>("/requests/provider", { status }),
  counter: (id: string, data: CounterInput) => api.post<unknown>(`/requests/${id}/counter`, data),
  accept: (id: string) =>
    api.post<{ requestId: string; status: string; bookingId: string }>(`/requests/${id}/accept`),
  reject: (id: string, reason?: string) => api.post<unknown>(`/requests/${id}/reject`, { reason }),
};

export const bookingsApi = {
  getMine: (params?: { status?: string; role?: "seeker" | "provider" | "driver" }) =>
    api.get<Booking[]>("/bookings/my", params),
  getById: (id: string) => api.get<Booking>(`/bookings/${id}`),
  confirmReceipt: (
    id: string,
    data: { received: boolean; conditionConfirmed: boolean; notes?: string },
  ) => api.post<unknown>(`/bookings/${id}/confirm-receipt`, data),
};

export const escrowApi = {
  create: (bookingId: string) => api.post<Escrow>("/escrow", { bookingId }),
  get: (id: string) => api.get<Escrow>(`/escrow/${id}`),
  fund: (id: string, paymentReference: string) =>
    api.post<Escrow>(`/escrow/${id}/fund`, { paymentReference }),
  release: (id: string, data?: { penaltyAmount?: number; reason?: string }) =>
    api.post<Escrow>(`/escrow/${id}/release`, data ?? {}),
};

export const evidenceApi = {
  create: (data: EvidenceInput) => api.post<ConditionEvidence>("/condition-evidence", data),
};

export const reviewsApi = {
  create: (data: { bookingId: string; providerId: string; rating: number; comment: string }) =>
    api.post<unknown>("/reviews", data),
  getForUser: (userId: string) => api.get<ReviewSummary>(`/users/${userId}/reviews`),
};

export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>("/notifications"),
  markRead: (id: string) => api.patch<unknown>(`/notifications/${id}/read`),
};

export const dashboardApi = {
  getUserDashboard: () => api.get<UserDashboard>("/dashboard/user"),
  getDriverDashboard: () => api.get<DriverDashboard>("/dashboard/driver"),
};

export const driversApi = {
  authStatus: () =>
    api.get<{ uid: string; hasDriverProfile: boolean; verificationStatus: string | null }>(
      "/drivers/auth/status",
    ),
  createProfile: (data: DriverProfileInput) => api.post<DriverProfile>("/drivers/profile", data),
  getMe: () => api.get<DriverProfile>("/drivers/me"),
};

export const routesApi = {
  create: (data: DriverRouteInput) => api.post<DriverRoute>("/driver-routes", data),
  getMine: () => api.get<DriverRoute[]>("/driver-routes/my"),
  update: (id: string, data: Partial<DriverRouteInput>) =>
    api.patch<DriverRoute>(`/driver-routes/${id}`, data),
  remove: (id: string) => api.delete<unknown>(`/driver-routes/${id}`),
  getMatches: (id: string) => api.get<DeliveryOpportunity[]>(`/driver-routes/${id}/matches`),
};

export const deliveriesApi = {
  accept: (id: string) => api.post<unknown>(`/delivery-requests/${id}/accept`),
  updateStatus: (id: string, status: DeliveryStatus) =>
    api.patch<unknown>(`/delivery-requests/${id}/status`, { status }),
};
