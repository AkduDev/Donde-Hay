-- Dónde Hay — Core Tables Migration
-- Creates the foundational schema: products, offers, sellers, categories,
-- locations, profiles, favorites, price_alerts, saved_searches.
-- Idempotent (IF NOT EXISTS) — safe to re-run.

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================
-- LOCATIONS (provinces / municipalities of Cuba)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('province', 'municipality')) NOT NULL,
  parent_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- ============================================
-- PRODUCTS (canonical / grouped)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT UNIQUE NOT NULL,
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  specifications JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_canonical_name_trgm ON products USING gin (canonical_name gin_trgm_ops);

-- ============================================
-- SELLERS
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  whatsapp TEXT,
  source_id TEXT NOT NULL,
  source_profile_url TEXT,
  rating DECIMAL(3,2),
  verification_status TEXT CHECK (verification_status IN ('none', 'pending', 'verified')) DEFAULT 'none',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_source_profile ON sellers(source_id, source_profile_url);
CREATE INDEX IF NOT EXISTS idx_sellers_source ON sellers(source_id);
CREATE INDEX IF NOT EXISTS idx_sellers_location ON sellers(location_id);

-- ============================================
-- PRODUCT OFFERS (individual listings per source)
-- ============================================
CREATE TABLE IF NOT EXISTS product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  source_id TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT CHECK (currency IN ('USD', 'CUP', 'MLC')) DEFAULT 'USD',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL DEFAULT '',
  source_external_id TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'inactive', 'sold')) DEFAULT 'active',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_source_id ON product_offers(source_id);
CREATE INDEX IF NOT EXISTS idx_offers_price ON product_offers(price);
CREATE INDEX IF NOT EXISTS idx_offers_posted_at ON product_offers(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_status ON product_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_location ON product_offers(location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_external ON product_offers(source_id, source_external_id);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'system',
  default_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_default_location ON profiles(default_location_id);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('product', 'search', 'seller')) NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, type);

-- ============================================
-- PRICE ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  direction TEXT CHECK (direction IN ('below', 'above')) DEFAULT 'below',
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON price_alerts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_product ON price_alerts(product_id);

-- ============================================
-- SAVED SEARCHES
-- ============================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  name TEXT,
  filters JSONB DEFAULT '{}',
  notify_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at') THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================
-- RLS: PUBLIC READ TABLES
-- ============================================
-- Products, offers, sellers, categories, locations: public SELECT (anon + auth),
-- write only via service_role (Edge Functions use admin client).

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read categories' AND tablename = 'categories') THEN
    CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read locations' AND tablename = 'locations') THEN
    CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read products' AND tablename = 'products') THEN
    CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read sellers' AND tablename = 'sellers') THEN
    CREATE POLICY "Public read sellers" ON sellers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read product_offers' AND tablename = 'product_offers') THEN
    CREATE POLICY "Public read product_offers" ON product_offers FOR SELECT USING (true);
  END IF;
END $$;

-- Profiles: public read, user can update own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users insert own profile" ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Favorites: CRUD own user
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own favorites' AND tablename = 'favorites') THEN
    CREATE POLICY "Users manage own favorites" ON favorites FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Price alerts: CRUD own user
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own price alerts' AND tablename = 'price_alerts') THEN
    CREATE POLICY "Users manage own price alerts" ON price_alerts FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Saved searches: CRUD own user
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own saved searches' AND tablename = 'saved_searches') THEN
    CREATE POLICY "Users manage own saved searches" ON saved_searches FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- RPC: search_products (pg_trgm + filters)
-- ============================================
CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT,
  p_category_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_source_ids TEXT[] DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'recent',
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  canonical_name TEXT,
  brand TEXT,
  model TEXT,
  description TEXT,
  image_urls TEXT[],
  category_id UUID,
  specifications JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  offers JSONB,
  min_price DECIMAL,
  max_price DECIMAL,
  average_price DECIMAL,
  offer_count BIGINT,
  source_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_offers AS (
    SELECT
      po.product_id,
      po.id AS offer_id,
      po.price,
      po.currency,
      po.source_id,
      po.source_url,
      po.source_external_id,
      po.posted_at,
      po.status,
      po.location_id,
      po.seller_id,
      po.raw_data,
      s.name AS seller_name
    FROM product_offers po
    LEFT JOIN sellers s ON s.id = po.seller_id
    WHERE po.status = 'active'
      AND (p_source_ids IS NULL OR po.source_id = ANY(p_source_ids))
      AND (p_location_id IS NULL OR po.location_id = p_location_id)
      AND (p_min_price IS NULL OR po.price >= p_min_price)
      AND (p_max_price IS NULL OR po.price <= p_max_price)
  ),
  product_aggregates AS (
    SELECT
      fo.product_id,
      jsonb_agg(jsonb_build_object(
        'id', fo.offer_id,
        'productId', fo.product_id,
        'sellerId', fo.seller_id,
        'sourceId', fo.source_id,
        'price', fo.price,
        'currency', fo.currency,
        'locationId', fo.location_id,
        'sourceUrl', fo.source_url,
        'sourceExternalId', fo.source_external_id,
        'postedAt', fo.posted_at,
        'status', fo.status,
        'sellerName', fo.seller_name,
        'rawData', fo.raw_data
      ) ORDER BY fo.price ASC) AS offers,
      MIN(fo.price) AS min_price,
      MAX(fo.price) AS max_price,
      ROUND(AVG(fo.price), 2) AS average_price,
      COUNT(*) AS offer_count,
      COUNT(DISTINCT fo.source_id) AS source_count
    FROM filtered_offers fo
    GROUP BY fo.product_id
  )
  SELECT
    p.id,
    p.canonical_name,
    p.brand,
    p.model,
    p.description,
    p.image_urls,
    p.category_id,
    p.specifications,
    p.created_at,
    p.updated_at,
    COALESCE(pa.offers, '[]'::jsonb) AS offers,
    pa.min_price,
    pa.max_price,
    pa.average_price,
    COALESCE(pa.offer_count, 0) AS offer_count,
    COALESCE(pa.source_count, 0) AS source_count
  FROM products p
  INNER JOIN product_aggregates pa ON pa.product_id = p.id
  WHERE
    (search_query = '' OR p.canonical_name ILIKE '%' || search_query || '%'
      OR p.brand ILIKE '%' || search_query || '%'
      OR p.model ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_cursor IS NULL OR p.created_at < p_cursor)
  ORDER BY
    CASE WHEN p_sort_by = 'price-asc' THEN pa.min_price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price-desc' THEN pa.max_price END DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute to anon and authenticated (RPC is the public search interface)
GRANT EXECUTE ON FUNCTION public.search_products TO anon;
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated;
