"use client";

import { useMemo, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import type { Event } from "@/types";

type Action = "add" | "reset";

const ACTION_OPTIONS = [
  { value: "add", label: "Add stores to event" },
  { value: "reset", label: "Reset stores from event" },
];

export function EventBulkStoresButton({ events }: { events: Event[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action>("add");
  const [eventId, setEventId] = useState("");
  const [count, setCount] = useState("");
  const [resetAll, setResetAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eventOptions = useMemo(
    () => events.map((event) => ({ value: event.id, label: event.name })),
    [events]
  );
  const selectedEvent = events.find((event) => event.id === eventId);
  const currentStoreCount = selectedEvent?.featuredStoreIds.length ?? 0;

  function reset() {
    setAction("add");
    setEventId("");
    setCount("");
    setResetAll(false);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleApply() {
    setError(null);

    if (!eventId) {
      setError("Please select an event.");
      return;
    }

    const parsedCount = Number(count);
    if (action === "reset" && resetAll) {
      // No quantity to validate — resetting every store currently in the event.
    } else if (!count.trim() || !Number.isInteger(parsedCount) || parsedCount < 1) {
      setError("Enter a whole number of at least 1.");
      return;
    } else if (action === "reset" && parsedCount > currentStoreCount) {
      setError(
        `Reset quantity exceeds available stores. Currently in this event: ${currentStoreCount}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      if (action === "add") {
        const res = await fetch("/api/admin/events/bulk-assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, count: parsedCount }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error ?? "Failed to add stores to event.");
        toast.success(`Added ${body.data.assigned} store(s) to "${selectedEvent?.name}".`);
      } else {
        const res = await fetch("/api/admin/events/bulk-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, all: resetAll, count: resetAll ? undefined : parsedCount }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          setError(body?.error ?? "Failed to reset stores from event.");
          return;
        }
        toast.success(`Reset ${body.data.reset} store(s) from "${selectedEvent?.name}".`);
      }
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
        <Users className="h-4 w-4" />
        Bulk Stores
      </button>

      <Modal open={open} onOpenChange={handleOpenChange} title="Bulk Stores" className="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Action</label>
            <SingleSelectDropdown
              options={ACTION_OPTIONS}
              value={action}
              onChange={(value) => {
                setAction(value as Action);
                setError(null);
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Event</label>
            <SingleSelectDropdown
              options={eventOptions}
              value={eventId}
              onChange={(value) => {
                setEventId(value);
                setError(null);
              }}
              placeholder="Select an event..."
              searchable
              searchPlaceholder="Search events..."
            />
          </div>

          {!(action === "reset" && resetAll) && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">
                Number of stores to {action === "add" ? "add" : "reset"}
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={count}
                onChange={(e) => {
                  setCount(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              {action === "reset" && eventId && (
                <p className="mt-1 text-xs text-muted-500">
                  Currently in this event: {currentStoreCount} store(s).
                </p>
              )}
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          )}

          {action === "reset" && (
            <label className="flex items-center gap-2 text-sm text-brand-950">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={resetAll}
                onChange={(e) => {
                  setResetAll(e.target.checked);
                  setError(null);
                }}
              />
              Reset all stores currently in this event
            </label>
          )}
          {action === "reset" && resetAll && error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <p className="text-xs text-muted-500">
            {action === "add"
              ? "Picks random active stores that aren't in any event yet. Adds are cumulative — running this again adds more on top."
              : "Picks random stores currently in this event, clears their event, and removes their coupons from it."}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={submitting}>
            {submitting ? "Applying..." : "Apply"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
