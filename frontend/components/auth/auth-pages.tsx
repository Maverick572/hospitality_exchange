import { AuthForm } from "./auth-form";
import { AuthSplit } from "./auth-split";

// Left-panel copy for each auth screen, kept together so the four pages read
// as one flow.

export function BusinessLoginPage() {
  return (
    <AuthSplit
      heading="Put idle inventory to work, or find what you need by tomorrow."
      subheading="List spare chairs, AV gear and kitchen equipment, or describe what you're short of and get ranked matches from nearby businesses."
      previewTitle="Your business workspace"
      steps={[
        { title: "Search the marketplace", description: "Plain-language requests, ranked matches", tag: "Seek", active: true },
        { title: "List your resources", description: "Earn from what sits unused", tag: "Provide" },
        { title: "Escrow-protected bookings", description: "Paid out once delivery is confirmed", tag: "Book" },
      ]}
    >
      <AuthForm mode="login" audience="business" />
    </AuthSplit>
  );
}

export function BusinessSignupPage() {
  return (
    <AuthSplit
      heading="Start with your login, then tell us about your business."
      subheading="One account lets you both rent out resources and request them, whichever you need that week."
      previewTitle="Getting set up"
      steps={[
        { title: "Create your login", description: "Email or Google", tag: "Step 1", active: true },
        { title: "Business profile", description: "Name, phone and location for matching", tag: "Step 2" },
      ]}
    >
      <AuthForm mode="signup" audience="business" />
    </AuthSplit>
  );
}

export function DriverLoginPage() {
  return (
    <AuthSplit
      heading="Earn from the space left in your vehicle."
      subheading="Publish the routes you're already driving. We match you with deliveries that fit along the way."
      previewTitle="Driver workspace"
      steps={[
        { title: "Publish a route", description: "From, to, stops and spare capacity", tag: "Plan", active: true },
        { title: "Accept matched deliveries", description: "Jobs close to your route", tag: "Match" },
        { title: "Get paid on delivery", description: "Released from escrow", tag: "Earn" },
      ]}
    >
      <AuthForm mode="login" audience="driver" />
    </AuthSplit>
  );
}

export function DriverSignupPage() {
  return (
    <AuthSplit
      heading="Create your login, then register your vehicle."
      subheading="Vehicle type and capacity decide which deliveries we match to your routes."
      previewTitle="Getting on the road"
      steps={[
        { title: "Create your login", description: "Email or Google", tag: "Step 1", active: true },
        { title: "Vehicle details", description: "Type, number and capacity", tag: "Step 2" },
      ]}
    >
      <AuthForm mode="signup" audience="driver" />
    </AuthSplit>
  );
}
