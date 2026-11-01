"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";

/**
 * An opened entry (or the entry being edited) as a window over the feed, as
 * wide as the frame — from the filters' left edge to sign-out (ADR-0006).
 * A click outside, Escape or ✕ go back to the same feed, at the same scroll.
 */
export function EntryOverlay({
  closeHref,
  label,
  children,
}: {
  closeHref: string;
  label: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) router.push(closeHref, { scroll: false });
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-[2px]" />
        {/* Between the header (3.5rem) and the footer links, with the frame's side padding. */}
        <Dialog.Popup
          aria-label={label}
          className="fixed inset-x-0 top-16 bottom-14 z-50 mx-auto w-full max-w-5xl px-4 outline-none"
        >
          <div className="h-full overflow-y-auto rounded-2xl">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
