"use client";

import { useCallback, useRef, useState } from "react";

export interface UseAuthModal {
  isOpen: boolean;
  openModal: (trigger?: HTMLElement | null) => void;
  closeModal: () => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

/**
 * Modal open/close state plus tracking of the element that opened it, so focus
 * can be restored on close (Requirements 10.10, 15.5).
 */
export function useAuthModal(): UseAuthModal {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) triggerRef.current = trigger;
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    const trigger = triggerRef.current;
    if (trigger) {
      // Restore focus to the control that opened the modal.
      requestAnimationFrame(() => trigger.focus());
    }
  }, []);

  return { isOpen, openModal, closeModal, triggerRef };
}
