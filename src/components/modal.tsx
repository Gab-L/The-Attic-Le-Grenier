"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current!;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = old;
      requestAnimationFrame(() => {
        const target =
          previous instanceof HTMLElement && previous.isConnected
            ? previous
            : document.querySelector("main");
        if (target instanceof HTMLElement) {
          if (target.tagName === "MAIN") target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={onClose}
    >
      <button
        className="icon-button close"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X size={22} />
      </button>
      {children}
    </dialog>
  );
}
