delete from public.services
where code in (
  'custom',
  'printing',
  'printing-a4'
);

insert into public.services (
  code,
  name,
  description,
  base_price,
  print_price,
  category,
  image_url,
  source_url,
  supplier,
  supplier_label,
  product_details,
  product_options,
  is_active,
  sort_order
)
values
  (
    'premium-retouching',
    'Premium Retouching',
    'Professional skin cleanup, colour correction, and polished portrait enhancement.',
    49,
    0,
    'retouching',
    '/services/premium-retouching.jpg',
    null,
    null,
    null,
    array['Digital only', 'Portrait cleanup'],
    '[]'::jsonb,
    true,
    1
  ),
  (
    'digital-sketch',
    'Digital Sketch',
    'Digital sketch artwork with colour or black and white output options.',
    199,
    0,
    'sketch',
    '/services/digital-sketch.jpg',
    null,
    null,
    null,
    array['Colour', 'Black and White'],
    '[{"key":"sketch_style","label":"Sketch style","type":"select","values":["Colour","Black and White"],"required":true}]'::jsonb,
    true,
    2
  ),
  (
    'custom-sketch',
    'Custom Sketch',
    'Tell us what you want; DK STUDIOS creates the sketch and refines it with you.',
    249,
    0,
    'sketch',
    '/services/custom-sketch.jpg',
    null,
    null,
    null,
    array['Made from your idea', 'Refinement included'],
    '[{"key":"sketch_style","label":"Sketch style","type":"select","values":["Colour","Black and White"],"required":true}]'::jsonb,
    true,
    3
  ),
  (
    'poster-making',
    'Poster Making',
    'Premium poster layout for events, launches, announcements, and promotions.',
    149,
    79,
    'design',
    '/services/poster-making.jpg',
    null,
    null,
    null,
    array['Event posters', 'Promotional layouts'],
    '[]'::jsonb,
    true,
    4
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  print_price = excluded.print_price,
  category = excluded.category,
  image_url = excluded.image_url,
  source_url = excluded.source_url,
  supplier = excluded.supplier,
  supplier_label = excluded.supplier_label,
  product_details = excluded.product_details,
  product_options = excluded.product_options,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
