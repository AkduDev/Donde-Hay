# Dónde Hay

Agregador de productos para el mercado cubano. Busca y compara precios en **Revolico**, **Facebook Marketplace**, **Instagram**, **Telegram**, **1Cuba**, **CholesLibres** y productos subidos por la comunidad.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Expo SDK 57 + React 19 + React Native 0.86 |
| Navegación | Expo Router v57 (file-based routing) |
| Estado | Zustand v5 (stores) + TanStack Query v5 (server state) |
| UI | Design system custom (Box, Text, Button, Card, etc.) |
| HTTP | Axios + React Query |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Scraping | GraphQL client para Revolico API |
| Testing | Jest + React Native Testing Library |
| Performance | FlashList + expo-image + React.memo |
| Build | EAS Build (development/preview/production) |
| TypeScript | v6 estricto |
| Icons | @expo/vector-icons (Ionicons) |
| Logos | Imágenes Dónde Hay (icon, splash, notificaciones) |

## Assets / Logos

| Archivo | Uso |
|---------|-----|
| `DondeHay.jpeg` | Icono principal app, splash screen, favicon |
| `DondeHay1.jpeg` | Icono de notificaciones push |
| `DondeHay3.jpeg` | Logo en pantalla Home y Profile |
| `Dondehay2.jpeg` | Reserva / uso futuro |
| `WebDondeHay.jpeg` | Versión web del logo |

## Arquitectura

```
src/
├── app/                         # Expo Router pages
│   ├── (tabs)/                  # Home, Search, Saved, Alerts, Profile
│   ├── (auth)/                  # Login, Register, Forgot/Reset Password
│   ├── alerts/                  # Create/Edit alert
│   ├── publish/                 # Multi-step publish form (5 steps)
│   ├── product/                 # Product detail screen
│   ├── seller/                  # Seller detail screen
│   ├── profile/                 # Edit profile, Preferences
│   └── _layout.tsx              # Root layout + auth guard + ErrorBoundary
├── components/
│   ├── ui/                      # Design system (Box, Text, Button, Input, etc.)
│   ├── product/                 # ProductCard, SourceChip
│   ├── search/                  # SearchBar, FilterSheet, SortSelector
│   ├── publish/                 # CategoryPicker, ImagePicker, LocationPicker
│   └── saved/                   # SavedSearchCard, SavedSellerCard
├── config.ts                    # API URLs, Cuban sources, Revolico mappings
├── hooks/                       # 20+ custom hooks (auth, products, search, etc.)
├── lib/
│   ├── api-client.tsx           # HTTP client, QueryProvider, queryKeys
│   ├── supabase.ts              # Supabase client (auth, DB, realtime)
│   ├── revolico-client.ts       # GraphQL client for Revolico API
│   ├── ws-client.ts             # WebSocket/real-time subscriptions
│   ├── monitoring.ts            # Performance monitoring
│   └── analytics.ts             # Event tracking
├── services/                    # 10 services (auth, products, search, scraper, etc.)
├── store/                       # Zustand stores (auth, location, theme, toast)
├── theme/                       # Design tokens (colors, spacing, typography)
├── types/                       # TypeScript interfaces
└── utils/                       # Utilities (format, validation, platform)

supabase/
├── config.toml                  # Supabase project config
├── functions/
│   ├── _shared/                 # CORS, auth, Revolico utils, admin client
│   ├── search-products/         # Full-text search with filters
│   ├── check-price-alerts/      # Scheduled price matching
│   ├── scrape-revolico/         # Revolico GraphQL scraper
│   └── scrape-sources/          # Stub for future sources
└── migrations/                  # Database migrations
```

## Búsqueda Multi-Fuente

La app busca productos de dos fuentes y los presenta unificados:

### Fuentes de Datos

| Fuente | Tipo | Método de Obtención |
|--------|------|---------------------|
| **Comunidad** | Productos subidos por usuarios | Supabase DB directo |
| **Revolico** | Clasificados cubanos | GraphQL API en tiempo real |

### Cómo Funciona la Búsqueda

