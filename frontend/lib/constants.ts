export const VEHICLE_TYPES = [
  "Two-wheeler",
  "Three-wheeler",
  "Tata Ace / mini truck",
  "Pickup (Bolero / Dost)",
  "Tempo (407)",
  "Truck (14 ft+)",
];

export const PRICING_UNITS = [
  { value: "per_item_per_day", label: "Per item, per day" },
  { value: "per_day", label: "Per day (whole lot)" },
  { value: "per_hour", label: "Per hour" },
  { value: "per_item", label: "Per item (one-off)" },
  { value: "per_event", label: "Per event" },
];

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

/** Booking lifecycle, in order, for the status timeline. */
export const BOOKING_STEPS = [
  { status: "confirmed", label: "Confirmed" },
  { status: "driver_assigned", label: "Driver assigned" },
  { status: "picked_up", label: "Picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
  { status: "completed", label: "Completed" },
];

export const DELIVERY_STEPS = [
  { status: "pickup_pending", label: "Pickup pending" },
  { status: "picked_up", label: "Picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
] as const;
