import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

/** Small "View all" link used in the corner of ChartCard panels. */
export function PanelLink({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowUpRightIcon className="size-3" />
    </Link>
  );
}
