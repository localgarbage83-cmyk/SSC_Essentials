-- SSC Study Hub v2 schema. Metadata only: no PDF bytes, no individual MCQ rows.
create table subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  name_bn text,
  group_key text not null check (group_key in ('general','science')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  number int not null check (number > 0),
  title text not null,
  title_bn text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, number)
);
create table materials (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  category text not null check (category in ('notes','mcq','cq','extra','model','other')),
  title text not null,
  description text not null default '',
  drive_file_id text check (drive_file_id ~ '^[A-Za-z0-9_-]{10,120}$'),
  preview_path text,
  preview_pages int check (preview_pages between 1 and 5),
  original_pages int check (original_pages > 0),
  display_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_requires_files check (not published or (drive_file_id is not null and preview_path is not null)),
  constraint preview_not_longer_than_original check (original_pages is null or preview_pages is null or preview_pages <= original_pages)
);
create index chapters_subject_idx on chapters (subject_id, display_order);
create index materials_chapter_idx on materials (chapter_id, category, display_order);
create index materials_published_idx on materials (published);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references admin_users(id) on delete cascade,
  token_hash text not null unique,
  csrf_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table login_attempts (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index login_attempts_idx on login_attempts (key, created_at);
create table audit_log (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger subjects_updated before update on subjects for each row execute function set_updated_at();
create trigger chapters_updated before update on chapters for each row execute function set_updated_at();
create trigger materials_updated before update on materials for each row execute function set_updated_at();

-- The app talks to Postgres server-side only. Lock the tables for Supabase's public API roles.
alter table subjects enable row level security;
alter table chapters enable row level security;
alter table materials enable row level security;
alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table login_attempts enable row level security;
alter table audit_log enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
  end if;
end $$;
