import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = Omit<ComponentProps<typeof Card>, "title"> & {
  title: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  labelClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
};

function ChartCard({
  title,
  icon: Icon,
  action,
  header,
  children,
  footer,
  className,
  labelClassName,
  panelClassName,
  headerClassName,
  contentClassName,
  ...props
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:border-foreground/20",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3",
          labelClassName,
        )}
      >
        <span className="flex items-center gap-2">
          {Icon ? (
            <Icon className="size-4 text-primary" aria-hidden="true" />
          ) : null}
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</span>
        </span>
        {action}
      </div>

      <div className={cn("overflow-hidden", panelClassName)}>
        {header ? (
          <CardHeader className={cn("px-5 pb-2 pt-4", headerClassName)}>
            {header}
          </CardHeader>
        ) : null}
        <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
        {footer}
      </div>
    </Card>
  );
}

export { ChartCard };
