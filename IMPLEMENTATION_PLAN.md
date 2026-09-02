# Dónde Hay — Plan de Implementación (v2)

> **Stack fijado (30-ago-2026)** — Este plan está ajustado a las tecnologías reales del proyecto. **No hay API intermedia (sin Next.js)**. El backend y la base de datos viven en **Supabase** (PostgreSQL + Auth + Realtime + Edge Functions) y la app los consume **directamente**: PostgREST + RPC para datos, Edge Functions solo para lógica pesada/background. Los "endpoints" están dentro del proyecto.

## Contexto del Proyecto

**Dónde Hay** es un agregador de productos para el mercado cubano. La app busca y compara precios en sitios y redes usadas por cubanos:

| Fuente | Tipo | Estado |
|--------|------|--------|
| **Revolico** | marketplace | 🔴 Pendiente (primera fuente a implementar) |
| **1Cuba** | marketplace | 🔴 Pendiente |
| **CholesLibres** | marketplace | 🔴 Pendiente |
| **Facebook Marketplace** | social | 🔴 Pendiente |
| **Instagram** | social | 🔴 Pendiente |
| **Telegram** | social | 🔴 Pendiente |
| **Comunidad Dónde Hay** | community | ✅ Users verificados (publish flow) |

El usuario **filtra por fuente**, ve **de qué sitio viene cada oferta** y **compara precios entre plataformas**.

---

## Arquitectura fijada (single source of truth)

```
                DÓNDE HAY
                   │
            React Native + Expo
                   │  HTTPS
                   ▼
    ┌──────────────────────────────────┐
    │            SUPABASE              │
    ├──────────────────────────────────┤
    │  PostgreSQL (datos + RLS + FTS)  │
    │  Auth (login/registro/session)   │
    │  Realtime (WebSocket, sincronía) │
    │  Edge Functions:                 │
    │    · search-products (RPC/FTS)   │
    │    · match-products (matching)   │
    │    · scrape-sources (adapters)   │
    │    · check-price-alerts (cron)   │
    └──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Revolico    Telegram   otras fuentes
```

Decisiones congeladas:
- **UI**: única fuente de verdad = **Design System propio** (`src/theme/` + components `src/components/ui/`). Tamagui **NO** se usa en runtime (0 imports). No más UI libraries.
- **Datos de negocio** → Supabase PostgreSQL (los servicios `src/services/*` consultan PostgREST/RPC).
- **Lógica pesada/background** → Edge Functions (scraping, matching, alertas). Retorna JSON normalizado que la app tipa.
- **Búsqueda** → full-text con `pg_trgm` vía RPC `search_products` (sin servicio de búsqueda externo).
- **No Redis/workers propios** → Realtime + funciones agendadas de Supabase (pg_cron).
- **Seguridad** → `anon key` pública (RLS es la frontera), secrets solo en Edge Functions (nunca en el APK), tokens de sesión en SecureStore.

---

## Prioridades 0-12 (roadmap desde HOY)

> Este es el plan maestro. Las prioridades 🔴 van antes que las 🟠/🟡. El orden operativo está en "Fases 1-7" más abajo.

### 🔴 Prioridad 0 — Dejar estable el frontend
- [ ] Auditoría visual completa en **dispositivo Android real** (11 flujos × 8 variantes)
- [ ] Corregir hallazgos de la auditoría

**Flujos**: Home, Buscar, Resultados, Detalle de producto, Guardados, Alertas, Perfil, Login, Registro, Publicar, Seller, Mapa.

**Variantes** (checklist por flujo):

| ☀️ Light | 🌙 Dark | 📱 pantalla pequeña | 📱 pantalla grande |
|---|---|---|---|
| ⌨️ teclado abierto | ↕️ scroll | 🔄 loading | ❌ error | ∅ sin resultados |

Regla: **no agregar pantallas** nuevas durante esta fase. Solo estabilizar.

### 🔴 Prioridad 1 — Unificar el Design System
- [ ] Auditar código: `StyleSheet.create`, estilos inline sueltos, tokens incorrectos, imports de librerías UI externas
- [ ] Barrido final de estilos inline → tokens (`Spacing`, `colors`, `radius`)
- [ ] Garantizar que los UI primitives (Box, Text, Button, Input, Card, Badge, Avatar, Divider, Spinner, Modal, Sheet, Tooltip, Skeleton) cubren el uso real
- [ ] Verificar 0 imports de Tamagui / otras UI libs en `src/`
- [ ] Documentar dónde se permiten estilos inline (casos legítimos: posicionamiento absoluto, transforms)

