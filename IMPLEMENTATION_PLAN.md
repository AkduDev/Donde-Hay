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
| Geolocation (Phase 6) | ✅ Completo |
| Alerts + Push (Phase 7) | ✅ Completo |
| WebSocket/Real-time (Phase 7.3) | ✅ Completo |
| Publish Product (Phase 8) | ✅ Completo |
| Saved (Phase 4) | ✅ Completo |
| Profile (Phase 5) | ✅ Completo |
| Testing (Phase 9.1) | ✅ Completo |
| Performance (Phase 9.2) | ✅ Completo |
| Accessibility (Phase 9.3) | ✅ Completo |
| Error Handling (Phase 9.4) | ✅ Completo |
| EAS Build + Submit (Phase 10) | ✅ Completo |
| Edge Functions (Phase 10) | ✅ Completo |
| Monitoring + Analytics (Phase 10) | ✅ Completo |

---

## Fase 0 — Infraestructura Base
> Objetivo: Preparar el proyecto para desarrollo iterativo

### 0.1 Configuración de entorno
- [ ] Crear `.env`, `.env.development`, `.env.production` con `API_BASE_URL` y `WS_BASE_URL`
- [ ] Instalar `expo-constants` (ya instalado) y crear `config.ts` que lea variables de entorno
- [ ] Reemplazar URLs hardcodeadas en `src/lib/api-client.tsx` por config de entorno

### 0.2 Utilidades compartidas
- [ ] Crear `src/utils/format.ts` — formateo de precios (USD/CUP/MLC), fechas relativas, teléfonos
- [ ] Crear `src/utils/validation.ts` — validación de email, teléfono, campos requeridos
- [ ] Crear `src/utils/storage.ts` — wrapper de SecureStore con tipado
- [ ] Crear `src/utils/platform.ts` — helpers de plataforma (isWeb, isNative, etc.)

### 0.3 Limpieza de código legacy
- [ ] Eliminar componentes no usados: `themed-view.tsx`, `themed-text.tsx`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `collapsible.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx`, `app-tabs.tsx`, `app-tabs.web.tsx`
- [ ] Eliminar `src/constants/theme.ts` (reemplazado por `src/theme/colors.ts`)
- [ ] Corregir imports rotos en `index.tsx` (línea 144: `Colors` → `colors`)

### 0.4 Configuración de testing
- [ ] Instalar Jest + `@testing-library/react-native`
- [ ] Configurar `jest.config.js` con path aliases
- [ ] Crear primer test de integración del ThemeStore

### 0.5 Íconos vectoriales
- [ ] Instalar `@expo/vector-icons`
- [ ] Reemplazar emojis en tabs layout por iconos `MaterialCommunityIcons` o `Ionicons`

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
- [ ] Integrar `useAuthStore.hydrate()` en `_layout.tsx` root (ya parcialmente hecho)
- [ ] Implementar `setAuthTokenGetter()` al momento del login
- [ ] Guard de rutas: redirigir a login si no autenticado
- [ ] Persistir tokens en SecureStore (ya implementado en store)
- [ ] Refresh token automático en 401

### 2.3 Componentes de auth
- [ ] `AuthForm` — formulario reutilizable con validación
- [ ] `SocialLogin` — botones de login social (futuro)
- [ ] `PasswordStrength` — indicador de fortaleza de contraseña

---

## Fase 3 — Home + Búsqueda Funcional
> Objetivo: Pantalla de inicio y búsqueda reales

### 3.1 Home Screen refactor
- [ ] Reemplazar datos mock por llamadas API reales
- [ ] Integrar `useTrending()` y `useCategories()` hooks
- [ ] Implementar navegación real en categorías y productos
- [ ] Fix: errores de import y unicode en `index.tsx`
- [ ] Agregar pull-to-refresh

### 3.2 Search Screen refactor
- [ ] Conectar `SearchBar` con `useSuggestions()` hook (debounced)
- [ ] Conectar `FilterSheet` con `useSearch()` hook
- [ ] Implementar paginación con `useInfiniteQuery`
- [ ] Navegación a Product Detail al tocar un resultado
- [ ] Persistir historial de búsquedas en API
- [ ] Fix: `TODO: router.push(/product/${p.id})`

### 3.3 Product Detail Screen
```
src/app/product/[id].tsx
```
- [ ] Crear pantalla con imagen, nombre, precio, ofertas por fuente
- [ ] Lista de ofertas con links a fuente original
- [ ] Botón de favorito
- [ ] Gráfico de historial de precios (futuro)
- [ ] Información del vendedor

---

## Fase 4 — Guardados + Favoritos
> Objetivo: Sistema de guardados funcional

