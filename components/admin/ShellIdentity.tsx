import { Avatar } from "@/components/ds/Avatar";

/** Sidebar identity block (avatar + name + sublabel) for non-org admin shells. */
export function ShellIdentity({ name, sub }: { name: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
      <Avatar name={name} size={40} />
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
