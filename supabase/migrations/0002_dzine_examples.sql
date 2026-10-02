-- Designs users kept with little revision, anonymised, used as references for future briefs.
-- Server only: RLS is on with no policies, so only the service role can read or write.
create table if not exists public.dzine_examples (
  id uuid primary key references public.dzine_projects (id) on delete cascade,
  ratio text not null,
  tags text[] not null default '{}',
  revisions integer not null default 0,
  design jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists dzine_examples_ratio_created on public.dzine_examples (ratio, created_at desc);

alter table public.dzine_examples enable row level security;
revoke all on public.dzine_examples from anon, authenticated;
