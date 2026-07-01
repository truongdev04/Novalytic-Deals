"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FAQAccordion({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-muted-200">
      {items.map((item, index) => (
        <Accordion.Item key={index} value={`item-${index}`} className="py-1">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left font-heading font-medium text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
              {item.question}
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden pb-4 text-sm leading-relaxed text-muted-600 data-[state=open]:animate-fade-in">
            {item.answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
