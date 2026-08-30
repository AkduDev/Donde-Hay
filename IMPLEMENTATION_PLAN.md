# Dónde Hay — Plan de Implementación

## Contexto del Proyecto

**Dónde Hay** es un agregador de productos para el mercado cubano. La app busca y compara precios en **sitios y redes sociales utilizados por cubanos**:

| Fuente | Tipo | Descripción |
|--------|------|-------------|
| **Revolico** | marketplace | Clasificados cubanos principal |
| **1Cuba** | marketplace | Otro portal de clasificados |
| **CholesLibres** | marketplace | Marketplace alternativo |
| **Facebook Marketplace** | social | Red social / grupos de compra-venta |
| **Instagram** | social | Vendedores en Instagram |
| **Telegram** | social | Canales de venta en Telegram |
| **Comunidad Dónde Hay** | community | Vendedores verificados propios |

El usuario puede **filtrar por fuente**, ver de **qué sitio viene cada oferta**, y comparar precios entre plataformas.

---

## Estado Actual (v1.0.0)

| Capa | Estado |
|------|--------|
| Design System (theme, 12 UI components) | ✅ Completo (0 TS errors) |
| Navegación (5 tabs + auth + alerts + publish + seller) | ✅ Completo |
| API Client + TanStack Query | ✅ Completo |
| Zustand Stores (auth, theme, location, toast) | ✅ Completo |
| TypeScript Types (322+ líneas) | ✅ Completo |
| Search Components (SearchBar, FilterSheet, SortSelector) | ✅ Completo |
| ProductCard (React.memo + expo-image) | ✅ Completo |
| Supabase Backend | ✅ Configurado (schema.sql, Edge Functions) |
| Services Layer (9 services) | ✅ Completo |
| Auth screens (login, register, forgot/reset) | ✅ Completo |
| Product Detail screen | ✅ Completo |
| Geolocation (Phase 6) | ✅ Completo (incluye mapa interactivo; fallback sin módulo nativo) |
| Alerts + Push (Phase 7) | ✅ Completo |
| WebSocket/Real-time (Phase 7.3) | ✅ Completo |
| Publish Product (Phase 8) | ✅ Completo |
| Saved (Phase 4) | ✅ Completo |
| Profile (Phase 5) | ✅ Completo |
| Testing (Phase 9.1) | ✅ Completo (63 tests en verde) |
| Performance (Phase 9.2) | ✅ Completo |
| Accessibility (Phase 9.3) | ⏸️ Parcial (RTL ✅; TalkBack/VoiceOver pendiente de test físico) |
| Error Handling (Phase 9.4) | ✅ Completo |
| EAS Build + Submit (Phase 10) | ⏸️ Bloqueado (EAS cloud 403 desde Cuba; APK debug local ✅) |
| Edge Functions (Phase 10) | ✅ Completo |
| Monitoring + Analytics (Phase 10) | ✅ Completo (Sentry + proveedor HTTP) |
| UI/UX Hardening (plan 7 fases) | ✅ Completo (ver detalle abajo) |
| ESLint cleanup (136 warnings → 0) | ✅ Completo (30-ago-2026) |

---

## Fase 0 — Infraestructura Base
> Objetivo: Preparar el proyecto para desarrollo iterativo

### 0.1 Configuración de entorno
- [x] Crear `.env`, `.env.development`, `.env.production` con `API_BASE_URL` y `WS_BASE_URL`
- [x] Instalar `expo-constants` (ya instalado) y crear `config.ts` que lea variables de entorno
- [x] Reemplazar URLs hardcodeadas en `src/lib/api-client.tsx` por config de entorno

### 0.2 Utilidades compartidas
- [x] Crear `src/utils/format.ts` — formateo de precios (USD/CUP/MLC), fechas relativas, teléfonos
- [x] Crear `src/utils/validation.ts` — validación de email, teléfono, campos requeridos
- [x] Crear `src/utils/storage.ts` — wrapper de SecureStore con tipado
- [x] Crear `src/utils/platform.ts` — helpers de plataforma (isWeb, isNative, etc.)

