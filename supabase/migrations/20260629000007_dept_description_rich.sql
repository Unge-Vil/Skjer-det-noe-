-- Rich-text (Tiptap) department description overrides, mirroring the org-level
-- description_doc columns. NULL = inherit from the master organisation. The
-- plain-text override columns (description, description_en) are kept as a
-- flattened mirror for fallback rendering.

alter table public.organization_municipalities
  add column description_doc    jsonb,
  add column description_doc_en jsonb;
