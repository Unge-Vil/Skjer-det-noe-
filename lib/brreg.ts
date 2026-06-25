/**
 * Brønnøysund Enhetsregisteret lookup (open data, no auth).
 * Used to autofill organisation registration from an organisasjonsnummer.
 */

export interface BrregOrg {
  orgNumber: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  municipalityName: string | null;
  municipalityNumber: string | null;
  orgForm: string | null;
  isVolunteer: boolean;
}

const BASE = "https://data.brreg.no";

/** Normalize an org number to 9 digits, or null if invalid. */
export function normalizeOrgNumber(input: string): string | null {
  const clean = input.replace(/\D/g, "");
  return /^\d{9}$/.test(clean) ? clean : null;
}

export async function lookupBrreg(input: string): Promise<BrregOrg | null> {
  const orgnr = normalizeOrgNumber(input);
  if (!orgnr) return null;

  const res = await fetch(`${BASE}/enhetsregisteret/api/enheter/${orgnr}`, {
    headers: { accept: "application/json" },
  });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`Enhetsregisteret responded ${res.status}`);
  const d = await res.json();

  // Confirm registered-volunteer status (best-effort).
  let isVolunteer = false;
  try {
    const fr = await fetch(
      `${BASE}/frivillighetsregisteret/api/frivillige-organisasjoner/${orgnr}`,
      { headers: { accept: "application/json" } },
    );
    isVolunteer = fr.ok;
  } catch {
    // ignore — volunteer flag is optional
  }

  const addr = d.forretningsadresse ?? {};
  const street = Array.isArray(addr.adresse)
    ? addr.adresse.filter(Boolean).join(", ")
    : null;

  return {
    orgNumber: d.organisasjonsnummer,
    name: d.navn,
    website: d.hjemmeside ?? null,
    email: d.epostadresse ?? null,
    phone: d.telefon ?? d.mobiltelefon ?? null,
    address: street || null,
    postalCode: addr.postnummer ?? null,
    city: addr.poststed ?? null,
    municipalityName: addr.kommune ?? null,
    municipalityNumber: addr.kommunenummer ?? null,
    orgForm: d.organisasjonsform?.beskrivelse ?? null,
    isVolunteer,
  };
}
