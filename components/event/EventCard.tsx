import Image from "next/image";
import Link from "next/link";
import { renderIcon } from "@/lib/icons";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group overflow-hidden rounded-lg border border-muted-200 bg-surface-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      {event.bannerUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden">
          <Image
            src={event.bannerUrl}
            alt={event.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {renderIcon(event.iconName, "h-4 w-4 text-brand-600")}
          <h3 className="font-heading font-semibold text-brand-950">{event.name}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-600">{event.description}</p>
        <p className="mt-3 text-xs font-medium text-muted-500">
          {formatDate(event.startsAt)} – {formatDate(event.endsAt)}
        </p>
      </div>
    </Link>
  );
}
