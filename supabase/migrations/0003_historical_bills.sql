-- =====================================================================
-- Archivo legislativo histórico (brief: "el PLC es el partido más antiguo
-- de Colombia" — el Buscador RAG debe cubrir más que el periodo actual).
-- =====================================================================
-- Fuente: datos.gov.co, dataset "Vista Proyectos de Ley" (id xs56-s7w6),
-- licencia Creative Commons Attribution-ShareAlike 4.0, atribuido a
-- Cámara de Representantes. 1075 proyectos verificados el 2026-07-29.
--
-- NO se vincula a `parliamentarians` por FK: los autores de estos
-- proyectos son de periodos legislativos anteriores, personas distintas
-- a los congresistas actuales — vincularlos por nombre sería adivinar.

create table public.historical_bills (
  id uuid primary key default gen_random_uuid(),
  bill_number_camara text,
  bill_number_senado text,
  title text not null,
  summary_title text,
  status text,                   -- estado del proyecto tal como lo publica la fuente
  content_url text,
  -- La fuente reutiliza columnas con significado distinto entre lotes de
  -- datos (a veces "tipo_de_proyecto" trae nombres de autores, a veces el
  -- tipo de ley; "legislatura" a veces trae el periodo, a veces una URL de
  -- gaceta). En vez de adivinar y etiquetar mal, se guardan tal cual la
  -- fuente los publica, con sus llaves originales, para revisión manual o
  -- clasificación con IA más adelante.
  raw_extra jsonb not null default '{}'::jsonb,
  source text not null default 'datos.gov.co - Cámara de Representantes (CC BY-SA 4.0)',
  imported_at timestamptz not null default now()
);

create index idx_historical_bills_title on public.historical_bills using gin (to_tsvector('spanish', title));

alter table public.historical_bills enable row level security;

create policy "historical_bills_select_reader" on public.historical_bills
  for select using (public.current_role_is('reader'));
create policy "historical_bills_write_analyst" on public.historical_bills
  for insert with check (public.current_role_is('analyst'));
create policy "historical_bills_delete_admin" on public.historical_bills
  for delete using (public.current_role_is('super_admin'));

select 'LISTO — tabla de archivo legislativo histórico creada' as resultado;
