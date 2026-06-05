delete from public.services
where code in (
  'birthday-editing',
  'anniversary-editing',
  'pencil-sketch',
  'color-digital-sketch'
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
    'Professional skin retouching, color grading, and enhancement.',
    49,
    0,
    'retouching',
    null,
    null,
    null,
    null,
    array['Digital only'],
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
    null,
    null,
    null,
    null,
    array['Colour', 'Black and White'],
    '[{"key":"sketch_style","label":"Sketch style","type":"select","values":["Colour","Black and White"],"required":true}]'::jsonb,
    true,
    2
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
