"use client";

import { useEffect, useId, useRef, useState } from "react";

export function InfoPopover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return <span ref={rootRef} className="info-popover-root">
    <button type="button" className="info-popover-trigger" aria-label={label} aria-expanded={open} aria-controls={id} onClick={event => { event.stopPropagation(); setOpen(value => !value); }}>i</button>
    {open && <span id={id} role="tooltip" className="info-popover-panel">{children}</span>}
  </span>;
}
