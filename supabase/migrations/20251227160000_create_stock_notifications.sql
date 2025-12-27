create table if not exists stock_notifications (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  shopify_product_id text not null,
  variant_id text not null,
  product_title text,
  variant_title text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table stock_notifications enable row level security;

create policy "Anyone can insert stock notifications"
  on stock_notifications for insert
  with check (true);

create policy "Admins can select stock notifications"
  on stock_notifications for select
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can update stock notifications"
  on stock_notifications for update
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can delete stock notifications"
  on stock_notifications for delete
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );
