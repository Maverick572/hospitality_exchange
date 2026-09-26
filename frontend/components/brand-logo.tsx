import * as React from "react";

import { cn } from "@/lib/utils";

// Brand mark: a gradient tile with two interlocking boxes — one business
// handing a resource to another. Scales with className (e.g. size-9).
export function BrandLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  // Gradient ids must be unique per instance (auth pages render the mark
  // twice); useId can emit colons, which break url(#…) references.
  const uid = React.useId().replace(/:/g, "");
  const base = `${uid}-base`;
  const shine = `${uid}-shine`;

  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect width="256" height="256" rx="56" fill={`url(#${base})`} />
      <rect width="256" height="256" rx="56" fill={`url(#${shine})`} fillOpacity="0.2" />
      <path
        d="M72 104 L120 80 L168 104 L168 152 L120 176 L72 152 Z"
        stroke="#FBFBFB"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <path d="M72 104 L120 128 L168 104 M120 128 L120 176" stroke="#FBFBFB" strokeWidth="12" strokeLinejoin="round" />
      <path
        d="M152 150 L184 134 L200 142"
        stroke="#FBFBFB"
        strokeOpacity="0.7"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={base} x1="128" y1="0" x2="128" y2="256" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C5ED1" />
          <stop offset="1" stopColor="#6355C9" />
        </linearGradient>
        <linearGradient id={shine} x1="128" y1="0" x2="128" y2="256" gradientUnits="userSpaceOnUse">
          <stop offset="0.33" stopColor="white" />
          <stop offset="1" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const BRAND_NAME = "Resource Exchange";
