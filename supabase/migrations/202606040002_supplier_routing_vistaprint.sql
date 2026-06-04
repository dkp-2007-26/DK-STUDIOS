-- DK STUDIOS supplier routing:
-- photo frame standard -> local, photo frame premium -> Vistaprint,
-- every other printed product -> Vistaprint only.

do $$ begin
  create type public.fulfillment_supplier as enum ('none', 'local', 'vistaprint');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.supplier_job_status as enum ('not_required', 'queued', 'submitted', 'completed', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.frame_fulfillment_tier as enum ('local_standard', 'vistaprint_premium');
exception when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists supplier public.fulfillment_supplier not null default 'none',
  add column if not exists supplier_status public.supplier_job_status not null default 'not_required',
  add column if not exists supplier_order_id text,
  add column if not exists supplier_submitted_at timestamptz,
  add column if not exists supplier_error text,
  add column if not exists frame_fulfillment_tier public.frame_fulfillment_tier,
  add column if not exists product_kind text;

create table if not exists public.supplier_fulfillment_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  supplier public.fulfillment_supplier not null,
  provider_order_id text,
  status public.supplier_job_status not null default 'queued',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  error_message text,
  attempted_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_supplier_status_idx on public.orders(supplier, supplier_status, created_at desc);
create index if not exists supplier_fulfillment_jobs_order_idx on public.supplier_fulfillment_jobs(order_id, created_at desc);
create index if not exists supplier_fulfillment_jobs_status_idx on public.supplier_fulfillment_jobs(supplier, status, created_at desc);

drop trigger if exists set_supplier_fulfillment_jobs_updated_at on public.supplier_fulfillment_jobs;
create trigger set_supplier_fulfillment_jobs_updated_at before update on public.supplier_fulfillment_jobs
for each row execute function public.set_updated_at();

alter table public.supplier_fulfillment_jobs enable row level security;

drop policy if exists "Staff can manage supplier fulfillment jobs" on public.supplier_fulfillment_jobs;
create policy "Staff can manage supplier fulfillment jobs"
on public.supplier_fulfillment_jobs for all
using (public.is_staff())
with check (public.is_staff());

drop function if exists public.get_public_order(uuid);
create or replace function public.get_public_order(order_uuid uuid)
returns table (
  id uuid,
  user_id uuid,
  service_code text,
  template_code text,
  customer_name text,
  customer_email text,
  customer_phone text,
  fulfillment_method public.fulfillment_method,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  shipping_country text,
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
  supplier public.fulfillment_supplier,
  supplier_status public.supplier_job_status,
  supplier_order_id text,
  supplier_submitted_at timestamptz,
  frame_fulfillment_tier public.frame_fulfillment_tier,
  product_kind text,
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
    o.fulfillment_method,
    o.shipping_city,
    o.shipping_state,
    o.shipping_pincode,
    o.shipping_country,
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
    o.supplier,
    o.supplier_status,
    o.supplier_order_id,
    o.supplier_submitted_at,
    o.frame_fulfillment_tier,
    o.product_kind,
    o.created_at,
    o.updated_at
  from public.orders o
  where o.id = order_uuid
  limit 1
$$;

grant execute on function public.get_public_order(uuid) to anon, authenticated;
