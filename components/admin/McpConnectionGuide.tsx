"use client";

import { useState } from "react";

const card = {
  padding: 24,
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
} as const;

type Client = "chatgpt" | "copilot" | "claude";

const clientLabels: Record<Client, string> = { chatgpt: "ChatGPT", copilot: "Microsoft 365 Copilot", claude: "Claude" };

export function McpConnectionGuide({ scope }: { scope: "organization" | "municipality" }) {
  const scopeText = scope === "organization" ? "organisasjonens" : "kommunens";
  const plannedTools = scope === "organization"
    ? ["list_events", "get_event", "list_activities", "get_activity", "list_organisation_profiles", "create_or_update_event", "create_or_update_activity"]
    : ["list_municipality_activities", "list_municipality_events", "list_municipality_organisations", "list_municipality_pages", "create_municipality_page", "update_municipality_page", "publish_municipality_page"];
  const [client, setClient] = useState<Client>("chatgpt");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={card}>
        <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Velg AI-verktøy</h2>
        <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>Tilkoblingen bruker <code>https://skjerdetnoe.no/api/mcp</code>. OAuth-innloggingen knytter verktøyene til {scopeText} rolle og viser bare data kontoen har tilgang til.</p>
        <div role="tablist" aria-label="Velg AI-verktøy" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(Object.keys(clientLabels) as Client[]).map((item) => {
            const active = client === item;
            return <button key={item} type="button" role="tab" aria-selected={active} onClick={() => setClient(item)} style={{ padding: "8px 11px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: active ? "var(--fjord-50)" : "var(--surface-card)", color: active ? "var(--fjord-700)" : "var(--text-body)", fontSize: "var(--fs-sm)", fontWeight: active ? 700 : 600, cursor: "pointer" }}>{clientLabels[item]}</button>;
          })}
        </div>
        <div role="tabpanel" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginTop: 16, color: "var(--text-body)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
          {client === "chatgpt" && <><h3 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>ChatGPT</h3><p style={{ margin: 0 }}>For en personlig Pro-konto: Gå til <strong>Settings → Apps → Advanced Settings</strong>, slå på <strong>Developer Mode</strong>, velg <strong>Apps → Create</strong>, lim inn MCP-adressen og bruk <strong>Scan Tools</strong>. Fullfør OAuth når den blir tilgjengelig. Pro støtter foreløpig bare read/fetch; skrivehandlinger krever ChatGPT Business eller Enterprise/Edu.</p><p style={{ margin: "10px 0 0" }}>For arbeidsflater: Administrator oppretter og publiserer MCP-appen under <strong>Workspace settings → Apps</strong>. Se <a href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt" target="_blank" rel="noreferrer" style={{ color: "var(--text-link)" }}>Developer mode og MCP apps i ChatGPT</a>.</p></>}
          {client === "copilot" && <><h3 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Microsoft 365 Copilot</h3><p style={{ margin: 0 }}>En Microsoft 365-administrator registrerer MCP-serveren som en egendefinert Copilot-integrasjon og ruller den ut til riktige brukere eller grupper. Brukeren velger så integrasjonen i Copilot og fullfører OAuth-innloggingen.</p><p style={{ margin: "10px 0 0" }}>Se <a href="https://learn.microsoft.com/microsoft-365-copilot/extensibility/" target="_blank" rel="noreferrer" style={{ color: "var(--text-link)" }}>Microsofts dokumentasjon for Copilot-utvidelser</a>.</p></>}
          {client === "claude" && <><h3 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Claude</h3><p style={{ margin: 0 }}>Gå til <strong>Customize → Connectors</strong>, velg <strong>Add custom connector</strong> og lim inn MCP-adressen. I Team og Enterprise legger en eier først connectoren til under organisasjonens connector-innstillinger. Fullfør OAuth og aktiver connectoren i samtalen.</p><p style={{ margin: "10px 0 0" }}>Se <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noreferrer" style={{ color: "var(--text-link)" }}>Claude-veiledningen for remote MCP</a>.</p></>}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Tilgjengelige MCP-tools</h2>
        <p style={{ margin: 0, color: "var(--text-body)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>Previewen tilbyr offentlig, lesebasert katalogdata:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}><code style={{ padding: "6px 8px", background: "var(--surface-sunk)", borderRadius: "var(--radius-sm)" }}>list_categories</code><code style={{ padding: "6px 8px", background: "var(--surface-sunk)", borderRadius: "var(--radius-sm)" }}>list_municipalities</code></div>
        <p style={{ margin: "18px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>Kontoavgrensede tools for denne rollen:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>{plannedTools.map((tool) => <code key={tool} style={{ padding: "6px 8px", background: "var(--surface-sunk)", borderRadius: "var(--radius-sm)" }}>{tool}</code>)}</div>
        <p style={{ margin: "14px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-xs)", lineHeight: 1.5 }}>Disse er implementert i MCP-serveren og vises først etter gyldig OAuth-innlogging. Tilgangen følger alltid kontoen og rollen som logger inn.</p>
      </section>
    </div>
  );
}