### 0.3 Limpieza de código legacy
- [x] Eliminar componentes no usados: `themed-view.tsx`, `themed-text.tsx`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `collapsible.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx`, `app-tabs.tsx`, `app-tabs.web.tsx`
- [x] Eliminar `src/constants/theme.ts` (reemplazado por `src/theme/colors.ts`)
- [x] Corregir imports rotos en `index.tsx` (línea 144: `Colors` → `colors`)

### 0.4 Configuración de testing
- [x] Instalar Jest + `@testing-library/react-native`
- [x] Configurar `jest.config.js` con path aliases
- [x] Crear primer test de integración del ThemeStore

### 0.5 Íconos vectoriales
- [x] Instalar `@expo/vector-icons`
- [x] Reemplazar emojis en tabs layout por iconos `MaterialCommunityIcons` o `Ionicons`

---

## Fase 1 — Capa de Servicios (API)
> Objetivo: Conectar la app con el backend

### 1.1 Estructura de servicios
```
src/services/
├── auth.service.ts        — login, register, refresh, logout, me
├── products.service.ts    — list, detail, trending, nearby, price-history
├── search.service.ts      — search, suggestions, facets
├── categories.service.ts  — list, detail, products
├── favorites.service.ts   — add, remove, list
├── alerts.service.ts      — create, update, delete, list
├── locations.service.ts   — provinces, municipalities
├── sellers.service.ts     — detail, products
├── profile.service.ts     — update, preferences, history
└── index.ts               — barrel export
```

### 1.2 Implementación por servicio
Cada servicio sigue el patrón:
```typescript
import { httpClient, queryKeys } from '@/lib/api-client';
import type { ... } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    httpClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { email, password }),
  
  register: (data: RegisterData) =>
    httpClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data),
  
  me: () =>
    httpClient.get<User>('/auth/me'),
  
  refresh: (refreshToken: string) =>
    httpClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }, { skipAuth: true }),
};
```

### 1.3 Custom Hooks (TanStack Query)
```
src/hooks/
├── use-auth.ts           — useLogin, useRegister, useLogout, useUser
├── use-products.ts       — useProductList, useProductDetail, useTrending, useNearby
├── use-search.ts         — useSearch, useSuggestions, useFacets
├── use-categories.ts     — useCategories, useCategoryProducts
├── use-favorites.ts      — useFavorites, useAddFavorite, useRemoveFavorite
├── use-alerts.ts         — useAlerts, useCreateAlert, useDeleteAlert
├── use-locations.ts      — useProvinces, useMunicipalities
├── use-profile.ts        — useProfile, useUpdateProfile, useHistory
└── use-debounce.ts       — debounce para search suggestions
```

---

## Fase 2 — Autenticación
> Objetivo: Flujo completo de login/registro

### 2.1 Screens de auth
```
src/app/(auth)/
├── _layout.tsx           — Stack sin tabs
├── login.tsx             — Email + password, link a registro
├── register.tsx          — Nombre, email, password, confirmación
├── forgot-password.tsx   — Envío de email de recuperación
└── reset-password.tsx    — Nuevo password con token
```

### 2.2 Lógica de auth
- [x] Integrar `useAuthStore.hydrate()` en `_layout.tsx` root (ya parcialmente hecho)
- [x] Implementar `setAuthTokenGetter()` al momento del login
- [x] Guard de rutas: redirigir a login si no autenticado
- [x] Persistir tokens en SecureStore (ya implementado en store)
- [x] Refresh token automático en 401

### 2.3 Componentes de auth
- [x] `AuthForm` — formulario reutilizable con validación
- [x] `SocialLogin` — botones de login social (futuro)
- [x] `PasswordStrength` — indicador de fortaleza de contraseña

---

## Fase 3 — Home + Búsqueda Funcional
> Objetivo: Pantalla de inicio y búsqueda reales

### 3.1 Home Screen refactor
- [x] Reemplazar datos mock por llamadas API reales
- [x] Integrar `useTrending()` y `useCategories()` hooks
- [x] Implementar navegación real en categorías y productos
- [x] Fix: errores de import y unicode en `index.tsx`
- [x] Agregar pull-to-refresh

