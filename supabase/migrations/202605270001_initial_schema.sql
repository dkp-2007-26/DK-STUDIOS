-- DK STUDIOS Supabase initial schema
-- Migrated from the current Convex schema.
-- Customer orders are account-free: customers can access an order by its order id.
-- Admin and delivery users can still be linked to Supabase Auth through app_users.auth_user_id.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('customer', 'admin', 'delivery');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_type as enum ('digital', 'printed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.file_retention_status as enum ('retained', 'scheduled', 'deleted', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.storage_provider as enum ('google_drive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.print_job_source_type as enum ('final_artwork', 'original_upload', 'manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.print_job_target as enum ('auto', 'color', 'bw');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.print_job_status as enum ('queued', 'claimed', 'printing', 'printed', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_record_status as enum ('created', 'paid', 'failed', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_channel as enum ('email', 'sms', 'whatsapp');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('queued', 'sent', 'skipped', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_message_status as enum ('open', 'replied', 'closed');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  display_name text not null,
  password_hash text,
  is_admin boolean not null default false,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0,
  print_price numeric(10,2) not null default 0,
  category text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location text,
  message text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  source text check (source in ('manual', 'review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  description text,
  image_url text not null,
  tag text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percentage numeric(5,2) not null check (discount_percentage >= 0 and discount_percentage <= 100),
  max_uses integer check (max_uses is null or max_uses >= 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  service_code text references public.services(code) on update cascade on delete set null,
  template_code text references public.templates(code) on update cascade on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  instructions text,
  frame_option text,
  frame_size text,
  collage_preference text,
  personalization_text text,
  photo_count integer not null default 0 check (photo_count >= 0),
  photo_names text[] not null default '{}',
  google_drive_folder_id text,
  delivery_type public.delivery_type not null default 'digital',
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_provider text,
  payment_order_id text,
  payment_id text,
  payment_link_url text,
  subtotal_amount numeric(10,2) not null default 0,
  discount_code text references public.promotions(code) on update cascade on delete set null,
  discount_percentage numeric(5,2),
  discount_amount numeric(10,2),
  total_amount numeric(10,2) not null default 0,
  advance_amount numeric(10,2) not null default 49,
  admin_notes text,
  barcode_value text unique,
  barcode_url text,
  tracking_url text,
  bill_number text unique,
  review_token text unique,
  payment_completed_at timestamptz,
  completed_at timestamptz,
  delivered_at timestamptz,
  pickup_ready_at timestamptz,
  pickup_ready_by text,
  pickup_ready_notified_at timestamptz,
  pickup_completed_at timestamptz,
  last_barcode_scanned_at timestamptz,
  barcode_scan_count integer not null default 0,
  customer_notified_at timestamptz,
  review_request_sent_at timestamptz,
  review_submitted_at timestamptz,
  delivery_verified_by text,
  file_retention_status public.file_retention_status not null default 'skipped',
  files_deletion_scheduled_at timestamptz,
  files_deleted_at timestamptz,
  files_deletion_failed_at timestamptz,
  files_deletion_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  storage_provider public.storage_provider not null default 'google_drive',
  file_name text not null,
  file_size bigint not null check (file_size >= 0),
  mime_type text,
  google_drive_file_id text,
  google_drive_folder_id text,
  google_drive_web_view_link text,
  google_drive_web_content_link text,
  google_drive_thumbnail_link text,
  preview_url text,
  sort_order integer not null default 0,
  crop_x numeric,
  crop_y numeric,
  crop_width numeric,
  crop_height numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  source_type public.print_job_source_type not null,
  title text not null,
  file_name text not null,
  file_size bigint not null check (file_size >= 0),
  mime_type text,
  google_drive_file_id text not null,
  google_drive_folder_id text,
  google_drive_web_view_link text,
  google_drive_web_content_link text,
  google_drive_thumbnail_link text,
  preview_url text,
  target public.print_job_target not null default 'auto',
  copies integer not null default 1 check (copies > 0),
  notes text,
  status public.print_job_status not null default 'queued',
  requested_by_user_id uuid references public.app_users(id) on delete set null,
  requested_by_email text not null,
  desktop_device_id text,
  desktop_device_name text,
  desktop_claimed_at timestamptz,
  print_started_at timestamptz,
  printed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  is_reprint boolean not null default false,
  parent_print_job_id uuid references public.print_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  provider text not null,
  provider_order_id text unique,
  provider_payment_id text,
  provider_signature text,
  status public.payment_record_status not null default 'created',
  amount numeric(10,2) not null default 0,
  currency text not null default 'INR',
  receipt text not null,
  checkout_url text,
  metadata_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  event text not null,
  channel public.notification_channel not null,
  provider text not null,
  recipient text not null,
  status public.notification_status not null default 'queued',
  external_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  public_location text,
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null default '',
  status public.review_status not null default 'pending',
  review_token text not null unique,
  requested_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  project text,
  source_id text,
  category text,
  subject text,
  customer_name text,
  customer_email text,
  customer_phone text,
  message text not null,
  status public.support_message_status not null default 'open',
  admin_reply text,
  responder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  replied_at timestamptz
);

create index if not exists app_users_email_idx on public.app_users(email);
create index if not exists app_users_auth_user_id_idx on public.app_users(auth_user_id);

create index if not exists services_active_sort_idx on public.services(is_active, sort_order);
create index if not exists testimonials_active_sort_idx on public.testimonials(is_active, sort_order);
create index if not exists templates_active_sort_idx on public.templates(is_active, sort_order);
create index if not exists promotions_active_valid_until_idx on public.promotions(is_active, valid_until);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_barcode_value_idx on public.orders(barcode_value);
create index if not exists orders_bill_number_idx on public.orders(bill_number);
create index if not exists orders_payment_order_id_idx on public.orders(payment_order_id);
create index if not exists orders_customer_email_idx on public.orders(customer_email);

create index if not exists order_photos_order_sort_idx on public.order_photos(order_id, sort_order);
create index if not exists order_photos_user_created_idx on public.order_photos(user_id, created_at desc);

create index if not exists print_jobs_order_created_idx on public.print_jobs(order_id, created_at desc);
create index if not exists print_jobs_status_created_idx on public.print_jobs(status, created_at desc);
create index if not exists print_jobs_created_idx on public.print_jobs(created_at desc);

create index if not exists payments_order_created_idx on public.payments(order_id, created_at desc);
create index if not exists payments_provider_order_idx on public.payments(provider_order_id);

create index if not exists notifications_order_created_idx on public.notifications(order_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create index if not exists reviews_order_idx on public.reviews(order_id);
create index if not exists reviews_token_idx on public.reviews(review_token);
create index if not exists reviews_status_created_idx on public.reviews(status, created_at desc);
create index if not exists reviews_user_created_idx on public.reviews(user_id, created_at desc);

create index if not exists support_messages_status_idx on public.support_messages(status);

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at before update on public.testimonials
for each row execute function public.set_updated_at();

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_print_jobs_updated_at on public.print_jobs;
create trigger set_print_jobs_updated_at before update on public.print_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_support_messages_updated_at on public.support_messages;
create trigger set_support_messages_updated_at before update on public.support_messages
for each row execute function public.set_updated_at();

create or replace function public.current_app_user()
returns public.app_users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where auth_user_id = auth.uid()
      and (is_admin = true or role = 'admin')
  )
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where auth_user_id = auth.uid()
      and role in ('admin', 'delivery')
  )
$$;

create or replace function public.get_public_order(order_uuid uuid)
returns table (
  id uuid,
  user_id uuid,
  service_code text,
  template_code text,
  customer_name text,
  customer_email text,
  customer_phone text,
  instructions text,
  frame_option text,
  frame_size text,
  collage_preference text,
  personalization_text text,
  photo_count integer,
  photo_names text[],
  google_drive_folder_id text,
  delivery_type public.delivery_type,
  status public.order_status,
  payment_status public.payment_status,
  payment_provider text,
  payment_order_id text,
  payment_id text,
  payment_link_url text,
  subtotal_amount numeric,
  discount_code text,
  discount_percentage numeric,
  discount_amount numeric,
  total_amount numeric,
  advance_amount numeric,
  barcode_value text,
  barcode_url text,
  tracking_url text,
  bill_number text,
  payment_completed_at timestamptz,
  completed_at timestamptz,
  delivered_at timestamptz,
  pickup_ready_at timestamptz,
  pickup_completed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.user_id,
    o.service_code,
    o.template_code,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.instructions,
    o.frame_option,
    o.frame_size,
    o.collage_preference,
    o.personalization_text,
    o.photo_count,
    o.photo_names,
    o.google_drive_folder_id,
    o.delivery_type,
    o.status,
    o.payment_status,
    o.payment_provider,
    o.payment_order_id,
    o.payment_id,
    o.payment_link_url,
    o.subtotal_amount,
    o.discount_code,
    o.discount_percentage,
    o.discount_amount,
    o.total_amount,
    o.advance_amount,
    o.barcode_value,
    o.barcode_url,
    o.tracking_url,
    o.bill_number,
    o.payment_completed_at,
    o.completed_at,
    o.delivered_at,
    o.pickup_ready_at,
    o.pickup_completed_at,
    o.created_at,
    o.updated_at
  from public.orders o
  where o.id = order_uuid
  limit 1
$$;

alter table public.app_users enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.templates enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_photos enable row level security;
alter table public.print_jobs enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (is_active = true or public.is_staff());

drop policy if exists "Public can read active testimonials" on public.testimonials;
create policy "Public can read active testimonials"
on public.testimonials for select
using (is_active = true or public.is_staff());

drop policy if exists "Public can read active templates" on public.templates;
create policy "Public can read active templates"
on public.templates for select
using (is_active = true or public.is_staff());

drop policy if exists "Public can preview active promotions" on public.promotions;
create policy "Public can preview active promotions"
on public.promotions for select
using (is_active = true or public.is_staff());

drop policy if exists "Staff can manage app data" on public.app_users;
create policy "Staff can manage app data"
on public.app_users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can read own app user" on public.app_users;
create policy "Customers can read own app user"
on public.app_users for select
using (auth_user_id = auth.uid());

drop policy if exists "Staff can read orders" on public.orders;
create policy "Staff can read orders"
on public.orders for select
using (public.is_staff());

drop policy if exists "Staff can manage orders" on public.orders;
create policy "Staff can manage orders"
on public.orders for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Staff can insert orders" on public.orders;
create policy "Staff can insert orders"
on public.orders for insert
with check (public.is_staff());

drop policy if exists "Staff can read order photos" on public.order_photos;
create policy "Staff can read order photos"
on public.order_photos for select
using (public.is_staff());

drop policy if exists "Staff can manage order photos" on public.order_photos;
create policy "Staff can manage order photos"
on public.order_photos for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Staff can manage print jobs" on public.print_jobs;
create policy "Staff can manage print jobs"
on public.print_jobs for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Staff can read payments" on public.payments;
create policy "Staff can read payments"
on public.payments for select
using (public.is_staff());

drop policy if exists "Staff can manage payments" on public.payments;
create policy "Staff can manage payments"
on public.payments for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Staff can read notifications" on public.notifications;
create policy "Staff can read notifications"
on public.notifications for select
using (public.is_staff());

drop policy if exists "Staff can manage notifications" on public.notifications;
create policy "Staff can manage notifications"
on public.notifications for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews for select
using (status = 'approved' or public.is_staff());

drop policy if exists "Staff can manage reviews" on public.reviews;
create policy "Staff can manage reviews"
on public.reviews for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can create support messages" on public.support_messages;
create policy "Public can create support messages"
on public.support_messages for insert
with check (true);

drop policy if exists "Staff can manage support messages" on public.support_messages;
create policy "Staff can manage support messages"
on public.support_messages for all
using (public.is_staff())
with check (public.is_staff());

grant usage on schema public to anon, authenticated;
grant select on public.services, public.testimonials, public.templates, public.promotions to anon, authenticated;
grant insert on public.support_messages to anon, authenticated;
grant execute on function public.get_public_order(uuid) to anon, authenticated;

-- Backend-only Netlify functions should use SUPABASE_SERVICE_ROLE_KEY for:
-- creating guest orders, writing order_photos, writing payments, updating Razorpay state,
-- admin operations, delivery scan operations, and notification logs.
