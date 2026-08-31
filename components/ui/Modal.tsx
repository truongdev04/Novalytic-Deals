"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Radix dismisses the dialog on any pointer-down outside <Dialog.Content>.
// A custom dropdown/menu that portals its panel to <body> (so it can spill
// past the dialog's own scroll box) counts as "outside" — mark that panel
// with `data-modal-popover` and interactions with it won't close the dialog.
function isInsideModalPopover(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-modal-popover]"));
}

export function Modal({ open, onOpenChange, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/50 p-4 data-[state=open]:animate-fade-in">
          <Dialog.Content
            onPointerDownOutside={(event) => {
              if (isInsideModalPopover(event.detail.originalEvent.target)) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (isInsideModalPopover(event.detail.originalEvent.target)) event.preventDefault();
            }}
            className={cn(
              "relative z-50 flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-xl bg-surface-0 p-6 shadow-lg focus:outline-none data-[state=open]:animate-fade-in",
              className
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              {title ? (
                <Dialog.Title className="font-heading text-lg font-semibold text-brand-950">
                  {title}
                </Dialog.Title>
              ) : (
                <Dialog.Title className="sr-only">Dialog</Dialog.Title>
              )}
              <Dialog.Close
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-500 hover:bg-surface-100 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
