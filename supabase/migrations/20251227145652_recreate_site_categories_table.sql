-- Drop table if exists to force a clean slate
DROP TABLE IF EXISTS public.site_categories;

-- Create table for site categories
create table public.site_categories (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  label text not null,
  custom_image text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint site_categories_pkey primary key (id),
  constraint site_categories_slug_key unique (slug)
);

-- Enable RLS
alter table public.site_categories enable row level security;

-- Create policies
create policy "Enable read access for all users"
on public.site_categories for select
using (true);

create policy "Enable insert for authenticated users only"
on public.site_categories for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only"
on public.site_categories for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only"
on public.site_categories for delete
using (auth.role() = 'authenticated');

-- Grant permissions explicitly
GRANT SELECT ON public.site_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_categories TO authenticated;
GRANT ALL ON public.site_categories TO service_role;

-- Handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
  before update on public.site_categories
  for each row
  execute procedure public.handle_updated_at();

-- Force schema reload
NOTIFY pgrst, 'reload schema';
