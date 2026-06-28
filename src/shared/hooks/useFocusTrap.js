import { useEffect, useCallback } from "react";

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const useFocusTrap = function(ref, { isActive = true, onEscape, initialFocusSelector = "button" } = {}) {
  useEffect(() => {
    if (!isActive) return;
    const previousFocus = document.activeElement;
    const timerId = setTimeout(() => {
      ref.current?.querySelector(initialFocusSelector)?.focus();
    }, 0);
    return () => {
      clearTimeout(timerId);
      if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
    };
  }, [ref, isActive, initialFocusSelector]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") { onEscape?.(); return; }
    if (e.key !== "Tab" || !ref.current) return;
    const focusables = Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTOR));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [ref, onEscape]);

  return handleKeyDown;
};

export default useFocusTrap;