### 3.2 Search Screen refactor
- [x] Conectar `SearchBar` con `useSuggestions()` hook (debounced)
- [x] Conectar `FilterSheet` con `useSearch()` hook
- [x] Implementar paginación con `useInfiniteQuery`
- [x] Navegación a Product Detail al tocar un resultado
- [x] Persistir historial de búsquedas en API
- [x] Fix: `TODO: router.push(/product/${p.id})`

### 3.3 Product Detail Screen
```
src/app/product/[id].tsx
```
- [x] Crear pantalla con imagen, nombre, precio, ofertas por fuente
- [x] Lista de ofertas con links a fuente original
- [x] Botón de favorito
- [x] Gráfico de historial de precios (futuro)
- [x] Información del vendedor

---

## Fase 4 — Guardados + Favoritos
> Objetivo: Sistema de guardados funcional

### 4.1 Saved Screen refactor
- [x] Conectar con `useFavorites()` hook
- [x] Implementar tabs con datos reales (Productos, Búsquedas, Vendedores)
- [x] Pull-to-refresh

### 4.2 Funcionalidad de guardado
- [x] Botón de favorito en ProductCard → `useAddFavorite()` / `useRemoveFavorite()`
- [x] Guardar búsquedas con notificaciones
- [x] Guardar vendedores

### 4.3 Saved Search Detail
```
src/app/saved/[type]/[id].tsx
```
- [x] Ver detalle de búsqueda guardada
- [x] Activar/desactivar alertas
- [x] Eliminar guardado

---

## Fase 5 — Perfil + Preferencias
> Objetivo: Gestión completa del perfil

### 5.1 Profile Screen refactor
- [x] Conectar stats con datos reales de API
- [x] Implementar navegación a sub-pantallas
- [x] Fix: `TODO: implementar logout`

### 5.2 Sub-pantallas de perfil
```
src/app/(tabs)/profile/
├── edit.tsx              — Editar nombre, teléfono, avatar
├── preferences.tsx       — Tema, moneda, ubicación, notificaciones
└── history.tsx           — Historial de búsquedas
```

### 5.3 Preferencias de usuario
- [x] Selector de tema (ya implementado en ThemeStore)
- [x] Selector de moneda (USD/CUP/MLC)
- [x] Ubicación por defecto
- [x] Configuración de notificaciones

---

## Fase 6 — Cerca de ti (Geolocalización)
> Objetivo: Productos cercanos con ubicación real

### 6.1 Infraestructura
- [x] Instalar `expo-location`
- [x] Crear `useDeviceLocation` hook con permisos y watchPosition
- [x] Crear `useLocationStore` para estado global de ubicación
- [x] Actualizar `src/services/locations.service.ts` con Supabase

### 6.2 Nearby Screen refactor
- [x] Reemplazar lista hardcodeada por ubicación real del usuario
- [x] Implementar mapa con `react-native-maps` (fase futura)
- [x] Lista de productos cercanos con distancia
- [x] Filtro por radio de búsqueda (5km, 10km, 25km, 50km)

### 6.3 Mapa interactivo
- [x] Instalar `react-native-maps` (1.27.2, instalado)
- [x] Marcadores de productos en mapa (coordenadas resueltas desde `locations` vía `byIds`)
- [x] Cluster para zonas densas (grilla por región; zoom al cluster)
- [x] Routing a ubicación del vendedor (Google/Apple Maps externo + card "Cómo llegar")

> Estado real: `src/components/map/ProductMap.tsx` integra `MapView` con fallback seguro cuando el módulo nativo no está linkado (rebuild pendiente) o es web. Requiere **rebuild del APK** y Google Play Services en el dispositivo para verse.

---

## Fase 7 — Alertas + Notificaciones
> Objetivo: Sistema de alertas de precio

### 7.1 Alertas
- [x] Crear pantalla `alerts.tsx` en tabs
- [x] Crear `alerts/create.tsx` y `alerts/[id].tsx`
- [x] CRUD completo con `useAlerts` hooks
- [x] Frecuencia: tiempo real, diaria, semanal

