"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DashboardRange } from "@/lib/data/admin/analytics";

const OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7d", label: "7 ngày qua" },
  { value: "month", label: "Tháng này" },
  { value: "custom", label: "Chọn khoảng thời gian" },
  { value: "all", label: "Từ trước đến nay" },
];

export function DashboardRangePicker({ current, from, to }: { current: DashboardRange; from?: string; to?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  function applyRange(range: DashboardRange, nextFrom?: string, nextTo?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    if (range === "custom") {
      if (nextFrom) params.set("from", nextFrom);
      else params.delete("from");
      if (nextTo) params.set("to", nextTo);
      else params.delete("to");
    } else {
      params.delete("from");
      params.delete("to");
    }
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={current}
        onChange={(e) => applyRange(e.target.value as DashboardRange, customFrom, customTo)}
        className="rounded-lg border border-muted-200 bg-surface-0 px-3 py-1.5 text-sm text-brand-950 focus:border-brand-400 focus:outline-none"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {current === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-muted-200 bg-surface-0 px-2 py-1.5 text-sm text-brand-950 focus:border-brand-400 focus:outline-none"
          />
          <span className="text-sm text-muted-500">đến</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-muted-200 bg-surface-0 px-2 py-1.5 text-sm text-brand-950 focus:border-brand-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => applyRange("custom", customFrom, customTo)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
}
