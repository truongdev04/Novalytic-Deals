"use client";

import { useState } from "react";
import { Link } from "next-view-transitions";
import * as Dialog from "@radix-ui/react-dialog";
import * as Accordion from "@radix-ui/react-accordion";
import { Menu, X, ChevronDown } from "lucide-react";
import { renderCategoryIcon } from "@/lib/icons";
import type { Event } from "@/types";

const navLinks = [
  { name: "Stores", href: "/stores" },
  { name: "Deals", href: "/deals" },
  { name: "Blog", href: "/blog" },
];

export function MobileNav({ events }: { events: Event[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-brand-900 hover:bg-surface-100 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Menu className="h-6 w-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-950/50 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-surface-0 p-5 shadow-lg lg:hidden">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="font-heading text-lg font-semibold text-brand-950">
              Menu
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-500 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-900 hover:bg-surface-100"
              >
                {link.name}
              </Link>
            ))}

            <Accordion.Root type="single" collapsible>
              <Accordion.Item value="events">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-900 hover:bg-surface-100">
                    Event Sales
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="pl-3 data-[state=open]:animate-fade-in">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-700 hover:bg-surface-100 hover:text-brand-800"
                    >
                      <span className="relative flex h-4 w-4 items-center justify-center overflow-hidden text-brand-600">
                        {renderCategoryIcon(event, { iconClassName: "h-4 w-4" })}
                      </span>
                      {event.name}
                    </Link>
                  ))}
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