```
Usuario busca "laptop"
        │
        ▼
┌─────────────────────────────────┐
│  useMultiSourceSearch()         │
│                                 │
│  1. searchDB()                  │  ← Productos de la comunidad
│     └─ Supabase query           │     (posts de usuarios verificados)
│                                 │
│  2. searchRevolico()            │  ← Scraping en tiempo real
│     └─ Edge Function            │     (GraphQL → Revolico API)
│        └─ Fetch a               │
│           graphql-api.          │
│           revolico.app          │
│                                 │
│  3. Merge + Dedup               │  ← Combina resultados
│     └─ Similitud por nombre     │     (elimina duplicados)
│                                 │
│  4. Filtrar por fuente          │  ← Filtros: Todos/Comunidad/Revolico
│     └─ SourceFilter chips       │
└─────────────────────────────────┘
        │
        ▼
  Resultados unificados:
  - Badge de fuente (verde=comunidad, naranja=Revolico)
  - Teléfono/WhatsApp de vendedores Revolico
  - Imágenes de pic.revolico.com
  - Precio original USD/CUP/MLC
  - Link a anuncio original
```

### Datos Obtenidos de Revolico

Cada producto de Revolico incluye:
- **Título** y **descripción** del anuncio
- **Precio** en moneda original (USD/CUP/MLC)
- **Imágenes** (URLs de pic.revolico.com)
- **Teléfono** del vendedor con prefijo +53
- **WhatsApp** (sí/no)
- **Provincia** y **municipio** de Cuba
- **URL original** del anuncio

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/AkduDev/Donde-Hay.git
cd donde-hay

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.development .env

# Iniciar desarrollo
npx expo start
```

## Variables de Entorno

Archivo `.env.development`:
```
EXPO_PUBLIC_SUPABASE_URL=https://wtnausykjenjqephbhfw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

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

# Build
npm run build:dev          # EAS development build
npm run build:preview      # EAS preview (APK)
npm run build:prod         # EAS production
npm run submit             # EAS submit to stores

# Supabase
supabase functions deploy scrape-revolico   # Deploy scraper
supabase db push                            # Push migrations
```

## Supabase Edge Functions

### scrape-revolico
Scraper de Revolico que usa GraphQL API.
- **Endpoint**: `https://graphql-api.revolico.app/`
- **Input**: `{ categoryId?: string, search?: string, limit?: number }`
- **Output**: Productos normalizados upserted en Supabase
- **Frequencia**: Cada búsqueda del usuario o programada

### search-products
Búsqueda full-text en la base de datos.
- **Input**: `{ query, filters: { category, priceRange, source, location } }`
- **Output**: Productos con ofertas, precios, disponibilidad

### check-price-alerts
Verificación programada de alertas de precio.
- **Frecuencia**: Cada 15 minutos (pg_cron)
- **Acción**: Notifica cuando un producto baja de precio

## Estructura de la BD

```sql
-- Productos canónicos (agrupados por nombre)
products (id, canonical_name, brand, model, category_id, image_urls, specifications)

-- Ofertas individuales por fuente
product_offers (id, product_id, seller_id, source_id, price, currency, source_url, status)

-- Vendedores por fuente
sellers (id, name, phone, whatsapp, source_id, source_profile_url, location_id)

-- Categorías jerárquicas
categories (id, name, slug, icon, parent_id)

-- Ubicaciones (provincias/municipios de Cuba)
locations (id, name, type, parent_id, latitude, longitude)

-- Favoritos del usuario
favorites (id, user_id, type, target_id)

-- Alertas de precio
price_alerts (id, user_id, product_id, target_price, direction, is_active)

-- Búsquedas guardadas
saved_searches (id, user_id, query, filters, notify_enabled)

-- Perfil de usuario
profiles (id, name, phone, avatar_url, currency, theme)
```

## Fuentes Cubanas

| Fuente | Tipo | Estado |
|--------|------|--------|
| **Revolico** | Marketplace | ✅ GraphQL scraping en tiempo real |
| **Comunidad** | Productos de usuarios | ✅ Supabase DB |
| Facebook Marketplace | Social | 🔄 Pendiente (requiere API/scraping) |
| Instagram | Social | 🔄 Pendiente |
| Telegram | Social | 🔄 Pendiente |
| 1Cuba | Partner | 🔄 Pendiente |
| CholesLibres | Partner | 🔄 Pendiente |

