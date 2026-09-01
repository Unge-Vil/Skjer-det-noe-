"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Municipality } from "@/lib/types";
import { DEFAULT_RADIUS_M } from "@/lib/listings";
import {
  LOCATION_COOKIE,
  LOCATION_COOKIE_MAX_AGE,
  type Coordinates,
  type LocationMode,
  type LocationPreferences,
} from "@/lib/location";

interface LocationValue extends LocationPreferences {
  municipalities: Municipality[];
  coordinates: Coordinates | null;
  currentMunicipality: Municipality | null;
  locating: boolean;
  error: string | null;
  radiusM: number;
  setRadiusM: (meters: number) => void;
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  requestLocation: () => void;
  setMode: (mode: LocationMode) => void;
  selectMunicipality: (kommunenummer: string) => void;
  setDefaultMunicipality: (kommunenummer: string | null) => void;
  markPrimerSeen: () => void;
}

const LocationContext = createContext<LocationValue | null>(null);

function persist(preferences: LocationPreferences) {
  document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; Max-Age=${LOCATION_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function LocationProvider({
  initialPreferences,
  municipalities,
  children,
}: {
  initialPreferences: LocationPreferences;
  municipalities: Municipality[];
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [currentMunicipality, setCurrentMunicipality] = useState<Municipality | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [menuOpen, setMenuOpen] = useState(false);

  const updatePreferences = useCallback((update: (current: LocationPreferences) => LocationPreferences) => {
    setPreferences((current) => {
      const next = update(current);
      persist(next);
      return next;
    });
  }, []);

  const resolveMunicipality = useCallback(async (position: Coordinates) => {
    try {
      const params = new URLSearchParams({ lat: String(position.lat), lng: String(position.lng) });
      const response = await fetch(`/api/location/municipality?${params}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as { kommunenummer?: string; name?: string; county?: string | null };
      if (!result.kommunenummer || !result.name) return;
      setCurrentMunicipality(
        municipalities.find((municipality) => municipality.kommunenummer === result.kommunenummer) ?? {
          id: "",
          kommunenummer: result.kommunenummer,
          name: result.name,
          county: result.county ?? null,
          slug: "",
          lat: null,
          lng: null,
        },
      );
    } catch {
      setCurrentMunicipality(null);
    }
  }, [municipalities]);

  const requestLocation = useCallback(() => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Posisjon støttes ikke i denne nettleseren.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoordinates(next);
        setLocating(false);
        updatePreferences((current) => ({ ...current, mode: "nearby" }));
        void resolveMunicipality(next);
      },
      () => {
        setLocating(false);
        setError("Fikk ikke tilgang til posisjonen din.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [resolveMunicipality, updatePreferences]);

  useEffect(() => {
    if (preferences.mode !== "nearby" || !("permissions" in navigator)) return;
    void navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (permission.state === "granted") requestLocation();
      })
      .catch(() => undefined);
  }, [preferences.mode, requestLocation]);

  const setMode = useCallback((mode: LocationMode) => {
    updatePreferences((current) => ({ ...current, mode }));
  }, [updatePreferences]);

  const selectMunicipality = useCallback((kommunenummer: string) => {
    if (!municipalities.some((municipality) => municipality.kommunenummer === kommunenummer)) return;
    updatePreferences((current) => ({
      ...current,
      mode: "municipality",
      selectedMunicipality: kommunenummer,
    }));
  }, [municipalities, updatePreferences]);

  const setDefaultMunicipality = useCallback((kommunenummer: string | null) => {
    updatePreferences((current) => ({ ...current, defaultMunicipality: kommunenummer }));
  }, [updatePreferences]);

  const markPrimerSeen = useCallback(() => {
    updatePreferences((current) => ({ ...current, primerSeen: true }));
  }, [updatePreferences]);

  return (
    <LocationContext.Provider
      value={{
        ...preferences,
        municipalities,
        coordinates,
        currentMunicipality,
        locating,
        error,
        radiusM,
        setRadiusM,
        menuOpen,
        openMenu: () => setMenuOpen(true),
        closeMenu: () => setMenuOpen(false),
        requestLocation,
        setMode,
        selectMunicipality,
        setDefaultMunicipality,
        markPrimerSeen,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within LocationProvider");
  return context;
}