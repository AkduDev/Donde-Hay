# Dónde Hay - Agente de Desarrollo

## Repositorio
- **GitHub**: https://github.com/AkduDev/Donde-Hay
- **Rama principal**: `master`

## Contexto del Proyecto

**Dónde Hay** es una aplicación móvil de agregación de productos para Cuba que permite a los usuarios buscar, comparar precios y encontrar productos en múltiples fuentes: Revolico, Facebook Marketplace, Instagram, Telegram, 1Cuba, CholesLibres y fuentes comunitarias.

### Stack Tecnológico
- **Framework**: Expo SDK 57 + React 19 + React Native 0.86
- **Navegación**: Expo Router v57 (file-based routing)
- **Estado**: Zustand v5 (stores) + TanStack Query v5 (server state)
- **Estilo**: Tamagui v1 (design system)
- **HTTP Client**: Axios + React Query
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Testing**: Jest + React Native Testing Library
- **TypeScript**: v6 estricto

## Arquitectura

```
src/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Home, Search, Saved, Alerts, Profile
│   ├── (auth)/            # Login, Register, Forgot/Reset Password
│   ├── alerts/            # Create/Edit alert
│   ├── publish/           # Multi-step publish form (5 steps)
│   ├── product/           # Product detail screen
│   ├── seller/            # Seller detail screen
│   ├── profile/           # Edit profile, Preferences
│   └── _layout.tsx        # Root layout con auth guard + ErrorBoundary
├── components/            # Componentes reutilizables
│   ├── ui/                # Design system (Box, Text, Button, Input, etc.)
│   ├── product/           # ProductCard, ProductList, SourceChip
│   ├── search/            # SearchBar, FilterPanel, ResultsGrid
│   ├── publish/           # CategoryPicker, ImagePicker, LocationPicker
│   └── saved/             # SavedSearchCard, SavedSellerCard
├── config.ts              # Centralizada: API URLs, Cuban sources, timeouts
├── config/                # Build metadata (eas.ts)
├── hooks/                 # Custom hooks (auth, products, search, favorites, alerts, etc.)
├── lib/
│   ├── api-client.tsx     # Axios instance, QueryProvider, queryKeys
│   ├── supabase.ts        # Cliente Supabase (auth, DB, realtime)
│   ├── ws-client.ts       # WebSocket/real-time subscriptions
│   ├── monitoring.ts      # Performance monitoring
│   └── analytics.ts       # Event tracking
├── services/              # API services (9 services with Supabase integration)
├── store/                 # Zustand stores (auth, location, theme, toast)
├── theme/                 # Design tokens (colors, spacing, typography, radius)
├── types/                 # TypeScript interfaces y types
└── utils/                 # Utilities (format, validation, platform)
```

### Supabase Edge Functions
```
supabase/
├── config.toml
├── functions/
│   ├── _shared/           # CORS, auth, supabase admin client
│   ├── search-products/   # Full-text search with filters
│   ├── check-price-alerts/ # Scheduled price matching
│   └── scrape-sources/    # Stub for future scraping
└── migrations/            # Database migrations
```

## Supabase — Backend como Servicio

### Configuración
- **Proyecto Supabase**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **MCP Server**: Configurado en `~/.config/opencode/opencode.jsonc`
- **Token**: Personal Access Token (PAT) en variable de entorno

### Herramientas MCP Disponibles
El MCP server de Supabase permite ejecutar desde el agente:
- `list_projects` — Ver todos los proyectos Supabase
- `list_tables` — Explorar tablas de la BD
- `execute_sql` — Ejecutar queries SQL directamente
- `create_table` — Crear nuevas tablas
- `apply_migration` — Aplicar migraciones SQL
- `create_edge_function` — Crear Edge Functions (serverless)
- `config` — Ver configuración del proyecto
- `query` — Ejecutar queries con PostgREST

### Schema de BD Recomendado

```sql
-- Usuarios (manejado por Supabase Auth)
-- Se extiende con tabla profiles

-- Productos agrupados
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  specifications JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ofertas individuales por fuente
CREATE TABLE product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id),
  source_id TEXT NOT NULL, -- 'revolico', 'facebook', 'instagram', etc.
  price DECIMAL(10,2) NOT NULL,
  currency TEXT CHECK (currency IN ('USD', 'CUP', 'MLC')) DEFAULT 'USD',
  location_id UUID REFERENCES locations(id),
  source_url TEXT NOT NULL,
  source_external_id TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'inactive', 'sold')) DEFAULT 'active',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0
);

-- Ubicaciones (provincias/municipios de Cuba)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('province', 'municipality')) NOT NULL,
  parent_id UUID REFERENCES locations(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

-- Vendedores
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  source_id TEXT NOT NULL,
  source_profile_url TEXT,
  rating DECIMAL(3,2),
  verification_status TEXT CHECK (verification_status IN ('none', 'pending', 'verified')) DEFAULT 'none',
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favoritos
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('product', 'search', 'seller')) NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, target_id)
);

-- Alertas de precio
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  direction TEXT CHECK (direction IN ('below', 'above')) DEFAULT 'below',
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Búsquedas guardadas
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  name TEXT,
  filters JSONB DEFAULT '{}',
  notify_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfil de usuario (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'system',
  default_location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_offers_product_id ON product_offers(product_id);
CREATE INDEX idx_offers_source_id ON product_offers(source_id);
CREATE INDEX idx_offers_price ON product_offers(price);
CREATE INDEX idx_offers_posted_at ON product_offers(posted_at DESC);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_alerts_user ON price_alerts(user_id);
```

### Integración con Services Existentes

Cada service se conecta a Supabase en lugar de un backend custom:

