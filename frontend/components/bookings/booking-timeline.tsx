import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = { status: string; label: string };

/** Horizontal progress through an ordered list of statuses. */
export function StatusTimeline({ steps, current }: { steps: readonly Step[]; current: string }) {
  const cancelled = current === "cancelled";
  const index = steps.findIndex((step) => step.status === current);

  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const done = !cancelled && i <= index;
        const active = !cancelled && i === index;
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : done ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
                  active && "ring-4 ring-primary/15",
                )}
              >
                {done && !active ? <CheckIcon className="size-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "h-px flex-1",
                  i === steps.length - 1 ? "bg-transparent" : !cancelled && i < index ? "bg-primary" : "bg-border",
                )}
              />
            </div>
            <span className={cn("px-1 text-[11px] leading-tight", done ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
