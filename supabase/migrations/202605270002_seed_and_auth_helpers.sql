-- DK STUDIOS seed data and Supabase Auth profile sync.

create or replace function public.increment_promotion_use(promo_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.promotions
  set uses_count = uses_count + 1,
      updated_at = now()
  where code = upper(promo_code);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (
    auth_user_id,
    email,
    display_name,
    password_hash,
    is_admin,
    role
  )
  values (
    new.id,
    coalesce(new.email, new.id::text || '@supabase.local'),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'customer'), '@', 1)),
    null,
    coalesce((new.raw_user_meta_data->>'role') = 'admin', false),
    case
      when new.raw_user_meta_data->>'role' in ('admin', 'delivery', 'customer') then (new.raw_user_meta_data->>'role')::public.app_role
      else 'customer'::public.app_role
    end
  )
  on conflict (auth_user_id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.services (code, name, description, base_price, print_price, category, is_active, sort_order)
values
  ('birthday-editing', 'Birthday Photo Editing', 'Beautiful birthday collages and photo edits with custom themes', 199, 99, 'editing', true, 1),
  ('anniversary-editing', 'Anniversary Photo Editing', 'Romantic anniversary layouts and memory collages', 249, 99, 'editing', true, 2),
  ('premium-retouching', 'Premium Retouching', 'Professional skin retouching, color grading, and enhancement', 349, 149, 'retouching', true, 3),
  ('pencil-sketch', 'Pencil Sketch (B&W)', 'Hand-drawn style black & white pencil sketch from your photo', 299, 99, 'sketch', true, 4),
  ('color-digital-sketch', 'Color Digital Sketch', 'Vibrant color digital sketch with artistic effects', 399, 149, 'sketch', true, 5),
  ('poster-making', 'Poster Making', 'Custom poster design for events, promotions, and more', 149, 79, 'design', true, 6),
  ('printing', 'Printing (A4 or smaller)', 'High-quality print on premium paper up to A4 size', 79, 0, 'print', true, 7),
  ('custom', 'Custom Design', 'Your vision, our craft - fully custom artwork', 299, 99, 'custom', true, 8)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    base_price = excluded.base_price,
    print_price = excluded.print_price,
    category = excluded.category,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.testimonials (code, name, location, message, rating, is_active, sort_order, source)
values
  ('priya-sharma', 'Priya Sharma', 'Mumbai', 'DK STUDIOS transformed our anniversary photos into something truly magical. The digital sketch was beyond our expectations!', 5, true, 1, 'manual'),
  ('rahul-mehta', 'Rahul Mehta', 'Pune', 'Ordered a birthday collage for my wife and she was speechless. The quality and attention to detail is outstanding.', 5, true, 2, 'manual'),
  ('anita-verma', 'Anita Verma', 'Delhi', 'The pencil sketch they made from our family photo is now framed in our living room. Absolutely gorgeous work!', 5, true, 3, 'manual'),
  ('kiran-patel', 'Kiran Patel', 'Ahmedabad', 'Fast delivery, beautiful work, and very affordable. DK STUDIOS is my go-to for all photo editing needs.', 5, true, 4, 'manual')
on conflict (code) do update
set name = excluded.name,
    location = excluded.location,
    message = excluded.message,
    rating = excluded.rating,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    source = excluded.source,
    updated_at = now();

insert into public.templates (code, name, category, description, image_url, tag, is_active, sort_order)
values
  ('birthday-elegant-frame', 'Elegant Birthday Frame', 'Birthday', 'Gold-accent birthday layout with room for headline text and 6 photos.', 'https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=600', 'Most Popular', true, 1),
  ('birthday-festive-collage', 'Festive Birthday Collage', 'Birthday', 'Colorful collage composition for up to 12 photos.', 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=600', 'New', true, 2),
  ('anniversary-romantic-frame', 'Romantic Love Frame', 'Anniversary', 'Elegant anniversary design with couple headline and floral highlights.', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600', 'Premium', true, 3),
  ('poster-modern-promo', 'Modern Promo Poster', 'Poster', 'Strong poster composition suited for events and store promotions.', 'https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=600', 'Bestseller', true, 4)
on conflict (code) do update
set name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    image_url = excluded.image_url,
    tag = excluded.tag,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.promotions (code, description, discount_percentage, max_uses, uses_count, valid_until, is_active)
values ('SUMMER20', '20% off all premium photo edits', 20, 100, 0, '2026-12-31T23:59:59.000Z', true)
on conflict (code) do update
set description = excluded.description,
    discount_percentage = excluded.discount_percentage,
    max_uses = excluded.max_uses,
    valid_until = excluded.valid_until,
    is_active = excluded.is_active,
    updated_at = now();