## Fases del Proyecto

| # | Fase | Estado |
|---|------|--------|
| 0 | Infraestructura (env, config, utils) | ✅ |
| 1 | Capa de Servicios (10 services) | ✅ |
| 2 | Autenticación (login, register, guards) | ✅ |
| 3 | Home + Búsqueda (real hooks, categorías) | ✅ |
| 4 | Guardados (favorites, saved searches) | ✅ |
| 5 | Perfil (edit, preferences, seller detail) | ✅ |
| 6 | Geolocalización (location, nearby) | ✅ |
| 7 | Alertas + Push + WebSocket real-time | ✅ |
| 8 | Publicar Producto (5-step form) | ✅ |
| 9 | Quality (testing, performance, a11y, errors) | ✅ |
| 10 | Publicación (EAS, Edge Functions, monitoring) | ✅ |
| 11 | Scraping Revolico (GraphQL, multi-source) | ✅ |
| 12 | Logos y Assets Dónde Hay | ✅ |

---

## Cómo Ejecutar la APK por USB

### Requisitos Previos

1. **Dispositivo Android** conectado por USB
2. **Depuración USB habilitada** en el dispositivo:
   - Ajustes → Acerca del teléfono → Toca "Número de compilación" 7 veces
   - Ajustes → Opciones de desarrollador → Depuración USB → ON
3. **ADB instalado** en la computadora:
   ```bash
   # Verificar que el dispositivo está conectado
   adb devices
   ```
4. **Java JDK 17** instalado
5. **Android SDK** instalado

### Opción 1: Build Local con Gradle (Recomendada para Cuba)

```bash
# 1. Conectar dispositivo por USB y verificar
adb devices

# 2. Prebuild (genera proyecto nativo Android)
npx expo prebuild --platform android

# 3. Build APK de desarrollo
cd android
./gradlew assembleDebug

# 4. Instalar en el dispositivo
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Ubicación del APK generado:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción 2: EAS Build (Requiere Internet)

```bash
# 1. Login en EAS
eas login

# 2. Build APK (se compila en la nube de Expo)
eas build --platform android --profile preview

# 3. Descargar APK desde el link que te da EAS
# 4. Instalar manualmente en el dispositivo
```

### Opción 3: Expo Dev Client (Desarrollo)

```bash
# 1. Build de development client
eas build --platform android --profile development

# 2. Instalar en dispositivo
# 3. Ejecutar
npx expo start --dev-client
```

### Troubleshooting

| Problema | Solución |
|----------|----------|
| `adb: device not found` | Habilitar depuración USB, probar otro cable |
| `Gradle build failed` | Verificar Java 17: `java -version` |
| `SDK not found` | Verificar `ANDROID_HOME` o `ANDROID_SDK_ROOT` |
| `dl.google.com timeout` | Usar VPN o Aliyun mirrors (configurados en `~/.gradle/init.gradle`) |
| `Expo Go incompatible` | SDK 57 requiere development build, no Expo Go |
| `403 EAS Build` | Verificar cuenta EAS y método de pago |

### Build Sin Internet (Offline)

Si no hay conexión a internet, el build local con Gradle es la mejor opción. Los mirrors de Aliyun ya están configurados en `~/.gradle/init.gradle` para descarga de dependencias.

```bash
# Verificar que los mirrors funcionan
cat ~/.gradle/init.gradle

# Si hay problemas con Aliyun, intentar con VPN
# o pre-descargar dependencias en máquina con internet
```

---

## Deployment

### Supabase
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref wtnausykjenjqephbhfw

# Push schema
supabase db push

# Deploy Edge Functions
supabase functions deploy search-products
supabase functions deploy check-price-alerts
supabase functions deploy scrape-revolico
```

### EAS Build
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK de prueba
npm run build:preview

# Build para production
npm run build:prod

# Submit a stores
npm run submit
```

## Licencia

MIT
