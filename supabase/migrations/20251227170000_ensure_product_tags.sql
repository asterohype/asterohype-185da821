create table if not exists product_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null,
  group_name text not null default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(slug)
);

create table if not exists product_tag_assignments (
  id uuid default gen_random_uuid() primary key,
  shopify_product_id text not null,
  tag_id uuid references product_tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shopify_product_id, tag_id)
);

-- Enable RLS
alter table product_tags enable row level security;
alter table product_tag_assignments enable row level security;

-- Policies for product_tags
create policy "Anyone can view product tags"
  on product_tags for select
  using (true);

create policy "Admins can insert product tags"
  on product_tags for insert
  with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can update product tags"
  on product_tags for update
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can delete product tags"
  on product_tags for delete
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

-- Policies for product_tag_assignments
create policy "Anyone can view product tag assignments"
  on product_tag_assignments for select
  using (true);

create policy "Admins can insert product tag assignments"
  on product_tag_assignments for insert
  with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can update product tag assignments"
  on product_tag_assignments for update
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can delete product tag assignments"
  on product_tag_assignments for delete
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );
