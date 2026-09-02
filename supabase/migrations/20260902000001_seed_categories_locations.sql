-- Dónde Hay — Seed Data: Categories + Locations
-- Populates categories (Revolico hierarchy) and locations (16 Cuban provinces).
-- Uses ON CONFLICT DO NOTHING for idempotency.

-- ============================================
-- CATEGORIES (from REVOLICO_CATEGORY_MAP)
-- ============================================
-- Root categories first, then subcategories. Uses fixed UUIDs derived from
-- md5(slug) so the scraper can look up by slug and get a stable UUID.

-- Root categories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Vehículos', 'vehiculos', 'car', NULL, 1),
  ('a0000001-0000-0000-0000-000000000002', 'Inmobiliaria', 'inmobiliaria', 'home', NULL, 2),
  ('a0000001-0000-0000-0000-000000000003', 'Tecnología', 'tecnologia', 'laptop', NULL, 3),
  ('a0000001-0000-0000-0000-000000000004', 'Electrodomésticos', 'electrodomesticos', 'tv', NULL, 4),
  ('a0000001-0000-0000-0000-000000000005', 'Otros', 'otros', 'grid', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Vehículos subcategories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000001', 'Carros', 'vehiculos-carros', NULL, 'a0000001-0000-0000-0000-000000000001', 1),
  ('a0000002-0000-0000-0000-000000000002', 'Camiones', 'vehiculos-camiones', NULL, 'a0000001-0000-0000-0000-000000000001', 2),
  ('a0000002-0000-0000-0000-000000000003', 'Motos', 'vehiculos-motos', NULL, 'a0000001-0000-0000-0000-000000000001', 3),
  ('a0000002-0000-0000-0000-000000000004', 'Accesorios Vehículos', 'vehiculos-accesorios', NULL, 'a0000001-0000-0000-0000-000000000001', 4),
  ('a0000002-0000-0000-0000-000000000005', 'Repuestos', 'vehiculos-parts', NULL, 'a0000001-0000-0000-0000-000000000001', 5),
  ('a0000002-0000-0000-0000-000000000006', 'Buses', 'vehiculos-buses', NULL, 'a0000001-0000-0000-0000-000000000001', 6),
  ('a0000002-0000-0000-0000-000000000007', 'Trailers', 'vehiculos-trailers', NULL, 'a0000001-0000-0000-0000-000000000001', 7),
  ('a0000002-0000-0000-0000-000000000008', 'Otros Vehículos', 'vehiculos-otros', NULL, 'a0000001-0000-0000-0000-000000000001', 8)
ON CONFLICT (slug) DO NOTHING;

-- Inmobiliaria subcategories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000003-0000-0000-0000-000000000001', 'Venta', 'inmobiliaria-venta', NULL, 'a0000001-0000-0000-0000-000000000002', 1),
  ('a0000003-0000-0000-0000-000000000002', 'Alquiler', 'inmobiliaria-alquiler', NULL, 'a0000001-0000-0000-0000-000000000002', 2),
  ('a0000003-0000-0000-0000-000000000003', 'Habitaciones', 'inmobiliaria-habitaciones', NULL, 'a0000001-0000-0000-0000-000000000002', 3),
  ('a0000003-0000-0000-0000-000000000004', 'Terrenos', 'inmobiliaria-terrenos', NULL, 'a0000001-0000-0000-0000-000000000002', 4),
  ('a0000003-0000-0000-0000-000000000005', 'Oficinas', 'inmobiliaria-oficinas', NULL, 'a0000001-0000-0000-0000-000000000002', 5),
  ('a0000003-0000-0000-0000-000000000006', 'Otros Inmobiliaria', 'inmobiliaria-otros', NULL, 'a0000001-0000-0000-0000-000000000002', 6)
ON CONFLICT (slug) DO NOTHING;

-- Tecnología subcategories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000004-0000-0000-0000-000000000001', 'Computadoras', 'tecnologia-computadoras', 'desktop', 'a0000001-0000-0000-0000-000000000003', 1),
  ('a0000004-0000-0000-0000-000000000002', 'Teléfonos', 'tecnologia-telefonos', 'smartphone', 'a0000001-0000-0000-0000-000000000003', 2),
  ('a0000004-0000-0000-0000-000000000003', 'Tablets', 'tecnologia-tablets', NULL, 'a0000001-0000-0000-0000-000000000003', 3),
  ('a0000004-0000-0000-0000-000000000004', 'Accesorios Tecnología', 'tecnologia-accesorios', NULL, 'a0000001-0000-0000-0000-000000000003', 4),
  ('a0000004-0000-0000-0000-000000000005', 'Gaming', 'tecnologia-gaming', NULL, 'a0000001-0000-0000-0000-000000000003', 5),
  ('a0000004-0000-0000-0000-000000000006', 'Redes', 'tecnologia-redes', NULL, 'a0000001-0000-0000-0000-000000000003', 6),
  ('a0000004-0000-0000-0000-000000000007', 'Impresoras', 'tecnologia-impresoras', NULL, 'a0000001-0000-0000-0000-000000000003', 7),
  ('a0000004-0000-0000-0000-000000000008', 'Cámaras', 'tecnologia-camaras', NULL, 'a0000001-0000-0000-0000-000000000003', 8),
  ('a0000004-0000-0000-0000-000000000009', 'Audio', 'tecnologia-audio', NULL, 'a0000001-0000-0000-0000-000000000003', 9),
  ('a0000004-0000-0000-0000-000000000010', 'Otros Tecnología', 'tecnologia-otros', NULL, 'a0000001-0000-0000-0000-000000000003', 10)
ON CONFLICT (slug) DO NOTHING;

-- Electrodomésticos subcategories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000005-0000-0000-0000-000000000001', 'Cocina', 'electrodomesticos-cocina', NULL, 'a0000001-0000-0000-0000-000000000004', 1),
  ('a0000005-0000-0000-0000-000000000002', 'Lavado', 'electrodomesticos-lavado', NULL, 'a0000001-0000-0000-0000-000000000004', 2),
  ('a0000005-0000-0000-0000-000000000003', 'Clima', 'electrodomesticos-clima', NULL, 'a0000001-0000-0000-0000-000000000004', 3),
  ('a0000005-0000-0000-0000-000000000004', 'Refrigeración', 'electrodomesticos-refrigeracion', NULL, 'a0000001-0000-0000-0000-000000000004', 4),
  ('a0000005-0000-0000-0000-000000000005', 'Entretenimiento', 'electrodomesticos-entretenimiento', NULL, 'a0000001-0000-0000-0000-000000000004', 5),
  ('a0000005-0000-0000-0000-000000000006', 'Hogar', 'electrodomesticos-hogar', NULL, 'a0000001-0000-0000-0000-000000000004', 6),
  ('a0000005-0000-0000-0000-000000000007', 'Otros Electrodomésticos', 'electrodomesticos-otros', NULL, 'a0000001-0000-0000-0000-000000000004', 7)
ON CONFLICT (slug) DO NOTHING;

-- Otros subcategories
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
  ('a0000006-0000-0000-0000-000000000001', 'Mascotas', 'otros-mascotas', NULL, 'a0000001-0000-0000-0000-000000000005', 1),
  ('a0000006-0000-0000-0000-000000000002', 'Deportes', 'otros-deportes', NULL, 'a0000001-0000-0000-0000-000000000005', 2),
  ('a0000006-0000-0000-0000-000000000003', 'Hogar Otros', 'otros-hogar', NULL, 'a0000001-0000-0000-0000-000000000005', 3),
  ('a0000006-0000-0000-0000-000000000004', 'Ropa', 'otros-ropa', NULL, 'a0000001-0000-0000-0000-000000000005', 4),
  ('a0000006-0000-0000-0000-000000000005', 'Belleza', 'otros-belleza', NULL, 'a0000001-0000-0000-0000-000000000005', 5),
  ('a0000006-0000-0000-0000-000000000006', 'Libros', 'otros-libros', NULL, 'a0000001-0000-0000-0000-000000000005', 6),
  ('a0000006-0000-0000-0000-000000000007', 'Música', 'otros-musica', NULL, 'a0000001-0000-0000-0000-000000000005', 7),
  ('a0000006-0000-0000-0000-000000000008', 'Otros Varios', 'otros-otros', NULL, 'a0000001-0000-0000-0000-000000000005', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- LOCATIONS (16 Cuban provinces)
-- ============================================
INSERT INTO locations (id, name, type, parent_id, latitude, longitude)
SELECT * FROM (VALUES
  ('b0000001-0000-0000-0000-000000000001'::uuid, 'La Habana',       'province', NULL::uuid, 23.1136, -82.3666),
  ('b0000001-0000-0000-0000-000000000002'::uuid, 'Artemisa',         'province', NULL, 22.8140, -82.7590),
  ('b0000001-0000-0000-0000-000000000003'::uuid, 'Mayabeque',        'province', NULL, 22.8700, -81.9600),
  ('b0000001-0000-0000-0000-000000000004'::uuid, 'Pinar del Río',    'province', NULL, 22.4167, -83.6667),
  ('b0000001-0000-0000-0000-000000000005'::uuid, 'Matanzas',         'province', NULL, 23.0500, -81.5500),
  ('b0000001-0000-0000-0000-000000000006'::uuid, 'Cienfuegos',       'province', NULL, 22.1500, -80.4500),
  ('b0000001-0000-0000-0000-000000000007'::uuid, 'Villa Clara',      'province', NULL, 22.4000, -79.9500),
  ('b0000001-0000-0000-0000-000000000008'::uuid, 'Sancti Spíritus',  'province', NULL, 21.9300, -79.4400),
  ('b0000001-0000-0000-0000-000000000009'::uuid, 'Ciego de Ávila',   'province', NULL, 21.8500, -78.7600),
  ('b0000001-0000-0000-0000-000000000010'::uuid, 'Camagüey',         'province', NULL, 21.3800, -77.9200),
  ('b0000001-0000-0000-0000-000000000011'::uuid, 'Las Tunas',        'province', NULL, 20.9600, -76.9500),
  ('b0000001-0000-0000-0000-000000000012'::uuid, 'Granma',           'province', NULL, 20.3800, -76.6300),
  ('b0000001-0000-0000-0000-000000000013'::uuid, 'Holguín',          'province', NULL, 20.8900, -76.2600),
  ('b0000001-0000-0000-0000-000000000014'::uuid, 'Santiago de Cuba', 'province', NULL, 20.0200, -75.8300),
  ('b0000001-0000-0000-0000-000000000015'::uuid, 'Guantánamo',       'province', NULL, 20.1400, -75.2100),
  ('b0000001-0000-0000-0000-000000000016'::uuid, 'Isla de la Juventud', 'province', NULL, 21.7500, -82.8500)
) AS v(id, name, type, parent_id, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.name = v.name AND l.type = 'province');

-- ============================================
-- HELPER: Lookup category UUID by slug
-- ============================================
CREATE OR REPLACE FUNCTION public.get_category_id(p_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM categories WHERE slug = p_slug LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ============================================
-- HELPER: Lookup location UUID by province name
-- ============================================
CREATE OR REPLACE FUNCTION public.get_location_id(p_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM locations WHERE name = p_name AND type = 'province' LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_category_id TO anon;
GRANT EXECUTE ON FUNCTION public.get_category_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_id TO anon;
GRANT EXECUTE ON FUNCTION public.get_location_id TO authenticated;
