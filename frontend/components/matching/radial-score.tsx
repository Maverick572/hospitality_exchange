"use client";

type RadialScoreProps = {
  score?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

export function RadialScore({ score = 94, size = "md", label, className = "" }: RadialScoreProps) {
  const sizes = {
    sm: { radius: 32, stroke: 5, container: 76, fontSize: "text-lg" },
    md: { radius: 48, stroke: 7, container: 110, fontSize: "text-2xl" },
    lg: { radius: 64, stroke: 9, container: 148, fontSize: "text-4xl" },
  };

  const config = sizes[size] || sizes.md;
  const { radius, stroke, container, fontSize } = config;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: container, height: container }}>
        <svg className="size-full -rotate-90">
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            strokeWidth={stroke}
            className="stroke-muted fill-none"
          />
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            strokeWidth={stroke}
            className="stroke-primary fill-none transition-all duration-1000 ease-out"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className={`font-extrabold text-foreground ${fontSize} tracking-tight`}>
            {clampedScore}%
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest -mt-0.5">
            MATCH
          </span>
        </div>
      </div>

      {label && <span className="mt-2 text-xs font-semibold text-muted-foreground">{label}</span>}
    </div>
  );
}
