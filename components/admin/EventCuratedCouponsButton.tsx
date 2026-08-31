"use client";

import { useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Shuffle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import type { Event } from "@/types";

const ALL = "all";

export function EventCuratedCouponsButton({ events }: { events: Event[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(
    () => [
      { value: ALL, label: "All events" },
      ...events.map((event) => ({ value: event.id, label: event.name })),
    ],
    [events]
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEventId("");
      setError(null);
    }
  }

  async function handleApply() {
    if (!eventId) {
      setError("Please select an event.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/events/randomize-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to randomize curated coupons.");
      toast.success(
        `Randomized ${body.data.totalCoupons} curated coupon(s) across ${body.data.events} event(s).`
      );
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
      >
        <Shuffle className="h-4 w-4" />
        Curated Coupons
      </button>

      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Randomize curated coupons"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Event</label>
            <SingleSelectDropdown
              options={options}
              value={eventId}
              onChange={(value) => {
                setEventId(value);
                setError(null);
              }}
              placeholder="Select an event..."
              searchable
              searchPlaceholder="Search events..."
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          <p className="text-xs text-muted-500">
            Rebuilds the public &quot;Curated deals&quot; list from up to 20 of the event&apos;s own
            stores&apos; active coupons, picked and ordered at random. Doesn&apos;t change the
            Featured Coupons picked in the event form.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={submitting}>
            {submitting ? "Randomizing..." : "Randomize"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
