"use client";

import { useSyncExternalStore } from "react";

/**
 * Suscribe a una media query. En el servidor (y en la hidratación) devuelve
 * `serverValue` para no desfasar el HTML; en el cliente se actualiza solo.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
