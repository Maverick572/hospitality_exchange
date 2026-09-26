"use client";

type ScoreItem = {
  label: string;
  score: number;
};

type ScoreBreakdownProps = {
  breakdown?: Record<string, number>;
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const defaultItems: ScoreItem[] = [
    { label: "Resource Fit", score: breakdown?.resourceFit ?? 98 },
    { label: "Availability", score: breakdown?.availability ?? 100 },
    { label: "Price Fit", score: breakdown?.price ?? 91 },
    { label: "Logistics Fit", score: breakdown?.logistics ?? 96 },
    { label: "Distance", score: breakdown?.distance ?? 87 },
    { label: "Reliability", score: breakdown?.reliability ?? 94 },
  ];

  return (
    <div className="space-y-2.5 w-full">
      {defaultItems.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="text-foreground font-bold">{item.score}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
