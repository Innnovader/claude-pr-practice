-- =====================================================================
-- Carpetas inteligentes: guardar/archivar noticias por carpeta o favoritos
-- =====================================================================
-- Cada fila es "el usuario X guardó la noticia Y en la carpeta Z".
-- folder = 'Favoritos' es la carpeta por defecto (botón de un click).
-- El usuario puede crear otras carpetas con cualquier nombre (por tema,
-- por caso, etc.) simplemente guardando con un folder distinto.

create table public.saved_news (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  news_id uuid not null references public.coyuntura_news (id) on delete cascade,
  folder text not null default 'Favoritos',
  created_at timestamptz not null default now(),
  unique (user_id, news_id)
);

create index idx_saved_news_user on public.saved_news (user_id, folder);

alter table public.saved_news enable row level security;

-- Cada usuario solo ve y administra sus propios guardados — esto no
-- depende del rol (reader/analyst/super_admin), es privado por usuario.
create policy "saved_news_select_own" on public.saved_news
  for select using (user_id = auth.uid());
create policy "saved_news_insert_own" on public.saved_news
  for insert with check (user_id = auth.uid());
create policy "saved_news_update_own" on public.saved_news
  for update using (user_id = auth.uid());
create policy "saved_news_delete_own" on public.saved_news
  for delete using (user_id = auth.uid());

select 'LISTO — carpetas de noticias guardadas creadas' as resultado;
