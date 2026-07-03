import Link from "next/link";
import { Plus } from "lucide-react";
import { getEvents } from "@/lib/data";
import { EventTable } from "@/components/admin/EventTable";

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Events</h1>
          <p className="mt-1 text-sm text-muted-500">{events.length} events.</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Link>
      </div>

      <div className="mt-6">
        <EventTable events={events} />
      </div>
    </div>
  );
}
