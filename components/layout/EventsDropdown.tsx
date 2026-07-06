"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { renderCategoryIcon } from "@/lib/icons";
import type { Event } from "@/types";

export function EventsDropdown({ events }: { events: Event[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-700 hover:bg-surface-100 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        Event Sales
        <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-xl border border-muted-200 bg-surface-0 p-2 shadow-lg data-[state=open]:animate-fade-in"
        >
          {events.map((event) => (
            <DropdownMenu.Item key={event.id} asChild>
              <Link
                href={`/events/${event.slug}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-700 outline-none hover:bg-surface-100 hover:text-brand-800 focus:bg-surface-100"
              >
                <span className="relative flex h-4 w-4 items-center justify-center overflow-hidden text-brand-600">
                  {renderCategoryIcon(event, { iconClassName: "h-4 w-4" })}
                </span>
                {event.name}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
