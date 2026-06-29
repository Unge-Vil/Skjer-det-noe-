-- Rich-text (Tiptap) organisation descriptions.
--
-- Non-destructive: the existing text columns (description, description_en) are
-- kept as a flattened plain-text mirror for cards/listings and legacy reads,
-- while the rich document lives in the new *_doc columns. Rendering prefers the
-- doc when present and falls back to the plain text.

alter table public.organizations
  add column description_doc    jsonb,
  add column description_doc_en jsonb;
