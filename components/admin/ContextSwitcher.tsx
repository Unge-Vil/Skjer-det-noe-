"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ds/Avatar";
import { Icon } from "@/components/ds/Icon";
import { SettingsContent } from "@/components/SettingsContent";
import { setActiveOrg } from "@/app/actions/org";
import { setActiveMunicipality } from "@/app/actions/kommune";
import { setActiveProfile } from "@/app/actions/profile";
import { useI18n } from "@/components/i18n/LocaleProvider";

interface Ref {
  id: string;
  name: string;
  sub?: string;
  orgId?: string;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

/** One admin switcher across every area: organisations, profiles, municipalities
 *  (specific access only) and platform. Self-fetching, used as the shell
 *  identity everywhere. */
export function ContextSwitcher() {
  const { t } = useI18n();
  const accountTitle = t.account.title;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [orgs, setOrgs] = useState<Ref[]>([]);
  const [profiles, setProfiles] = useState<Ref[]>([]);
  const [munis, setMunis] = useState<Ref[]>([]);
  const [platform, setPlatform] = useState(false);
  const [userName, setUserName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          accountTitle,
      );

      const [memberOrgs, profMems, muniAdmins, prof] = await Promise.all([
        supabase.from("organization_members").select("organizations(id,name)").eq("user_id", user.id),
        supabase.from("org_profile_members").select("profile_id").eq("user_id", user.id),
        supabase.from("municipality_admins").select("municipalities(id,name)").eq("user_id", user.id),
        supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orgList: Ref[] = (memberOrgs.data ?? []).map((r: any) => r.organizations).filter(Boolean);
      const orgIds = orgList.map((o) => o.id);
      setOrgs(orgList);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMunis((muniAdmins.data ?? []).map((r: any) => r.municipalities).filter(Boolean));
      setPlatform(Boolean(prof.data?.is_platform_admin));

      // Profiles: of orgs you're a master member of, plus your direct memberships.
      const profIds = (profMems.data ?? []).map((r) => r.profile_id as string);
      const sel = "id,name,organization_id,organizations(name)";
      const map = new Map<string, Ref>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const add = (r: any) => map.set(r.id, { id: r.id, name: r.name, orgId: r.organization_id, sub: r.organizations?.name ?? "" });
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
  }, [accountTitle]);

  // Active context from the route (+ context cookies).
  const activeProfileId = readCookie("sdn-active-profile") ?? (pathname.startsWith("/admin/profiler/") ? pathname.split("/")[3] : null);
  const onKommune = pathname.startsWith("/kommune");
  const onPlatform = pathname.startsWith("/plattform");
  const inAdminArea = pathname.startsWith("/admin") || onKommune || onPlatform;

  const activeOrg = orgs.find((o) => o.id === readCookie("sdn-active-org")) ?? orgs[0];
  const activeMuni = munis.find((m) => m.id === readCookie("sdn-active-muni")) ?? munis[0];
  const activeProfile = activeProfileId ? profiles.find((p) => p.id === activeProfileId) : null;

  // Best label even before data loads (avoids a flash of the wrong name).
  let contextLabel = t.orgadmin.organisation;
  let contextSub = "";
  if (activeProfile) {
    contextLabel = activeProfile.name;
    contextSub = activeProfile.sub ?? t.orgadmin.departments;
  } else if (onPlatform) {
    contextLabel = t.areas.platform;
    contextSub = "";
  } else if (onKommune) {
    contextLabel = activeMuni?.name ?? t.areas.municipality;
    contextSub = activeMuni ? t.areas.municipality : "";
  } else {
    contextLabel = activeOrg?.name ?? t.areas.org;
    contextSub = activeOrg ? t.areas.org : "";
  }

  const userNameLooksLikeContext = Boolean(
    userName &&
      contextLabel !== t.areas.municipality &&
      userName.toLocaleLowerCase().includes(contextLabel.toLocaleLowerCase()),
  );
  const label = userNameLooksLikeContext ? "Kommuneadministrator" : userName || "Bruker";
  const sub = activeProfile
    ? `${contextLabel} · ${contextSub}`
    : contextSub
      ? `${contextLabel} ${contextSub.toLowerCase()}`
      : contextLabel;

  const close = () => setOpen(false);
  const chooseOrg = (id: string) => {
    close();
    startTransition(async () => {
      await setActiveOrg(id);
      router.push("/admin");
      router.refresh();
    });
  };
  const chooseMuni = (id: string) => {
    close();
    startTransition(async () => {
      await setActiveMunicipality(id);
      router.push("/kommune");
      router.refresh();
    });
  };
  const chooseProfile = (id: string) => {
    close();
    const profile = profiles.find((item) => item.id === id);
    startTransition(async () => {
      await setActiveProfile(id, profile?.orgId);
      router.push("/admin");
      router.refresh();
    });
  };
  const goPlatform = () => {
    close();
    router.push("/plattform");
  };
  const goAdmin = () => {
    close();
    if (munis.length > 0) router.push("/kommune");
    else if (platform) router.push("/plattform");
    else router.push("/admin");
  };
  const goAccount = () => {
    close();
    router.push("/konto");
  };
  const logout = async () => {
    close();
    const { error } = await createClient().auth.signOut({ scope: "local" });
    if (!error) window.location.assign("/");
  };

  const identity = (
    <>
      <Avatar name={label} size={40} />
      <div style={{ minWidth: 0, lineHeight: 1.25, flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.areas.label}
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
            maxHeight: 380,
            overflowY: "auto",
          }}
        >
          {orgs.length > 0 && <Heading>{t.areas.org}</Heading>}
          {orgs.map((o) => (
            <Row key={o.id} name={o.name} active={!activeProfile && !onKommune && !onPlatform && o.id === activeOrg?.id} onClick={() => chooseOrg(o.id)} />
          ))}

          {profiles.length > 0 && <Heading>{t.orgadmin.departments}</Heading>}
          {profiles.map((p) => (
            <Row key={p.id} name={p.name} sub={p.sub} active={p.id === activeProfileId} onClick={() => chooseProfile(p.id)} />
          ))}

          {munis.length > 0 && <Heading>{t.areas.municipality}</Heading>}
          {munis.map((m) => (
            <Row key={m.id} name={m.name} active={onKommune && m.id === activeMuni?.id} onClick={() => chooseMuni(m.id)} />
          ))}

          {platform && (
            <>
              <Heading>{t.areas.platform}</Heading>
              <Row name={t.areas.platform} active={onPlatform} onClick={goPlatform} />
            </>
          )}

          {!inAdminArea && (orgs.length > 0 || profiles.length > 0 || munis.length > 0 || platform) && (
            <button type="button" role="menuitem" onClick={goAdmin} style={menuActionStyle}>
              <Icon name="layout-dashboard" size={16} />
              {t.areas.admin}
            </button>
          )}

          {(orgs.length > 0 || profiles.length > 0) && (
            <button
              type="button"
              onClick={() => {
                close();
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
          )}
          <button type="button" role="menuitem" onClick={goAccount} style={menuActionStyle}>
            <Icon name="user" size={16} />
            {t.account.title}
          </button>
          <button
            type="button"
            role="menuitem"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
            style={menuActionStyle}
          >
            <Icon name="settings" size={16} />
            {t.nav.settings}
            <span style={{ display: "inline-flex", transform: settingsOpen ? "rotate(180deg)" : undefined }}>
              <Icon name="chevron-down" size={14} color="var(--text-muted)" />
            </span>
          </button>
          {settingsOpen && (
            <div style={{ padding: "8px 6px 4px", borderTop: "1px solid var(--border-subtle)" }}>
              <SettingsContent />
            </div>
          )}
          <button type="button" role="menuitem" onClick={logout} style={{ ...menuActionStyle, color: "var(--danger-text)" }}>
            <Icon name="door-open" size={16} />
            {t.auth.logout}
          </button>
        </div>
      )}
    </div>
  );
}

const menuActionStyle = {
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
  textAlign: "left" as const,
};

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
      role="menuitem"
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