Estado actual (01-sep): Fase 2 DS (28-ago) ✅ centralizó dark mode + tokens. Auditoría ✅ (01-sep): `grep tamagui` → **0 resultados** en `src/`; **1 solo** `StyleSheet.create` (uno en el primitive Toast); ~85 `style={{}}` inline, patrón dominante = divisor de header `borderBottomWidth:1 + borderColor: colors.divider` (~14 sitios) con colores resueltos del tema → **aceptable, no requiere churn**; no detectada ninguna otra UI lib en runtime. Los casos legítimos de inline (posicionamiento absoluto/transform) quedan documentados en `src/theme/` y los primitives cubren el uso real.

### 🔴 Prioridad 2 — Revisar Text y tipografía en dispositivo real
- [ ] Probar `displayLarge` (60px) → `labelSmall` sin **clipping** en Android
- [ ] Verificar fuentes de sistema: Android `sans-serif` / `sans-serif-medium`; iOS San Francisco; web system-ui
- [ ] Verificar `getLineHeight()` en sobreescrituras de `fontSize` (Badge/Avatar/Button/Input)
- [ ] Revisar `accessibilityRole="header"` en títulos de pantalla

### 🟠 Prioridad 3 — Simplificar la navegación
- [x] 5 tabs principales: **Inicio, Buscar, Guardados, Alertas, Perfil** (✅ hecho)
- [x] Mapa, Producto, Seller, Publicar = **flujos internos** (✅ mapa fuera del tab bar)
- [ ] Verificar transiciones y back behavior en flujos internos (device)

### 🟠 Prioridad 4 — Home (reducción)
- [x] Jerarquía única: **Dónde Hay → ¿Qué estás buscando? → [Buscar] → Tendencias → Cerca de ti → Últimos descubrimientos** (✅ 01-sep)
- [x] Eliminar/blindar bloques superfluos (categorías como fila, destacados largos, Tecnología, Vehículos removidos)
- [x] No convertirla en marketplace lleno de bloques

Estado actual: `(tabs)/index.tsx` ✅ reducido a la jerarquía del asesor (01-sep). "Cerca de ti" usa `userLocation` persistido de `useLocationStore` sin pedir permiso en Home; sin ubicación → CTA Card → `/map`.

### 🟠 Prioridad 5 — Search (contrato conceptual)
- [x] Definir contrato: `Query → Search → Productos agrupados → Offers → Sources` (✅ verificado 01-sep: product/[id].tsx ya tiene "Comparar precios (N)" + lista de ofertas + botón "Ver en {fuente}")
- [x] Card: nombre + "🟢 N lugares" + "Desde $X" + chips de fuentes (✅ ProductCard)
- [x] Detail: "N ofertas" → lista [$precio Fuente [Ver]] por oferta (✅)
- [ ] Definir shapes TS en `src/types/` (`SearchResult`, `OfferListItem`) — disponible, concretar en Fase 2

Ejemplo de destino:
```
iPhone 13
🟢 8 lugares · Desde $420
[Revolico] [Instagram] [Facebook] [Telegram]  +4
```
```
iPhone 13 — 8 ofertas
$420  Revolico   [Ver]
$435  Instagram  [Ver]
$450  Facebook   [Ver]
```

### 🔴 Prioridad 6 — Revisar arquitectura de datos (ajustada a Supabase)
- [x] **Decisión tomada**: sin API intermedia. Backend = **Supabase** (PostgreSQL + Auth + Realtime + FTS). No Next.js/Redis/search service externo.
- [ ] Definir **frontera de lógica**: app = UI + estado + orquestación ligera; Edge Functions = scraping + matching + alertas.
- [ ] Mover lógica de negocio fuera del móvil cuando sea pesada/requiera secrets.
- [ ] Mantener Supabase Auth para sesiones (el móvil ya lo usa vía `src/lib/supabase.ts`).

### 🔴 Prioridad 7 — Diseñar el modelo de datos
- [ ] **Product** (canonical, agrupa ofertas) ↔ **Offer** (1..n por fuente/seller)
- [ ] **Source**, **Seller**, **Category**, **Location**
- [ ] **User** (profiles), **Favorite**, **SavedSearch**, **Alert**
- [ ] Migraciones SQL en `supabase/migrations/` + **RLS** en todas las tablas

Clave: la experiencia definida en Prioridad 5 depende de `Product → Offer[]` (una fila agrupada por producto, múltiples ofertas con `source_id` + `price` + `source_url`).

### 🔴 Prioridad 8 — Resolver Product Matching
- [ ] Normalización de títulos ("iPhone 13 128GB" / "Apple iPhone 13 128 GB" → mismo producto)
- [ ] Distinción de modelos ("iPhone 13" ≠ "iPhone 13 Pro" ≠ "iPhone 13 Pro Max")
- [ ] Lógica implementada en Edge Function `match-products` (o función SQL) + tests
- [ ] Diseñarla **antes** del scraper

### 🟠 Prioridad 9 — Fuentes (SourceAdapter)
- [ ] Contrato compartido: `SourceAdapter { search(), normalize(), getProduct() }`
- [ ] Implementar **Revolico** primero (Edge Function `scrape-sources`)
- [ ] Luego Fuente 2, Fuente 3, Fuente 4 (mismo contrato, aisladas del dominio)
- [ ] No contaminar el dominio con lógica específica de cada sitio

### 🟡 Prioridad 10 — Seguridad
- [ ] Review de `.env` / `.env.*` y `EXPO_PUBLIC_*` (todo lo prefijado `EXPO_PUBLIC_` va dentro del APK)
- [ ] Secrets (scraper creds, service role key) SOLO en Edge Functions
- [ ] RLS verificada en todas las tablas sensibles
- [ ] Verificar que Sentry/analytics no loguean datos sensibles

### 🟡 Prioridad 11 — Testing
- [x] Componentes críticos: Text, Button, Input, ProductCard, OfferCard, SearchBar (✅ 01-sep: controls Button/Input, searchbar, product-card añadidos)
- [ ] Flujos: Search, Authentication, Favorites, Alerts
- [ ] E2E (Playwright web / detector) — después
- [x] Meta: **tests de las piezas críticas**, no 500 tests ✅

Estado actual: **80 tests** ✅ (01-sep) — utils format/validation, map, UI primitives, controls, searchbar (5), product-card (5). Nota RNTL v14: eventos async con `userEvent` (type/press) para focus; `fireEvent` sigue disponible para changeText/submitEditing/press. En este entorno el mock de TextInput de jest-expo NO dispara `onFocus` vía `fireEvent(input,'focus')` ni `user.press` — solo `userEvent.type` enfoca el input.

### 🟡 Prioridad 12 — Calidad del proyecto (gate)
- [x] TypeScript 6 estricto + ESLint flat (0/0) + Jest + Prettier + Husky (✅ configurados)
- [ ] Regla fija para cambios grandes: `TypeScript → ESLint → Tests → Build` (husky corre `npm test` ✅)

---

## Fases de ejecución (orden desde HOY)

```
Fase 1 — Frontend estable     · Fase 2 — Contrato de dominio
Fase 3 — Backend Supabase     · Fase 4 — Primera fuente (Revolico)
Fase 5 — Mobile conectado     · Fase 6 — Auth/Guardados/Alertas
Fase 7 — Otras fuentes        · Maps · Ranking · Analytics · Performance
```

### Fase 1 — Frontend estable
> Objetivo: app estable, UI unificada y probada antes de datos nuevos. Sin API ni funcionalidades nuevas.
- [ ] Auditoría visual en device (Prioridad 0) + fix de hallazgos — pasada física del usuario (checklist arriba)
- [x] Unificar Design System (Prioridad 1) ✅ 01-sep (auditoría: 0 Tamagui, 1 StyleSheet, sin churn necesario)
- [ ] Verificar tipografía en device (Prioridad 2) — pasada física del usuario
- [x] Simplificar Home a la jerarquía reducida (Prioridad 4) ✅ 01-sep
- [x] Contracto de Search/Results + OfferCard (Prioridad 5) ✅ 01-sep (ya implementado en ProductCard + detail; OfferCard = fila inline, no requiere componente extra)
- [x] Tests de componentes críticos (Prioridad 11) ✅ 01-sep (Button, Input, SearchBar, ProductCard) — **80 tests en verde**

### Fase 2 — Contrato de dominio
> Objetivo: los tipos y la lógica pura que determinan el backend. Sin endpoints todavía.
- [x] Definir types TS: `Product`, `Offer`, `Source`, `Seller`, `Category`, `Location`, `SearchResult` (✅ completado 02-sep: añadidos `Category`, `SearchRequest`, `SearchResponse`, `OfferListItem`, `OfferAggregate`)
- [x] Normalización/matching como funciones puras en `src/lib/` con tests (✅ completado 02-sep: `src/lib/normalize.ts` + `matching.ts`, 40 tests)
- [x] Shapes del contrato de búsqueda (Prioridad 5) tipados (✅ completado 02-sep: `SearchRequest`, `SearchResponse`, `OfferListItem`)

Estado: completada 02-sep-2026. `npx tsc --noEmit` ✅. `npx eslint src/` 0/0. `npx jest --ci` 120 tests (80 previos + 40 nuevos de lib pura). La lógica de `normalize.ts`/`matching.ts` se reutilizará en la Edge Function `match-products` (Fase 3).

> El `<details>` de abajo documenta la exploración y plan original (ya ejecutado).

<details>
<summary>Fase 2 — Exploración y plan de implementación (01-sep-2026)</summary>

**Hallazgos de la exploración**

- `src/types/index.ts` (291 líneas, barrel único) ya tiene `Product`, `ProductOffer`, `Seller`, `Source`, `Location`, `SearchResult`, `SourceSummary`, `ProductWithOffers`, `ScrapedProduct`, `SearchQuery`, `MultiSourceSearchResult`, User/Favorites/Alerts. **Falta `Category`** y los shapes del contrato de búsqueda PRIORIDAD 5 (`SearchRequest`, `SearchResponse` límite RPC/EF, `OfferListItem`) y de matching.
- La **agregación/merge está duplicada e inline** en `search.service.ts`: `mapProductRow()` (líneas 199-230) y `mergeProducts()` (94-137) recalculan min/avg/max/offerCount/availability por su cuenta, igual que `products.service.ts` (trending/nearby). La normalización snake_case→camelCase (`mapOfferRow`/`mapProductRow`) vive en el servicio (frontera, no dominio puro).
- Patrón de módulos puros unit-testables ya existente: `src/lib/map.ts` (haversine, clusters) + `src/utils/__tests__/map.test.ts` (estilo describe/it plano). `jest.config.js`: `testMatch` = `**/__tests__/**`; coverage EXCLUYE `src/types/**` y `src/theme/**`.
- Ejemplo de matching exigido (Prioridad 8): "iPhone 13" ≠ "iPhone 13 Pro" ≠ "iPhone 13 Pro Max" → las variantes (`pro`, `max`, `plus`, `mini`, `lite`, `se`) y la capacidad (`128gb`) deben ser **señales discriminantes**, mientras que palabras de mercado es-CU (`vendo`, `nuevo`, `usado`, `seminuevo`, `se vende`, `negociable`, `por motivo de viaje`, `cuc`, `usd`, `mlc`, `costo`) se eliminan como stopwords.

**Plan de implementación (pendiente de ejecutar)**

1. **Types** (modificar `src/types/index.ts`): añadir `Category`; contrato Prioridad 5 → `SearchRequest` (input RPC `search_products`/EF: query, categoryId, locationId, sourceIds, minPrice, maxPrice, condition, sortBy, page, limit), `SearchResponse` (output RPC/EF alineado a `SearchResult`), `OfferListItem` (lista de ofertas del detail: `{ price, currency, sourceId, sourceName, sourceUrl, sellerName?, postedAt, status }`).
2. **`src/lib/normalize.ts`** (NUEVO, puro): `normalizeTitle()` (unicode fold acentos, minúsculas, signos, whitespace), `CATALOG_STOPWORDS` (es-CU, palabra exacta y lemmatizada), `extractBrand()` (diccionario de marcas), `extractModel()`, `buildCanonicalName()`.
3. **`src/lib/matching.ts`** (NUEVO, puro): `modelKey()` / `productKey(título)` (tokens discriminantes: variantes + capacidad), `sameProduct(a, b)`, `similarityScore()` (Jaccard), `aggregateOffers(offers)` → min/avg/max/offerCount/sourceCounts/availability/lastSeen (DERIVA `deriveAvailability`), `mergeByKey(arrays)`, `buildOfferList(product)` → `OfferListItem[]` ordenado por precio asc (contrato detail).
4. **Refactor `src/services/search.service.ts`**: delegar a `aggregateOffers`/`deriveAvailability`/`mergeByKey` (eliminar el cálculo inline duplicado); conservar en el servicio solo el mapeo snake_case→camelCase (frontera).
5. **Tests nuevos** `src/lib/__tests__/normalize.test.ts` + `matching.test.ts` (discriminantes iPhone, stopwords es-CU, agregación, merge, offer list).
6. **Verificación**: `npx tsc --noEmit`, `npm run lint`, `npx jest` (esperado 80 + ~30 = ~110); actualizar CHANGELOG + este tracker; commit + push (husky corre `npm test`).

**Nota**: la misma lógica de `normalize.ts`/`matching.ts` se reutilizará en la Edge Function `match-products` (Fase 3) — por eso va en `src/lib/` con tests y sin I/O.
</details>

### Fase 3 — Backend Supabase
> Objetivo: base de datos + endpoints vía Supabase.
```
supabase/
├── migrations/            # Tablas + índices + RLS + pg_trgm
├── functions/
│   ├── _shared/           # CORS, auth, admin client
│   ├── search-products/   # FTS con filtros (RPC)
│   ├── match-products/    # Agrupación/normalización (stub Fase 4)
│   └── check-price-alerts/ # Agendada (pg_cron)
```
- [x] Migraciones: products, product_offers, sellers, categories, locations, profiles, favorites, price_alerts, saved_searches (✅ completado 02-sep: `20260902000000_core_tables.sql`)
- [x] RLS + políticas por tabla (✅ completado: public read en core tables, CRUD propio en user tables, IF NOT EXISTS idempotent)
- [x] RPC `search_products` (pg_trgm + ILIKE + filtros + agregación + cursor) (✅ completado: Grant a anon + authenticated)
- [x] Edge Function `match-products` (stub con ILIKE, full matching pendiente Fase 4) (✅ completado 02-sep)
- [ ] Edge Function `check-price-alerts` (ya existe, verificar contra schema nuevo)

Estado: completada 02-sep-2026. Aplicada via Supabase Management API. 9 tablas, 23 índices, 24 RLS policies, RPC funcional, pg_trgm habilitado.

### Fase 4 — Primera fuente (Revolico)
- [x] `SourceAdapter` contract en Edge Function (✅ match-products EF con normalize/matching portado a Deno)
- [x] Adaptador Revolico (scraper + normalize) (✅ scrape-revolico: GraphQL + categoria/provincia UUID mapping fixes)
- [x] Persistencia a `product_offers` vía `match-products` (✅ onConflict compuesto corregido + seed categories/locations)
- [x] Scrape real end-to-end (✅ 02-sep-2026: 293 products, 300 offers, 326 sellers desde el GraphQL real `graphql-api.revolico.app`; verificado en BD)
- [x] Agendado con pg_cron (✅ 02-sep-2026: `scrape-revolico` cada 6h `0 */6 * * *` → invoca la EF con anon key)
- [ ] Ranking inicial (precio asc, fecha desc) (parcial: search_products RPC ya ordena por precio/fecha; falta trigger de scrape y destile)

Estado: completada y verificada end-to-end (02-sep-2026). Scraper scrapea el GraphQL de Revolico (solo categorías raíz 1000/1100/1200/1300/1400 devuelven ads; las subcategorías dan vacío). Corrección de schema en producción: `products.canonical_name` y `product_offers(source_id,source_external_id)` tienen UNIQUE (el `on_conflict` de la EF los requiere — 42P10), y `product_offers.price` es nullable (Revolico tiene anuncios sin precio). pg_cron + pg_net habilitados, job agendado y activo.

### Fase 5 — Mobile conectado
- [ ] `search.service.ts` → RPC `search_products` (ya existe patrón Supabase directo)
- [ ] Results con el contrato agrupado (N lugares / Desde $)
- [ ] Product detail con lista de ofertas + URLs externas
- [ ] Estados loading/error/sin resultados pulidos

### Fase 6 — Auth + Guardados + Alertas
- [ ] Flujos ya construidos sobre Supabase Auth (verificar contra RLS)
- [ ] Favorites, SavedSearches y Alerts sobre las tablas RLS

### Fase 7 — Otras fuentes + polish
- [ ] Fuente 2...n (mismo SourceAdapter)
- [ ] Maps afinado, ranking avanzado, analytics, performance

---

## Estado Actual (v1.0.0 → canary)

| Capa | Estado |
|------|--------|
| Design System (theme + 13 UI components) | ✅ Completo |
| Navegación (5 tabs + auth + alerts + publish + seller + map) | ✅ Completo |
| API Client + TanStack Query + Zustand | ✅ Completo |
| Services Layer (9 services, Supabase directo) | ✅ Completo |
| Auth screens + Supabase Auth | ✅ Completo |
| Product Detail + listas agrupadas | ✅ Completo |
| Geolocation + Mapa interactivo (fallback nativo) | ✅ Completo |
| Alerts + Push + Realtime | ✅ Completo |
| Publish Product (5 pasos) | ✅ Completo |
| Accessibility: RTL ✅ | ⏸️ TalkBack/VoiceOver pendiente (device) |
| Error Handling + Monitoring (Sentry + analytics HTTP) | ✅ Completo |
| Testing | ✅ 63 tests (falta: componentes críticos) |
| UI/UX Hardening (7 fases) | ✅ Completo |
| ESLint cleanup (136→0) | ✅ Completo |
| EAS Build cloud | ⏸️ 403 desde Cuba (APK debug local ✅) |

---

## Historial (fases 0-10, completo)

> Las fases 0-10 del plan original se completaron el 28-30/ago-2026. Este nuevo plan v2 las reemplaza como roadmap operativo, conservando el historial funcional por si se necesita consulta.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 0 — Infraestructura | entorno, utils, limpieza legacy, testing base | ✅ |
| 1 — Capa de servicios | 9 services + hooks TanStack | ✅ |
| 2 — Autenticación | screens + lógica Supabase | ✅ |
| 3 — Home + Búsqueda | home/search/product detail funcionales | ✅ |
| 4 — Guardados | favorites/búsquedas/vendedores | ✅ |
| 5 — Perfil | stats + sub-pantallas + preferencias | ✅ |
| 6 — Cerca de ti | location + nearby + mapa interactivo | ✅ |
| 7 — Alertas + Push | CRUD alertas + expo-notifications + WS | ✅ |
| 8 — Publicar | form 5 pasos + upload + gestión | ✅ |
| 9 — Calidad | testing, performance, accesibilidad (RTL), errores, Sentry+analytics | ✅ |
| 10 — Publicación | APK debug local ✅; EAS cloud bloqueado (403) | ⏸️ |

### Trabajo reciente (post-fases)
- **UI/UX Hardening (7 fases, 28-ago)**: tipografía absoluta, DS dark mode, navegación, Home, results agrupados, product detail, calidad (mocks+Skeleton+ESLint+Jest). Detalle en `CHANGELOG.md` `[2.0.0-canary]`.
- **ESLint 136→0 (30-ago)**: commit `595db2f`. `npm run lint` 0/0, tsc limpio, 54 tests.
- **Pendientes post-fases (30-ago, 2ª sesión)**: mapa interactivo (`react-native-maps`), Sentry (`@sentry/react-native`), analytics HTTP real, RTL en Tooltip. Commit `50c59bf`. 63 tests en verde.

## Resumen de Dependencias por Fase

| Fase | Dependencias |
|------|--------------|
| 6 | `expo-location`, `react-native-maps` |
| 7 | `expo-notifications` |
| 8 | `expo-image-picker` |
| 9 | `jest`, `jest-expo`, `@testing-library/react-native`, `@shopify/flash-list`, `test-renderer` |
| 10 | `eas-cli`, `@sentry/react-native` |

## Convenciones de Código

- **Components**: PascalCase, en `src/components/ui/` o `src/components/{domain}/`
- **Screens**: kebab-case en `src/app/`
- **Services**: `{domain}.service.ts` en `src/services/` (Supabase directo)
- **Hooks**: `use-{name}.ts` en `src/hooks/`
- **Types**: Centralizados en `src/types/index.ts`
- **Query Keys**: `queryKeys` factory de `api-client.tsx`
- **Estado**: Zustand (auth/theme) + TanStack Query (server state)
- **Estilos**: DS propio (`src/theme/`), no Tailwind, no Tamagui, no StyleSheet disperso