import type { PayloadPageDoc } from "./api-client";

export type PageStatusLabel =
  | "Draft"
  | "Published"
  | "Changes pending";

export function pageStatusLabel(
  p: Pick<PayloadPageDoc, "status" | "publishedAt" | "updatedAt">,
): PageStatusLabel {
  if (p.status === "draft") return "Draft";
  if (
    p.publishedAt &&
    Date.parse(p.updatedAt) - Date.parse(p.publishedAt) > 1000
  ) {
    return "Changes pending";
  }
  return "Published";
}

export function statusColor(label: PageStatusLabel): string {
  if (label === "Draft") return "bg-slate-100 text-slate-600";
  if (label === "Changes pending") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
