"use client";

import { useEffect, useState } from "react";

/**
 * Revela `text` letra por letra. Con movimiento reducido aparece completo.
 * Devuelve cuántos caracteres mostrar.
 */
export function useTypewriter(text: string, msPerChar = 28): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de window.matchMedia
      setShown(text.length);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar]);

  return shown;
}
