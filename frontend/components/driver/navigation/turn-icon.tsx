"use client";

import React from "react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CompassIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  GitForkIcon,
  RotateCcwIcon,
} from "lucide-react";

type Props = {
  maneuver: string;
  modifier?: string;
  className?: string;
};

export function TurnIcon({ maneuver, modifier, className = "size-7" }: Props) {
  const normModifier = (modifier || "").toLowerCase();
  const normManeuver = (maneuver || "").toLowerCase();

  if (normManeuver === "arrive") {
    return <CheckCircle2Icon className={className} />;
  }

  if (normManeuver === "depart") {
    return <CompassIcon className={className} />;
  }

  if (normManeuver.includes("roundabout") || normManeuver.includes("rotary")) {
    return <RotateCcwIcon className={className} />;
  }

  if (normManeuver.includes("fork") || normManeuver.includes("merge")) {
    return <GitForkIcon className={className} />;
  }

  if (normModifier === "left") {
    return <CornerUpLeftIcon className={className} />;
  }

  if (normModifier === "right") {
    return <CornerUpRightIcon className={className} />;
  }

  if (normModifier.includes("sharp left")) {
    return <ArrowLeftIcon className={className} />;
  }

  if (normModifier.includes("sharp right")) {
    return <ArrowRightIcon className={className} />;
  }

  if (normModifier.includes("slight left")) {
    return <ArrowUpLeftIcon className={className} />;
  }

  if (normModifier.includes("slight right")) {
    return <ArrowUpRightIcon className={className} />;
  }

  if (normModifier.includes("uturn")) {
    return <RotateCcwIcon className={className} />;
  }

  // Default straight
  return <ArrowUpIcon className={className} />;
}