```typescript
// Ejemplo: src/services/products.service.ts
import { supabase } from '@/lib/supabase';

export const productsService = {
  list: async (filters) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*),
        category:categories(name, slug)
      `)
      .order('created_at', { ascending: false });
    return data;
  },

  detail: async (id: string) => {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(*)
      `)
      .eq('id', id)
      .single();
    return data;
  },

  search: async (query: string) => {
    const { data } = await supabase
      .rpc('search_products', { search_query: query });
    return data;
  },
};
```

### Auth con Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Convenciones de Código

### Diseño
- **Tokens de spacing**: Usar strings (`"xxxs"`, `"xxs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`)
- **Colores**: `colors.primary`, `colors.text`, `colors.background`, `colors.surface`
- **Componentes**: `Box`, `Text`, `Button`, `Input`, `Card`, `Badge`, `Avatar`, `Divider`, `Spinner`, `Modal`, `Sheet`, `Tooltip`
- **NO usar** `TextInput` directo — usar componente `Input`
- **NO usar** valores numéricos de spacing — usar strings

### Navegación (Expo Router)
- Usar `router.push()` o `router.replace()` para navegación
- Rutas con grupos: `(tabs)`, `(auth)`
- Parámetros: `useLocalSearchParams()`

### Estado
- **Server state**: TanStack Query (queryKeys centralizados en `lib/api-client.tsx`)
- **Client state**: Zustand stores (auth, location, theme)
- **Mutaciones**: `useMutation` + `useQueryClient().invalidateQueries()`

### Formularios
- Validación con `src/utils/validation.ts`
- Errores en estado local `errors`
- Loading states con `isPending` de mutations

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/config.ts` | URLs API, fuentes cubanas, timeouts |
| `src/lib/api-client.tsx` | Axios instance, QueryProvider, queryKeys |
| `src/lib/supabase.ts` | Cliente Supabase (auth, DB, realtime) |
| `src/services/index.ts` | Barrel export de todos los services |
| `src/hooks/index.ts` | Barrel export de todos los hooks |
| `src/store/authStore.ts` | Zustand auth store con JWT refresh |
| `src/types/index.ts` | Interfaces: Product, SearchFilters, User, etc. |
| `src/theme/colors.ts` | Light/dark mode palettes |
| `src/theme/typography.ts` | Design System: LineHeights→absolutos con `getLineHeight()` |
| `src/app/results.tsx` | Pantalla de resultados (renombrada de `search.tsx`; `/search` quedó libre) |
| `metro.config.js` | blockList de dirs corruptos NTFS en `node_modules` (fix Metro EIO) |
| `.expo/types/router.d.ts` | Typed routes (generado, NO editar manualmente) |

## Comandos

```bash
# Desarrollo
npx expo start              # Expo Go
npx expo start --dev-client # Custom dev client

# Testing
npm test                    # Jest
npm run test:coverage       # Coverage

# Code Quality
npx tsc --noEmit           # TypeScript check
npx eslint src/            # Lint

# Supabase CLI (opcional)
npx supabase init           # Inicializar proyecto local
npx supabase start          # Levantar Supabase local
npx supabase db push        # Push schema a BD remote
npx supabase migration new  # Crear migración
```

### Ejecutar en dispositivo (development build)

```bash
# 1. Instalar APK debug si no está
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 2. Reenviar Metro al device (ejecutar una sola vez por conexión USB)
adb reverse tcp:8081 tcp:8081

# 3. Levantar Metro (en terminal del usuario, no como proceso en background) y pulsar 'r'
npx expo start --dev-client
```

> Nota: al recargar desde el dev menu, la app usa la URL `localhost:8081` del device vía `adb reverse`.
> Los procesos en background lanzados desde un agente mueren; Metro debe correrse en la terminal del usuario.

## MCP Servers Configurados

| Server | Tipo | Uso |
|--------|------|-----|
| **context7** | Remote | Documentación de librerías y frameworks |
| **github** | Remote | Repositorio, PRs, issues |
| **postgres** | Local | Queries PostgreSQL directas |
| **supabase** | Local | Gestión completa de proyecto Supabase |
| **playwright** | Local | Testing E2E y scraping |
| **engram** | Local | Entrenamiento de modelos |
| **heroui-migration** | Remote | Migración HeroUI v2 → v3 |
| **figma** | Remote | Diseño y assets |

## Fuentes Cubanas (config.ts)

| Fuente | Tipo | Método |
|--------|------|--------|
| Revolico | marketplace | Scraping + RSS |
| Facebook Marketplace | social | API |
| Instagram | social | API |
| Telegram | social | Bot API |
| 1Cuba | partner | API directa |
| CholesLibres | partner | API directa |
| Comunidad | community | Usuarios verificados |

## Errores Conocidos

### Fase 2 — Contrato de dominio (completada, 02-sep-2026)

Tipos y lógica pura de matching completados: `Category`, `SearchRequest`, `SearchResponse`, `OfferListItem`, `OfferAggregate` en `src/types/index.ts`; `src/lib/normalize.ts` (normalización títulos + stopwords es-CU + brand/model + productKey con discriminantes variantes+capacidad); `src/lib/matching.ts` (sameProduct, similarityScore, subsetMatch, aggregateOffers, deriveAvailability, mergeByKey, applyAggregate, buildOfferList); refactor `search.service.ts` delegando a la lib pura (eliminadas funciones inline `mergeProducts` y cálculo manual de min/avg/max). 120 tests (40 nuevos). Ver detalle en `IMPLEMENTATION_PLAN.md`.

### Fase 3 — Backend Supabase (completada, 02-sep-2026)

Migración `20260902000000_core_tables.sql` lista para aplicar via SQL Editor del Dashboard. 9 tablas (categories, locations, products, sellers, product_offers, profiles, favorites, price_alerts, saved_searches) + RLS + RPC `search_products` (pg_trgm, filtros, agregación, cursor). Stub `match-products` EF preparado para Fase 4. La migración es idempotent (IF NOT EXISTS en tablas e índices).

**Pendiente**: pegar el SQL de la migración en el Dashboard → SQL Editor → Run. Verificar tablas en Table Editor después.

- **403 pre-existentes**: Archivos legacy no modificados, no afecta nuevo código
- **ESLint 10.x**: Configuración en parent `eslint.config.mjs` causa conflictos, ignorado
- **Typed routes**: Requiere regenerar `.expo/types/router.d.ts` al agregar nuevas rutas
- **dl.google.com bloqueado**: En Cuba, Google CDN restringido. Aliyun mirrors funcionan para Maven pero lentos para dependencies pesadas
- **Build local fallido**: Gradle no puede descargar todas las dependencias desde Cuba. Aliyun timeout para dependencias grandes (GlassFish JAXB, etc.)
- **EAS Build 403**: Subida a Expo cloud falla con 403 Forbidden. Posible restricción geográfica o problema de permisos de cuenta
- **Expo Go incompatible**: Versión de Expo Go instalada incompatible con SDK 57. Necesita development build o APK nativa

## Errores Resueltos (sesión 28-ago-2026)

- **Hermes sin `Intl.RelativeTimeFormat`**: El uso a nivel de módulo crasheaba todo el bundle (errores en cascada: "missing default export", "ErrorBoundary undefined"). Solucionado en `src/utils/format.ts` con detección `typeof Intl.RelativeTimeFormat === 'function'`, inicialización perezosa y fallback manual en español (`hace X min / en X horas`)
- **Hook inválido en Zustand**: `useColorScheme()` era llamado dentro de acciones de `themeStore` (fuera de render). Reemplazado por `Appearance.getColorScheme()` de react-native
- **Metro crash EIO (NTFS)**: Directorios corruptos `node_modules/expo-dev-launcher/android/build-corrupt/...` hacen fallar `expo start` con `I/O error, scandir`. Solucionado con el blockList en `metro.config.js` (los dirs no se pueden borrar sin `chkdsk`/`ntfsfix`)
- **Login forzado eliminado**: La app abre directo en Home (`initialRouteName="(tabs)"`) sin auth guard en `src/app/_layout.tsx`. Iniciar sesión queda opcional
- **Ruta `/search` duplicada**: `src/app/search.tsx` (resultados) colisionaba con `(tabs)/search.tsx`. Renombrada a `src/app/results.tsx` (`/search` quedó libre para el tab)
- **`/login` inexistente**: En `(tabs)/alerts.tsx` se navegaba a `/login`; corregido a `/(auth)/login`
- **Tab bar sobre la barra de Android**: El menú inferior se solapaba con la barra de navegación del sistema. Corregido con `useSafeAreaInsets()` (height `60 + insets.bottom`, paddingBottom `Math.max(insets.bottom, 8)`)
- **Pestaña Mapa mal renderizada**: `(tabs)/nearby.tsx` existía pero sin `<Tabs.Screen>` → expo-router la auto-agregaba sin icono y con el nombre inglés "Nearby". Configurada como tab "Mapa" con icono `map`/`map-outline`
- **Búsqueda rota en device**: `search.service.ts` consultaba un backend en `localhost:3000` (inexistente) → `ConnectException` y resultados vacíos en el teléfono. `search()`/`searchDB()` ahora consultan **Supabase directamente** (ILIKE en nombre/marca/modelo/descripción + filtros y normalización snake_case→camelCase); `searchRevolico` se omite silenciosamente cuando `API_CONFIG.baseUrl` apunta a localhost fuera de web
- **`resizeMode` deprecado en expo-image**: Reemplazado por `contentFit` (solo en imágenes expo-image; los `Image` de react-native conservan `resizeMode`)
- **`lineHeight` como ratio (texto aplastado en Android)**: React Native exige `lineHeight` absoluto en dp. Todos los `TypographyVariants` ahora calculan `lineHeight` absoluto con `getLineHeight(ratio, fontSize)` en `src/theme/typography.ts` (los ratios `LineHeights` quedan como referencia)
- **`npm test` y `npm run lint` no corren** (parcial, RESUELTO en Fase 7): `jest`/`jest-expo` no estaban en devDeps y ESLint 10.x era incompatible. Ahora con `eslint.config.js` (flat) + eslint 9.39.5 y devDeps de testing instaladas, `npm run lint` da 0 errores y `npm test` corre 54 tests (utils + UI primitives). Ver detalle abajo
- **TypeScript errors UI**: Errores de tipos en componentes UI pre-existentes (Card, Button, Input, Modal, Sheet, Tooltip, Spinner, Text). Requieren refactor de tipos
- **`lineHeight` no se recalculaba al sobreescribir `fontSize`** (`Text.tsx`): Badge/Avatar/Button/Input pasaban `fontSize` por prop (10-28) con el `lineHeight` del variant fijo → texto recortado. Ahora `Text` deriva el ratio del variant y aplica `getLineHeight(ratio, newSize)`; `lineHeight` prop explícito tiene prioridad
- **`OpacityTokens`** (`pressed: 0.7`, `disabled: 0.6`, en `colors.ts`) reemplaza el patrón `pressed ? 0.7 : 1` suelto y el `0.6` de disabled (SortSelector, preferences, profile, Home, Button)

## UI/UX Hardening (plan 7 fases, sesión 28-ago-2026)

Plan aprobado para endurecer la UI. Reglas: sin funcionalidades nuevas hasta terminar; sin cambiar servicios/API; sin librerías UI nuevas; sin cambiar identidad visual.

| Fase | Estado |
|------|--------|
| 1 — Tipografía | ✅ Completa |
| 2 — Design System (dark mode centralizado, tokens) | ✅ Completa |
| 3 — Navegación (5 tabs, Mapa fuera del tab bar) | ✅ Completa |
| 4 — Home (búsqueda protagonista) | ✅ Completa |
| 5 — Search/Results (ProductCard agrupado) | ✅ Completa |
| 6 — Product Detail (comparar ofertas) | ✅ Completa |
| 7 — Calidad (mocks DEV, Skeleton, ESLint+Jest) | ✅ Completa |

Decisiones aprobadas: dark mode se resuelve **desde el store** en los UI primitives (default `mode = useThemeStore().resolvedMode`); Mapa queda **fuera** del tab bar como contexto secundario (results + product detail); regla semántica **Accent = encontrado/disponible**, Success = positivo general; **arreglar ESLint flat + jest-expo** en Fase 7.

Detalles de cada fase completada en `CHANGELOG.md` bajo `[2.0.0-canary]`.

### Fase 7 — Calidad (completada 30-ago-2026)

- **Skeleton**: componente `Skeleton` en `src/components/ui/` (pulso Animated, bg `surfaceVariant`, tokens getColors/spacing/radius) + `ProductCardSkeleton` (`src/components/product/`) con layouts 'list'/'grid'. Integrado en loading states de Home (3 bloques), Results (count=6), Search tab (count=4 + hint "Buscando en todas las fuentes...") y Product detail (imagen+detalle).
- **Mocks DEV**: flag `FEATURES.useMocks` en `src/config.ts` (env `EXPO_PUBLIC_USE_MOCKS`, default false) + dataset tipado `MOCK_PRODUCTS` en `src/mocks/products.ts`. Home: `productsResponse?.data ?? (FEATURES.useMocks ? MOCK_PRODUCTS : [])`.
- **ESLint flat**: `eslint.config.js` (eslint-config-expo/flat). `.eslintrc.js` legacy borrado. Se bajó eslint a **9.39.5** (10.x crasheaba con eslint-plugin-react 7.37.5: `contextOrFilename.getFilename is not a function`). Reglas de React Compiler (`react-hooks/purity|immutability|set-state-in-effect|static-components|preserve-manual-memoization`) a `warn` (el código no corre el compiler pero queda visible). **`npm run lint`: 0 errores / 0 warnings** (limpieza 136→0 completada el 30-ago-2026). Se conservan 3 `eslint-disable` justificados (Sheet ×1 bloque exhaustive-deps + effects asíncronos en use-device-location/use-notifications).
- **`as any` en router**: `typedRoutes` está en `false` (app.json experiments) → `Href` es permisivo; los `router.push(... as any)` eran innecesarios y fueron eliminados. Si se habilita typed routes de nuevo, regenerar `.expo/types/router.d.ts` con `npx expo start`.
- **Jest funcionando**: `jest-expo@57.0.5` + `jest@30.5.0` + `@react-native/jest-preset@0.86.2` (⚠ versionada con RN, NO @latest) + `@testing-library/react-native@14.0.1` + `test-renderer@^1.0.0` (peer dep de RNTL v14; la v14 es async: `await render(...)` + `screen`). `jest.config.js` con `setupFilesAfterEnv` (corregido el typo `setupFilesAfterSetup`).
- **Tests (54, todos en verde)**: utils `format` (sanitizado contra la API real: CUP usa separador ',', phone cubano de 11 dígitos, truncate `slice(maxLen-3)+'...'`) y `validation` (nuevo, 100% de funciones); smoke de UI primitives (`Text`, `Badge`, `Box` con RNTL).
- **Cleanups**: barrel `src/theme/index.ts` sin duplicados (`export *` solo, imports al tope); `search.tsx` sin entidades sin escapar; `product/[id].tsx` usa snapshot `useState(() => Date.now())` (purity React Compiler).
- **Importante**: `jest.setup.js` NO debe hacer `require('expo-router/entry')` (bootstrappea la app → crash en Node: `window.location` null). Se eliminó `react-test-renderer` (v14 usa `test-renderer`).

Los 3 ignores de `metro.config.js` (dirs corruptos NTFS) siguen vigentes. `npx tsc --noEmit` limpio.

### Pendientes post-fases implementados (sesión 30-ago-2026, 2ª)

- **Mapa interactivo**: `react-native-maps@1.27.2` (plugin en app.json). `src/components/map/ProductMap.tsx` con marcadores, clusters por grilla (`src/lib/map.ts`) y routing externo; **carga perezosa del módulo nativo con fallback** (APK sin rebuild o web → card "Abrir en Google Maps", nunca crashea). Coordenadas vía `locationsService.byIds` + `useLocationsByIds`. Pantalla `src/app/map.tsx` con toggle Mapa/Lista. ⚠️ Requiere **rebuild del APK** + Google Play Services para verse.
- **Sentry**: `@sentry/react-native@~7.11.0` (plugin `useNativeInit: false`). `src/lib/sentry.ts` init JS gated por `EXPO_PUBLIC_SENTRY_DSN` (require perezoso en try/catch; sin DSN o sin módulo nativo → no-op). `reportError()` en `monitoring.ts` encadena breadcrumb + `captureException` + analytics; el ErrorBoundary del root lo usa.
- **Analytics real**: `analytics.ts` `flush()` envía batches HTTP (POST JSON) a `EXPO_PUBLIC_ANALYTICS_ENDPOINT`; solo limpia cola si hay éxito. `Platform.OS` + `appRelease` en cada evento.
- **RTL en Tooltip**: `I18nManager.isRTL` reemplaza el `isRTL = false` hardcodeado (resuelto TODO Fase 9.3). Test TalkBack/VoiceOver sigue pendiente (dispositivo físico).
- **Verificación**: lint 0/0, tsc limpio, **63 tests** en verde (54 + 9 de `map.test.ts`).

## Soluciones pendientes (Cuba)

- **VPN**: Conectar VPN antes de `npx expo run:android` o `eas build`
- **EAS Build**: Verificar si es problema de cuenta (agregar método de pago/verificar)
- **Local build offline**: Investigar pre-descargar dependencias en máquina con internet
- **Expo Go update**: Actualizar Expo Go en el dispositivo (Google Play bloqueado, alternativas: APK directa)

## Build Android — Estado Actual y Próximos Pasos

### Resumen del Problema
El Android SDK en esta máquina **solo tiene binarios de Windows (.exe)** para build-tools, cmake, cmdline-tools y NDK. El build.gradle intenta usar binarios Linux y falla. Se han ido instalando versiones Linux manualmente, pero falta el NDK.

### Archivos Clave de Build
| Archivo | Propósito |
|---------|-----------|
| `android/gradle.properties` | Configuración Gradle (JVM args, architectures, new arch) |
| `android/local.properties` | SDK path: `sdk.dir=/media/Akdulay/27B09181315B1AF21/Android/Sdk` |
| `~/.gradle/init.gradle` | Aliyun Maven mirrors (timeout 120s) |
| `~/.local/bin/ninja` | Ninja 1.13.2 instalado manualmente (Linux) |
| `~/.local/bin/cmake` | CMake 3.31.6 instalado manualmente (Linux, de Kitware) |

### Build-tools — Corregidos
Todos reemplazados con binarios Linux descargados de `dl.google.com`:

| Versión | Estado | Fuente descarga |
|---------|--------|-----------------|
| 35.0.0 | ✅ Corregido | `build-tools-35-linux.zip` → extrae como `android-15/` |
| 36.0.0 | ✅ Corregido | `build-tools_r36_linux.zip` → extrae como `android-16/` |
| 36.1.0 | ✅ Corregido | `build-tools-361-linux.zip` → extrae como `android-16/` |

### CMake — Corregido
- SDK tenía `cmake.exe` en `cmake/3.22.1/bin/` y `cmake/3.31.6/bin/`
- Reemplazados con binary Linux de Kitware: `cp ~/.local/bin/cmake SDK/cmake/X.Y.Z/bin/cmake`
- Copiados módulos `share/cmake-3.31` a ambos directorios
- Ninja 1.13.2 copiado a ambos `bin/ninja`

### NDK — ✅ CORREGIDO
- **Versión instalada**: 27.1.12297006 (NDK r27b Linux) — clang 18.0.2
- **Path**: `/media/Akdulay/27B09181315B1AF21/Android/Sdk/ndk/27.1.12297006/`
- **Origen**: descargado el 27/ago/2026 con VPN activa desde Tencent mirror (`mirrors.cloud.tencent.com/AndroidSDK/android-ndk-r27b-linux.zip`, 633MB)
- **Nota**: El backup del NDK Windows quedó en `27.1.12297006-windows-backup` (ya no necesario, puede borrarse)
- **Instalación especial**: La extracción NO debe cruzarse de filesystem (`/tmp` → HDD externo). El `mv` entre filesystems se cortó a mitad (copia lenta NTFS) y dejó un NDK incompleto. **Solución**: extraer el zip directamente dentro del SDK (`unzip` en `/media/.../Sdk/ndk/`) y luego `mv` (rename local = instantáneo)
- **`:react-native-worklets:configureCMakeDebug`**: ✅ pasa. El NDK clang compila correctamente

### Build APK — ✅ COMPLETADO
- **APK**: `android/app/build/outputs/apk/debug/app-debug.apk` (92.7MB, arm64-v8a)
- **Estado**: `BUILD SUCCESSFUL in 47m 51s`
- **Fecha**: 27/ago/2026
- **Instalar en dispositivo**:
  ```bash
  adb install -r "/media/Akdulay/27B09181315B1AF21/Donde Hay/donde-hay/android/app/build/outputs/apk/debug/app-debug.apk"
  ```

### Corrupción NTFS del disco externo (importante)
Durante el build aparecieron errores `Input/output error` en 4 directorios de `node_modules/expo-dev-launcher/android/build/tmp/...` y un JSON sobrescrito con datos binarios en `react-native-screens/.cxx/`. Causa probable: conexión USB inestable del HDD externo (`/dev/sda4`, NTFS/FAT fuseblk). **Workarounds aplicados**:
- **Delete falla (`I/O error`)**: usar `mv` para renombrar dentro del MISMO filesystem (rename no atraviesa children) — p.ej. `mv build build-corrupt`, luego Gradle regenera de cero
- **JSON corrupto en `.cxx`**: borrar/renombrar `android/.cxx` de ese módulo, Gradle lo regenera
- **Disco**: 88GB libres, sin errores SMART reportados
- **Recomendación**: hacer backup periódico y revisar cable/USB controller; si los I/O errors se repiten, considerar `chkdsk`/`ntfsfix`

### SDK Android (estado completo)
```
/media/Akdulay/27B09181315B1AF21/Android/Sdk/
├── build-tools/
│   ├── 35.0.0/  ✅ Linux binaries
│   ├── 36.0.0/  ✅ Linux binaries  
│   └── 36.1.0/  ✅ Linux binaries
├── cmake/
│   ├── 3.22.1/bin/cmake  ✅ Linux binary (Kitware 3.31.6)
│   ├── 3.22.1/bin/ninja  ✅ Linux binary (1.13.2)
│   ├── 3.31.6/bin/cmake  ✅ Linux binary (Kitware 3.31.6)
│   └── 3.31.6/bin/ninja  ✅ Linux binary (1.13.2)
├── cmdline-tools/latest/ ✅ Linux (but sdkmanager broken - incompatible classpath jars)
├── ndk/
│   ├── 27.1.12297006/  ✅ Linux NDK r27b (clang 18.0.2) — usado para el build
│   ├── 27.1.12297006-windows-backup/  ⬜ backup del NDK Windows (borrar)
│   ├── 27.0.12077973/  ⬜ Windows only (sin uso)
│   └── 28.2.13676358/  ⬜ Windows only (sin uso)
└── platforms/  (assume OK)
```

### Archivos Temporales de Build
| Archivo | Propósito |
|---------|-----------|
| `/tmp/gradle-build11.log` | Build interrumpido (expoboost from lock temporal) |
| `/tmp/gradle-build12.log` | Build con JSON corrupto en screens/.cxx |
| `/tmp/gradle-build13.log` | ✅ Build final SUCCESSFUL (47m 51s) |
| `/tmp/android-ndk-r27b-linux.zip` | ⬜ Zip NDK ya extraído (puede borrarse, 633MB) |
| `/tmp/cmake-3.31.6-linux-x86_64/` | CMake Kitware extraído (fuente para SDK) |
| `/tmp/ninja-extract/ninja` | Ninja 1.13.2 binario fuente |

### Variables de Entorno Importantes
```bash
# Agregar a ~/.bashrc si no está
export PATH="$HOME/.local/bin:$PATH"
export ANDROID_HOME="/media/Akdulay/27B09181315B1AF21/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

### Specs de la Sesión de Build
- **Build-tools 36.0.0**: Completado OK (configure + compile tasks)
- **Gradle tasks ejecutados**: 384 total, 346 UP-TO-DATE en último intento
- **Fallo resuelto**: NDK clang no encontrado → NDK r27b Linux instalado
- **Build logs**: `/tmp/gradle-build*.log` (13 intentos, último exitoso)
- **gradle.properties**: `reactNativeArchitectures=arm64-v8a` (solo arm64 para velocidad)
- **gradle.properties**: `newArchEnabled=true` (New Architecture habilitada)
- **Errores NTFS encontrados y resueltos**: locks en expo-dev-launcher, JSON binario en react-native-screens

## Skills Disponibles

### desarrallador-rn-fullstack
Skill principal para desarrollo React Native con Expo en el proyecto Dónde Hay.
- **Ubicación**: `/home/Akdulay/.config/opencode/skills/desarrallador-rn-fullstack/SKILL.md`
- **Uso**: Se activa automáticamente para tareas de desarrollo en el proyecto
- **Contenido**: Stack tecnológico, arquitectura, convenciones, patrones, testing, performance

### Otras Skills Disponibles

| Skill | Para qué |
|-------|----------|
| **react-native-expert** | React Native / Expo - Desarrollo móvil multiplataforma |
| **nextjs-expert** | Next.js - Web + API con App Router |
| **typescript-expert** | TypeScript - Tipado estricto y buenas prácticas |
| **prisma-expert** | Prisma ORM - Modelo de datos y queries |
| **postgresql-expert** | PostgreSQL - Diseño y optimización de BD |
| **tailwind-nativewind-expert** | Tailwind / NativeWind - Design System |
| **ui-ux-expert** | UI/UX - Diseño de interfaces |
| **testing-expert** | Testing - Jest, RTL, Cypress, Playwright |
| **git-github-expert** | Git / GitHub - Control de versiones |
| **web-scraping-expert** | Web scraping - Recolección de productos |

## Plan de Desarrollo

Ver `IMPLEMENTATION_PLAN.md` para el plan completo de 10 fases.

## Estado Actual

| Fase | Estado |
|------|--------|
| 0 — Infraestructura | ✅ Completo |
| 1 — Capa de Servicios | ✅ Completo |
| 2 — Autenticación | ✅ Completo |
| 3 — Home + Búsqueda | ✅ Completo |
| 4 — Guardados | ✅ Completo |
| 5 — Perfil | ✅ Completo |
| 6 — Geolocalización | ✅ Completo |
| 7 — Alertas + Push | ✅ Completo |
| 8 — Publicar Producto | ✅ Completo |
| 9 — Calidad + Polish | ✅ Completo |
| 10 — Publicación | ✅ Completo |
