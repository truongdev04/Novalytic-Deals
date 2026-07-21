"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function CouponControls({
  initialAutoCouponEnabled,
  initialLastRefreshedAt,
}: {
  initialAutoCouponEnabled: boolean;
  initialLastRefreshedAt: string | null;
}) {
  const router = useRouter();
  const [autoEnabled, setAutoEnabled] = useState(initialAutoCouponEnabled);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(initialLastRefreshedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/coupons/refresh", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to refresh coupons.");
      setLastRefreshedAt(body.data.lastRefreshedAt);
      toast.success("Coupons refreshed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh coupons.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleToggleAuto() {
    const next = !autoEnabled;
    setIsToggling(true);
    try {
      const res = await fetch("/api/admin/coupons/auto-coupon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update Auto Coupon.");
      }
      setAutoEnabled(next);
      toast.success(next ? "Auto Coupon enabled." : "Auto Coupon disabled.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update Auto Coupon.");
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
          <button
            type="button"
            role="switch"
            aria-checked={autoEnabled}
            aria-label="Auto Coupon"
            onClick={handleToggleAuto}
            disabled={isToggling}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-out disabled:opacity-50",
              autoEnabled ? "bg-brand-600" : "bg-muted-300"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-out",
                autoEnabled && "translate-x-4"
              )}
            />
          </button>
          Auto Coupon
        </label>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh Coupon"}
        </button>

        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Coupon
        </Link>
      </div>

      <p className="mt-2 text-xs text-muted-500">
        Coupons last refreshed:{" "}
        {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString() : "Never"}
      </p>
    </div>
  );
}
