-- =====================================================================
-- Radar Liberal DNL — Esquema inicial
-- Dirección Nacional Liberal (Colombia) — Periodo legislativo 2026-2030
-- =====================================================================
-- Convenciones:
--   * Todas las tablas usan uuid como PK (default gen_random_uuid()).
--   * Toda tabla de contenido externo guarda source_url + source_name +
--     published_at + retrieved_at, para trazabilidad/verificabilidad
--     (requisito §4.1 del brief: cada dato debe ser verificable).
--   * content_hash (sha256) se usa para deduplicación de scraping
--     (requisito §4.3), complementado por similitud vectorial vía pgvector
--     cuando aplique.
--   * RLS habilitado en todas las tablas; roles: super_admin, analyst, reader.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------------------------------------------------------------------
-- Roles de aplicación (§4.4)
-- ---------------------------------------------------------------------
-- Los usuarios se autentican vía Supabase Auth. Este perfil extiende
-- auth.users con el rol de negocio. No confundir con roles de Postgres.
create type public.app_role as enum ('super_admin', 'analyst', 'reader');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'reader',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extiende auth.users con el rol DNL (super_admin/analyst/reader).';

-- Helper: rol del usuario autenticado actual (usado en policies).
create or replace function public.current_role_is(min_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case min_role
    when 'reader' then role in ('reader', 'analyst', 'super_admin')
    when 'analyst' then role in ('analyst', 'super_admin')
    when 'super_admin' then role = 'super_admin'
  end
  from public.profiles
  where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 1. parliamentarians — Bancada liberal Congreso 2026-2030 (Módulo 2)
-- ---------------------------------------------------------------------
create type public.chamber as enum ('senado', 'camara');

create table public.parliamentarians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  chamber public.chamber not null,
  department text,                          -- circunscripción (Cámara) / null para Senado (nacional)
  commission text,                          -- Comisión Constitucional 1-7, Legal, Especial
  photo_url text,
  bio text,
  is_dnl_aligned boolean not null default true,
  alignment_index numeric(4,1)              -- 0-100, índice de alineación con postura DNL
    check (alignment_index between 0 and 100),
  social_x_handle text,
  social_instagram_handle text,
  contact_email text,
  term_start date not null default '2026-07-20',
  term_end date not null default '2030-07-20',
  is_mock_data boolean not null default true, -- ver nota en README: reemplazar con datos oficiales verificados
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.parliamentarians is 'Congresistas de la bancada liberal, periodo 2026-2030. Poblar con datos verificados de Congreso Visible / Registraduría antes de producción.';

create table public.parliamentarian_votes (
  id uuid primary key default gen_random_uuid(),
  parliamentarian_id uuid not null references public.parliamentarians (id) on delete cascade,
  bill_id uuid,  -- FK a bills_tracker se agrega más abajo (esa tabla se define después)
  vote_description text not null,
  vote_value text not null check (vote_value in ('a_favor', 'en_contra', 'abstencion', 'ausente')),
  session_date date not null,
  source_url text,
  created_at timestamptz not null default now()
);

create table public.parliamentarian_statements (
  id uuid primary key default gen_random_uuid(),
  parliamentarian_id uuid not null references public.parliamentarians (id) on delete cascade,
  channel text not null check (channel in ('x', 'instagram', 'boletin', 'medios', 'congreso')),
  content text not null,
  is_critical boolean not null default false,  -- dispara alerta (§Módulo 2)
  sentiment text check (sentiment in ('positivo', 'neutro', 'negativo')),
  source_url text not null,
  published_at timestamptz not null,
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (content_hash)
);

create index idx_statements_parliamentarian on public.parliamentarian_statements (parliamentarian_id, published_at desc);
create index idx_statements_critical on public.parliamentarian_statements (is_critical) where is_critical = true;

-- ---------------------------------------------------------------------
-- 2. bills_tracker — Proyectos de ley (Módulo 2)
-- ---------------------------------------------------------------------
create table public.bills_tracker (
  id uuid primary key default gen_random_uuid(),
  bill_number text not null,               -- p.ej. "PL 045/2026 Senado"
  title text not null,
  summary text,                            -- resumen ejecutivo generado por IA (Claude)
  author_parliamentarian_id uuid references public.parliamentarians (id) on delete set null,
  rapporteur text,                         -- ponente
  status text not null default 'radicado'
    check (status in ('radicado', 'primer_debate', 'segundo_debate', 'tercer_debate', 'cuarto_debate', 'conciliacion', 'sancionado', 'archivado', 'hundido')),
  chamber_origin public.chamber not null,
  dnl_relevance text check (dnl_relevance in ('alto', 'medio', 'bajo')),
  topic text,                              -- Reformas, Economía, Orden Público, Elecciones, etc.
  source_url text not null,
  filed_at date not null,
  last_action_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bills_status on public.bills_tracker (status);
create index idx_bills_author on public.bills_tracker (author_parliamentarian_id);

alter table public.parliamentarian_votes
  add constraint fk_votes_bill foreign key (bill_id) references public.bills_tracker (id) on delete set null;

-- ---------------------------------------------------------------------
-- 3. coyuntura_news — Live feed multifuente (Módulo 1)
-- ---------------------------------------------------------------------
create table public.coyuntura_news (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  summary text,                             -- resumen ejecutivo IA
  body text,
  source_name text not null,                -- p.ej. "El Tiempo", "Semana", "La FM"
  source_url text not null,
  topic text,                               -- Reformas, Economía, Orden Público, Elecciones
  sentiment text check (sentiment in ('positivo', 'neutro', 'negativo')),
  entities jsonb default '[]'::jsonb,       -- NER: [{"name":"...", "type":"persona|organizacion|lugar"}]
  dnl_relevance text check (dnl_relevance in ('alto', 'medio', 'bajo')),
  published_at timestamptz not null,
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  embedding vector(1536),                   -- para búsqueda semántica RAG (Módulo 5)
  created_at timestamptz not null default now(),
  unique (content_hash)
);

create index idx_news_published on public.coyuntura_news (published_at desc);
create index idx_news_topic on public.coyuntura_news (topic);
create index idx_news_embedding on public.coyuntura_news using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------
-- 4. x_tweets — Radar de X/Twitter (Módulo 1)
-- ---------------------------------------------------------------------
create table public.x_tweets (
  id uuid primary key default gen_random_uuid(),
  author_handle text not null,
  author_name text not null,
  author_category text not null
    check (author_category in ('gobierno', 'oposicion', 'aliados', 'dnl_liderazgo', 'medios')),
  content text not null,
  tweet_url text not null,
  sentiment text check (sentiment in ('positivo', 'neutro', 'negativo')),
  topic text,
  engagement_likes int default 0,
  engagement_reposts int default 0,
  posted_at timestamptz not null,
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (content_hash)
);

create index idx_tweets_posted on public.x_tweets (posted_at desc);
create index idx_tweets_category on public.x_tweets (author_category);

-- ---------------------------------------------------------------------
-- 5. territorial_power — Mapa del poder territorial (Módulo 4)
-- ---------------------------------------------------------------------
create type public.territorial_office as enum ('gobernacion', 'alcaldia', 'concejal', 'diputado');

create table public.territorial_power (
  id uuid primary key default gen_random_uuid(),
  office public.territorial_office not null,
  department text not null,
  municipality text,                         -- null para gobernaciones/diputados (nivel departamental)
  official_name text not null,
  is_coalition boolean not null default false,  -- true si es coaval (coalición con participación liberal)
  coalition_partners text[],
  contact_email text,
  management_notes text,                     -- nivel de gestión local (notas del analista)
  is_mock_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_territorial_department on public.territorial_power (department);
create index idx_territorial_office on public.territorial_power (office);

-- ---------------------------------------------------------------------
-- 6. control_alerts — Vigía de entes de control y centros de pensamiento (Módulo 3)
-- ---------------------------------------------------------------------
create table public.control_alerts (
  id uuid primary key default gen_random_uuid(),
  source_entity text not null,               -- Procuraduría, Contraloría, Fiscalía, Defensoría, IPL, Fedesarrollo, Dejusticia, ANIF, Banrep
  source_category text not null check (source_category in ('ente_control', 'centro_pensamiento')),
  title text not null,
  summary text,
  alert_type text,                           -- investigacion, fallo, alerta_contratacion, informe_macro, analisis
  impact_level text not null check (impact_level in ('alto', 'medio', 'bajo')),
  source_url text not null,
  published_at timestamptz not null,
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (content_hash)
);

create index idx_control_alerts_published on public.control_alerts (published_at desc);
create index idx_control_alerts_impact on public.control_alerts (impact_level);
create index idx_control_alerts_entity on public.control_alerts (source_entity);

-- ---------------------------------------------------------------------
-- 7. scrape_runs — auditoría de pipelines de ingestión (§4.2/§4.3)
-- ---------------------------------------------------------------------
create table public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  items_found int not null default 0,
  items_inserted int not null default 0,
  items_deduplicated int not null default 0,
  error_message text,
  started_at timestamptz not null,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.parliamentarians enable row level security;
alter table public.parliamentarian_votes enable row level security;
alter table public.parliamentarian_statements enable row level security;
alter table public.bills_tracker enable row level security;
alter table public.coyuntura_news enable row level security;
alter table public.x_tweets enable row level security;
alter table public.territorial_power enable row level security;
alter table public.control_alerts enable row level security;
alter table public.scrape_runs enable row level security;

-- profiles: cada usuario ve/edita el suyo; super_admin ve todos.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.current_role_is('super_admin'));
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.current_role_is('super_admin'));
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.current_role_is('super_admin'));