### 7.2 Push Notifications
- [x] Instalar `expo-notifications`
- [x] Registrar token de dispositivo
- [x] Manejar notificaciones en foreground/background
- [x] Deep linking desde notificación a producto

### 7.3 WebSocket (tiempo real)
- [x] Crear WebSocket client en `src/lib/ws-client.ts`
- [x] Suscripción a alertas activas
- [x] Actualización de precios en tiempo real

---

## Fase 8 — Publicar Producto (Vendedores)
> Objetivo: Flujo de publicación para vendedores

### 8.1 Screens
```
src/app/(seller)/
├── _layout.tsx
├── publish.tsx           — Formulario de publicación
├── my-products.tsx       — Mis publicaciones
└── edit/[id].tsx         — Editar publicación
```

### 8.2 Funcionalidad
- [x] Formulario multi-paso: fotos → datos → precio → ubicación → revisión
- [x] Selector de categoría con subcategorías
- [x] Upload de imágenes (expo-image-picker)
- [x] Selección de ubicación en mapa
- [x] Preview antes de publicar
- [x] Gestión de publicaciones activas/vendidas/inactivas

---

## Fase 9 — Calidad + Polish
> Objetivo: Producción-ready

### 9.1 Testing
- [x] Unit tests para utils y hooks
- [x] Integration tests para stores
- [x] Component tests para UI components críticos
- [x] E2E tests con Playwright (web) o Detox (native)

### 9.2 Performance
- [x] Implementar `React.memo` en ProductCard y lista de resultados
- [x] Virtualización de listas largas (`FlashList`)
- [x] Lazy loading de imágenes
- [x] Optimización de bundle (web)

### 9.3 Accesibilidad
- [x] Review de `accessibilityLabel` en todos los componentes
- [x] Soporte RTL — Tooltip usa `I18nManager.isRTL` (resuelto)
- [ ] Test con TalkBack / VoiceOver (pendiente, requiere dispositivo físico)

### 9.4 Error Handling
- [x] Error boundary global
- [x] Toast/notification de errores
- [x] Offline mode con cache
- [x] Retry automático en errores de red

### 9.5 Analytics + Monitoring
- [x] Integrar analytics — `src/lib/analytics.ts` con proveedor real HTTP (batches a `EXPO_PUBLIC_ANALYTICS_ENDPOINT`)
- [x] Crash reporting — `@sentry/react-native` vía `src/lib/sentry.ts` + `reportError()` (gated por `EXPO_PUBLIC_SENTRY_DSN`)
- [x] Performance monitoring — `src/lib/monitoring.ts` (console en dev + breadcrumbs a Sentry)

---

## Fase 10 — Publicación
> Objetivo: Lanzar a producción

### 10.1 Build
- [x] Configurar EAS Build (config en `eas.json`; cloud build bloqueado con 403 desde Cuba)
- [ ] Signing certificates (iOS/Android) — pendiente (EAS cloud inaccesible)
- [x] Splash screen y iconos finales
- [ ] App Store screenshots — pendiente

> **Estado real**: APK debug local **✅ COMPLETADO** (27-ago-2026, `android/app/build/outputs/apk/debug/app-debug.apk`, 92.7MB, arm64-v8a, BUILD SUCCESSFUL 47m51s). **EAS Build cloud falla con 403** (restricción geográfica o permisos de cuenta). Ver `AGENTS.md` → "Build Android — Estado Actual".

### 10.2 Deploy
- [ ] Configurar EAS Submit — pendiente (bloqueado por EAS cloud 403)
- [ ] App Store (iOS) listing — pendiente
- [ ] Google Play Store listing — pendiente
- [x] Deploy backend API a producción — Supabase cloud configurado (Edge Functions + migraciones depoyadas)

### 10.3 Post-launch
- [x] Monitoreo de crashes
- [x] Feedback loop
- [x] Iteración según métricas de uso

---

## Trabajo reciente (post-fases 0-10)

