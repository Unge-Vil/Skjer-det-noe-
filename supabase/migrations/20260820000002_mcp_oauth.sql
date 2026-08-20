-- OAuth 2.1 state for the MCP resource server. All values that act as bearer
-- credentials are stored only as SHA-256 hashes and accessed by server routes.
create table public.mcp_oauth_clients (
  client_id     text primary key,
  client_name   text not null,
  redirect_uris jsonb not null,
  created_at    timestamptz not null default now()
);

create table public.mcp_oauth_codes (
  code_hash      text primary key,
  client_id      text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  redirect_uri   text not null,
  code_challenge text not null,
  scopes         text[] not null,
  resource       text not null,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  used_at        timestamptz
);
create index mcp_oauth_codes_expiry_idx on public.mcp_oauth_codes (expires_at);

create table public.mcp_oauth_tokens (
  token_hash text primary key,
  token_type text not null check (token_type in ('access', 'refresh')),
  family_id  uuid not null default gen_random_uuid(),
  client_id  text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  scopes     text[] not null,
  resource   text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz
);
create index mcp_oauth_tokens_active_idx on public.mcp_oauth_tokens (token_type, expires_at) where revoked_at is null;

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;
alter table public.mcp_oauth_tokens enable row level security;

revoke all on public.mcp_oauth_clients from anon, authenticated;
revoke all on public.mcp_oauth_codes from anon, authenticated;
revoke all on public.mcp_oauth_tokens from anon, authenticated;