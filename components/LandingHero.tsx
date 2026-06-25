"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { SearchBar } from "@/components/ds/SearchBar";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Hero search + category shortcuts that deep-link into /utforsk. */
export function LandingHero({ categories }: { categories: Category[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const search = () => {
    const q = query.trim();
    router.push(q ? `/kart?q=${encodeURIComponent(q)}` : "/kart");
  };

  return (
    <>
      <div style={{ maxWidth: 620, margin: "0 auto 20px" }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={search}
          placeholder={t.hero.searchPlaceholder}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {categories.slice(0, 7).map((c) => (
          <Link key={c.id} href={`/kart?kategori=${c.slug}`} style={{ textDecoration: "none" }}>
            <CategoryPill category={c.slug} />
          </Link>
        ))}
      </div>
    </>
  );
}