-- Contenido de solo lectura para todo usuario autenticado (reader+),
-- escritura/edición reservada a analyst+, borrado a super_admin.
do $$
declare
  t text;
begin
  foreach t in array array[
    'parliamentarians', 'parliamentarian_votes', 'parliamentarian_statements',
    'bills_tracker', 'coyuntura_news', 'x_tweets', 'territorial_power', 'control_alerts'
  ]
  loop
    execute format($f$
      create policy "%1$s_select_reader" on public.%1$s
        for select using (public.current_role_is('reader'));
    $f$, t);
    execute format($f$
      create policy "%1$s_write_analyst" on public.%1$s
        for insert with check (public.current_role_is('analyst'));
    $f$, t);
    execute format($f$
      create policy "%1$s_update_analyst" on public.%1$s
        for update using (public.current_role_is('analyst'));
    $f$, t);
    execute format($f$
      create policy "%1$s_delete_admin" on public.%1$s
        for delete using (public.current_role_is('super_admin'));
    $f$, t);
  end loop;
end $$;

-- scrape_runs: visible para analyst+, solo el service role (scraper) inserta.
create policy "scrape_runs_select_analyst" on public.scrape_runs
  for select using (public.current_role_is('analyst'));
-- Nota: el servicio de scraping (services/scraper) usa la Supabase service_role key,
-- que ignora RLS por diseño; no se crea policy de insert para roles de app aquí.

-- =====================================================================
-- Realtime: publicar tablas de contenido para Supabase Realtime (Módulo 1)
-- =====================================================================
alter publication supabase_realtime add table public.coyuntura_news;
alter publication supabase_realtime add table public.x_tweets;
alter publication supabase_realtime add table public.control_alerts;
alter publication supabase_realtime add table public.parliamentarian_statements;

-- =====================================================================
-- Trigger genérico updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'parliamentarians', 'bills_tracker', 'territorial_power']
  loop
    execute format($f$
      create trigger set_updated_at before update on public.%1$s
        for each row execute function public.set_updated_at();
    $f$, t);
  end loop;
end $$;
