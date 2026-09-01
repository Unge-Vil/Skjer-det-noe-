"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "./LocationProvider";

/**
 * Re-renders the current server route when the cookie-backed area preference
 * changes, so server-rendered pages (e.g. the landing page) reflect the chosen
 * municipality without a manual reload. Skips the initial mount.
 */
export function LocationRefresh() {
  const { mode, selectedMunicipality, defaultMunicipality } = useLocation();
  const router = useRouter();
  const key = `${mode}|${selectedMunicipality ?? ""}|${defaultMunicipality ?? ""}`;
  const previous = useRef(key);

  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    router.refresh();
  }, [key, router]);

  return null;
}
