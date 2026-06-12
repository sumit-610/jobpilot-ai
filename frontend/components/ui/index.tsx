import { cn } from "@/lib/utils";

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "orange";
const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-[#1A1A24] text-[#8B8BA8] border-[#2A2A38]",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger:  "bg-red-500/10  text-red-400  border-red-500/20",
  info:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  orange:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
      badgeStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4 opacity-60">{icon}</span>
      <p className="text-[#F0F0F5] font-semibold mb-2">{title}</p>
      <p className="text-[#8B8BA8] text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      {action}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5 hover:border-[#3A3A4E] transition-colors">
      <p className="text-[#8B8BA8] text-xs font-medium uppercase tracking-wider mb-3">{label}</p>
      <p className={cn("text-3xl font-bold tabular-nums mb-1", accent ?? "text-[#F0F0F5]")}>{value}</p>
      {sub && <p className="text-[#55556A] text-xs">{sub}</p>}
    </div>
  );
}
