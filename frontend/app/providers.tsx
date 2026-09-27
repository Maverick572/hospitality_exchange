"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { PerspectiveProvider } from "@/lib/perspective";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The landing page carries its own dark palette (.landing in globals.css);
  // the app itself defaults to dark and follows the person's own choice after that.
  const forcedTheme = pathname === "/" ? "dark" : undefined;

  return (
    <AuthProvider>
      <PerspectiveProvider>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            forcedTheme={forcedTheme}
            enableColorScheme
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </TooltipProvider>
      </PerspectiveProvider>
    </AuthProvider>
  );
}