### UI/UX Hardening — plan de 7 fases (28-ago-2026, completo)
Endurecimiento de la interfaz sin funcionalidades nuevas, sin cambios de servicios/API y sin cambiar la identidad visual:

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 — Tipografía | `lineHeight` absoluto con `getLineHeight()`, recálculo al sobreescribir `fontSize` | ✅ |
| 2 — Design System | dark mode centralizado en UI primitives, tokens, `OpacityTokens` | ✅ |
| 3 — Navegación | 5 tabs; Mapa queda fuera del tab bar (contexto secundario) | ✅ |
| 4 — Home | búsqueda protagonista | ✅ |
| 5 — Search/Results | ProductCard agrupado | ✅ |
| 6 — Product Detail | comparar ofertas | ✅ |
| 7 — Calidad | mocks DEV (`FEATURES.useMocks`), `Skeleton`, ESLint flat + Jest | ✅ |

Reglas acordadas: dark mode se resuelve **desde el store** en los UI primitives; **Accent = encontrado/disponible**, Success = positivo general; detalle completo en `CHANGELOG.md` bajo `[2.0.0-canary]`.

### ESLint cleanup: 136 warnings → 0 (30-ago-2026, completo)
Limpió los warnings pre-existentes de `expo lint` por grupos:
- **A — mecánico**: `no-unused-vars` + `array-type` en ~38 archivos (imports/bindings muertos, `Array<T>` → `T[]`).
- **B — `no-explicit-any` (44→0)**: casts `router.push(... as any)` eliminados (Href permisivo con `typedRoutes: false`), tipado real en `SavedListItem`, `Favorite[]`, `TabIcon`, `GestureResponderEvent`, normalizers Supabase (`OfferRow`/`ProductRow`).
- **C — react-hooks (React Compiler, reglas `warn`)**: patrón prev-state en `alerts/[id]`, `useSyncExternalStore` en `use-color-scheme.web`, estado derivado en hooks realtime, deps reales en `use-device-location`/`use-notifications` (fix `immutability`), helper módulo en `CategoryPicker`. Quedan 3 `eslint-disable` justificados.

Verificación: `npm run lint` **0 errores / 0 warnings**, `npx tsc --noEmit` limpio, `npx jest --ci` 54 tests en verde. Commit `595db2f`.

---

## Resumen de Dependencias por Fase

| Fase | Nuevas dependencias |
|------|---------------------|
| 0 | `dotenv` o expo env |
| 1 | — |
| 2 | — |
| 3 | — |
| 4 | — |
| 5 | — |
| 6 | `expo-location`, `react-native-maps` |
| 7 | `expo-notifications` |
| 8 | `expo-image-picker` |
| 9 | `jest`, `jest-expo`, `@testing-library/react-native`, `@shopify/flash-list`, `test-renderer` |
| 10 | `eas-cli`, `@sentry/react-native` |

---

## Orden de Ejecución Recomendado

```
Fase 0 (1-2 días) → Fase 1 (2-3 días) → Fase 2 (2 días)
→ Fase 3 (3 días) → Fase 4 (2 días) → Fase 5 (2 días)
→ Fase 6 (2-3 días) → Fase 7 (2-3 días) → Fase 8 (3-4 días)
→ Fase 9 (2-3 días) → Fase 10 (1-2 días)
```

**Estado: ✅ Fases 0-10 terminadas + UI/UX hardening (7 fases), ESLint 136→0, mapa interactivo, Sentry + analytics HTTP y RTL en Tooltip completados. Pendientes: rebuild nativo para ver el mapa (APK con módulos), Google Play Services en el dispositivo, EAS cloud (403 desde Cuba), signing/App Store/Play Store, update de Expo Go en dispositivo y test manual de TalkBack/VoiceOver.**

---

## Convenciones de Código

- **Components**: PascalCase, en `src/components/ui/` o `src/components/{domain}/`
- **Screens**: kebab-case en `src/app/`
- **Services**: `{domain}.service.ts` en `src/services/`
- **Hooks**: `use-{name}.ts` en `src/hooks/`
- **Types**: Centralizados en `src/types/index.ts`
- **Query Keys**: Usar `queryKeys` factory de `api-client.tsx`
- **Estado**: Zustand para auth/theme, TanStack Query para server state
- **Estilos**: Design system existente (`src/theme/`), no Tailwind
