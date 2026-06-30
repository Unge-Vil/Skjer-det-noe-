"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ds/Avatar";
import { Icon } from "@/components/ds/Icon";
import { setActiveOrg } from "@/app/actions/org";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { OrgRef } from "@/lib/org";

interface ProfileRef {
  id: string;
  name: string;
  organizationName: string;
}

/** Top-of-shell context switcher: pick an organisation (master) or one of your
 *  profiles, with a shortcut to create a new profile. */
export function OrgSwitcher({ orgs, activeId }: { orgs: OrgRef[]; activeId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [profiles, setProfiles] = useState<ProfileRef[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: memberOrgs }, { data: profMems }] = await Promise.all([
        supabase.from("organization_members").select("organization_id").eq("user_id", user.id),
        supabase.from("org_profile_members").select("profile_id").eq("user_id", user.id),
      ]);
      const orgIds = (memberOrgs ?? []).map((r) => r.organization_id as string);
      const profIds = (profMems ?? []).map((r) => r.profile_id as string);
      const sel = "id,name,organizations(name)";
      const map = new Map<string, ProfileRef>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const add = (r: any) => map.set(r.id, { id: r.id, name: r.name, organizationName: r.organizations?.name ?? "" });
      if (orgIds.length) {
        const { data } = await supabase.from("org_profiles").select(sel).in("organization_id", orgIds);
        for (const r of data ?? []) add(r);
      }
      if (profIds.length) {
        const { data } = await supabase.from("org_profiles").select(sel).in("id", profIds);
        for (const r of data ?? []) add(r);
      }
      if (active) setProfiles([...map.values()]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeProfileId = pathname.startsWith("/admin/profiler/")
    ? pathname.split("/")[3]
    : null;
  const activeOrg = orgs.find((o) => o.id === activeId) ?? orgs[0];
  const activeProfile = activeProfileId ? profiles.find((p) => p.id === activeProfileId) : null;

  const label = activeProfile ? activeProfile.name : activeOrg?.name ?? t.orgadmin.organisation;
  const sub = activeProfile ? activeProfile.organizationName : t.orgadmin.organisation;

  const chooseOrg = (id: string) => {
    setOpen(false);
    startTransition(async () => {
      await setActiveOrg(id);
      router.push("/admin");
      router.refresh();
    });
  };
  const chooseProfile = (id: string) => {
    setOpen(false);
    router.push(`/admin/profiler/${id}`);
  };

  const identity = (
    <>
      <Avatar name={label} size={40} />
      <div style={{ minWidth: 0, lineHeight: 1.25, flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
    </>
  );

  const onlyOne = orgs.length <= 1 && profiles.length === 0;
  if (onlyOne) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>{identity}</div>;
  }

  return (
    <div style={{ position: "relative", marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 6,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-card)",
          cursor: "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {identity}
        <Icon name="chevron-down" size={16} color="var(--text-muted)" />
      </button>
      {open && (
        <div
          role="menu"
          className="sdn-pop"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            padding: 4,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {orgs.length > 0 && <Heading>{t.areas.org}</Heading>}
          {orgs.map((o) => (
            <Row key={o.id} name={o.name} active={!activeProfile && o.id === activeOrg?.id} onClick={() => chooseOrg(o.id)} />
          ))}

          {profiles.length > 0 && <Heading>{t.orgadmin.departments}</Heading>}
          {profiles.map((p) => (
            <Row key={p.id} name={p.name} sub={p.organizationName} active={p.id === activeProfileId} onClick={() => chooseProfile(p.id)} />
          ))}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/admin/profiler");
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              padding: "9px 10px",
              border: "none",
              borderTop: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              color: "var(--text-brand)",
              fontSize: "var(--fs-sm)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Icon name="plus" size={16} />
            {t.orgadmin.createProfile}
          </button>
        </div>
      )}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "8px 10px 4px", fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </div>
  );
}

function Row({ name, sub, active, onClick }: { name: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        border: "none",
        borderRadius: "var(--radius-sm)",
        background: active ? "var(--fjord-50)" : "transparent",
        color: active ? "var(--fjord-700)" : "var(--text-body)",
        fontSize: "var(--fs-sm)",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Avatar name={name} size={26} />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
        {sub && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · {sub}</span>}
      </span>
      {active && <Icon name="check" size={15} />}
    </button>
  );
}
