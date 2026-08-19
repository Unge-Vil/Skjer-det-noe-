import type { Municipality } from "@/lib/types";

export const LOCATION_COOKIE = "sdn-location";
export const LOCATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type LocationMode = "nearby" | "municipality";

export interface LocationPreferences {
  mode: LocationMode;
  selectedMunicipality: string | null;
  defaultMunicipality: string | null;
  primerSeen: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export const DEFAULT_LOCATION_PREFERENCES: LocationPreferences = {
  mode: "nearby",
  selectedMunicipality: null,
  defaultMunicipality: null,
  primerSeen: false,
};

function municipalityNumber(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}$/.test(value) ? value : null;
}

export function parseLocationPreferences(value?: string | null): LocationPreferences {
  if (!value) return DEFAULT_LOCATION_PREFERENCES;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<LocationPreferences>;
    return {
      mode: parsed.mode === "municipality" ? "municipality" : "nearby",
      selectedMunicipality: municipalityNumber(parsed.selectedMunicipality),
      defaultMunicipality: municipalityNumber(parsed.defaultMunicipality),
      primerSeen: parsed.primerSeen === true,
    };
  } catch {
    return DEFAULT_LOCATION_PREFERENCES;
  }
}

export function findMunicipality(
  municipalities: Municipality[],
  kommunenummer: string | null,
): Municipality | null {
  return municipalities.find((municipality) => municipality.kommunenummer === kommunenummer) ?? null;
}