### 4.1 Saved Screen refactor
- [ ] Conectar con `useFavorites()` hook
- [ ] Implementar tabs con datos reales (Productos, Búsquedas, Vendedores)
- [ ] Pull-to-refresh

### 4.2 Funcionalidad de guardado
- [ ] Botón de favorito en ProductCard → `useAddFavorite()` / `useRemoveFavorite()`
- [ ] Guardar búsquedas con notificaciones
- [ ] Guardar vendedores

### 4.3 Saved Search Detail
```
src/app/saved/[type]/[id].tsx
```
- [ ] Ver detalle de búsqueda guardada
- [ ] Activar/desactivar alertas
- [ ] Eliminar guardado

---

## Fase 5 — Perfil + Preferencias
> Objetivo: Gestión completa del perfil

### 5.1 Profile Screen refactor
- [ ] Conectar stats con datos reales de API
- [ ] Implementar navegación a sub-pantallas
- [ ] Fix: `TODO: implementar logout`

### 5.2 Sub-pantallas de perfil
```
src/app/(tabs)/profile/
├── edit.tsx              — Editar nombre, teléfono, avatar
├── preferences.tsx       — Tema, moneda, ubicación, notificaciones
└── history.tsx           — Historial de búsquedas
```

### 5.3 Preferencias de usuario
- [ ] Selector de tema (ya implementado en ThemeStore)
- [ ] Selector de moneda (USD/CUP/MLC)
- [ ] Ubicación por defecto
- [ ] Configuración de notificaciones

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
- [ ] Implementar mapa con `react-native-maps` (fase futura)
- [x] Lista de productos cercanos con distancia
- [x] Filtro por radio de búsqueda (5km, 10km, 25km, 50km)

### 6.3 Mapa interactivo (fase futura)
- [ ] Instalar `react-native-maps`
- [ ] Marcadores de productos en mapa
- [ ] Cluster para zonas densas
- [ ] Routing a ubicación del vendedor

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
- [ ] Crear WebSocket client en `src/lib/ws-client.ts`
- [ ] Suscripción a alertas activas
- [ ] Actualización de precios en tiempo real

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
- [ ] Formulario multi-paso: fotos → datos → precio → ubicación → revisión
- [ ] Selector de categoría con subcategorías
- [ ] Upload de imágenes (expo-image-picker)
- [ ] Selección de ubicación en mapa
- [ ] Preview antes de publicar
- [ ] Gestión de publicaciones activas/vendidas/inactivas

---

## Fase 9 — Calidad + Polish
> Objetivo: Producción-ready

### 9.1 Testing
- [ ] Unit tests para utils y hooks
- [ ] Integration tests para stores
- [ ] Component tests para UI components críticos
- [ ] E2E tests con Playwright (web) o Detox (native)

### 9.2 Performance
- [ ] Implementar `React.memo` en ProductCard y lista de resultados
- [ ] Virtualización de listas largas (`FlashList`)
- [ ] Lazy loading de imágenes
- [ ] Optimización de bundle (web)

### 9.3 Accesibilidad
- [ ] Review de `accessibilityLabel` en todos los componentes
- [ ] Soporte RTL (TODO en Tooltip)
- [ ] Test con TalkBack / VoiceOver

### 9.4 Error Handling
- [ ] Error boundary global
- [ ] Toast/notification de errores
- [ ] Offline mode con cache
- [ ] Retry automático en errores de red

### 9.5 Analytics + Monitoring
- [ ] Integrar analytics (Expo Analytics, Mixpanel, o similar)
- [ ] Crash reporting (Sentry)
- [ ] Performance monitoring

---

## Fase 10 — Publicación
> Objetivo: Lanzar a producción

### 10.1 Build
- [ ] Configurar EAS Build
- [ ] Signing certificates (iOS/Android)
- [ ] Splash screen y iconos finales
- [ ] App Store screenshots

### 10.2 Deploy
- [ ] Configurar EAS Submit
- [ ] App Store (iOS) listing
- [ ] Google Play Store listing
- [ ] Deploy backend API a producción

### 10.3 Post-launch
- [ ] Monitoreo de crashes
- [ ] Feedback loop
- [ ] Iteración según métricas de uso

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
| 9 | `jest`, `@testing-library/react-native`, `@shopify/flash-list` |
| 10 | `eas-cli`, `sentry` |

---

## Orden de Ejecución Recomendado

```
Fase 0 (1-2 días) → Fase 1 (2-3 días) → Fase 2 (2 días)
→ Fase 3 (3 días) → Fase 4 (2 días) → Fase 5 (2 días)
→ Fase 6 (2-3 días) → Fase 7 (2-3 días) → Fase 8 (3-4 días)
→ Fase 9 (2-3 días) → Fase 10 (1-2 días)
```

**Estimación total: ~25-30 días de desarrollo**

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
