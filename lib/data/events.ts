import { unstable_cache } from "next/cache";
import eventsData from "@/data/events.json";
import type { Event } from "@/types";

const allEvents = eventsData as Event[];

export const getEvents = unstable_cache(
  async (): Promise<Event[]> =>
    [...allEvents].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    ),
  ["events:list"],
  { tags: ["events:list"], revalidate: 300 }
);

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  return unstable_cache(
    async () => allEvents.find((e) => e.slug === slug),
    [`event:${slug}`],
    { tags: [`event:${slug}`], revalidate: 300 }
  )();
}
