"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Perspective = "seeker" | "provider";

type PerspectiveContextType = {
  perspective: Perspective;
  setPerspective: (p: Perspective) => void;
  togglePerspective: () => void;
};

const PerspectiveContext = createContext<PerspectiveContextType | undefined>(undefined);

export function PerspectiveProvider({ children }: { children: ReactNode }) {
  const [perspective, setPerspectiveState] = useState<Perspective>("seeker");

  useEffect(() => {
    const saved = localStorage.getItem("hrex_perspective");
    if (saved === "provider" || saved === "seeker") {
      setPerspectiveState(saved);
    }
  }, []);

  const setPerspective = (p: Perspective) => {
    setPerspectiveState(p);
    localStorage.setItem("hrex_perspective", p);
  };

  const togglePerspective = () => {
    const next = perspective === "seeker" ? "provider" : "seeker";
    setPerspective(next);
  };

  return (
    <PerspectiveContext.Provider value={{ perspective, setPerspective, togglePerspective }}>
      {children}
    </PerspectiveContext.Provider>
  );
}

export function usePerspective() {
  const ctx = useContext(PerspectiveContext);
  if (!ctx) {
    return {
      perspective: "seeker" as Perspective,
      setPerspective: () => {},
      togglePerspective: () => {},
    };
  }
  return ctx;
}
