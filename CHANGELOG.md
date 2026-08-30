# Changelog

Todas las cambios notables de Dónde Hay se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [2.0.0-canary] - 2026-08-28

> UI/UX Hardening — plan de 7 fases aprobado (tipografía → design system → navegación → home → search/results → product detail → calidad). Se documenta por fases según se van cumpliendo.

### FASE 1 — Tipografía (completada)
- **`Text.tsx` recalcula `lineHeight` al sobreescribir `fontSize`**: antes, `Badge`, `Avatar`, `Button` e `Input` pasaban `fontSize` por prop (10/11/13/14/16/18/28) y el `lineHeight` del variant no se recalculaba (p.ej. Badge con fontSize 13 mantenían lineHeight 10 → texto recortado). Ahora se deriva el ratio del variant y se aplica `getLineHeight(ratio, nuevoFontSize)`; el prop `lineHeight` explícito sigue teniendo prioridad.
- **Escala `FontSizes` con token `xxs: 11`** y mapeo de todos los fontSizes hardcoded del design system a tokens: `Badge` (10/11/12/13), `Avatar` (10/12/14/16/20/28), `Button` (11/12/14/16/18), `Input` (13/14/16), `SearchBar` (16).
- **Eliminado `lineHeight: 16` suelto** en `ImagePicker.tsx` (contradecía el variant `labelSmall`).
- **Nuevos tokens `OpacityTokens`** (`pressed: 0.7`, `disabled: 0.6`) en `colors.ts`; reemplazado el patrón `opacity: pressed ? 0.7 : 1` en SortSelector, preferences, profile y Home, y el `0.6` de disabled en Button.
- **Eliminado** el token muerto `LineHeights.loose`.
- `npx tsc --noEmit` ✅. Verificación visual en Android (light/dark) pendiente de la FASE 2.

### FASE 2 — Design System: dark mode centralizado + tokens (completada)
- **Dark mode resuelto desde el store en todos los UI primitives**: `Text`, `Box`, `Badge`, `Avatar`, `Button`, `Input`, `Divider`, `Spinner`, `Card` (+ `CardHeader`/`CardContent`/`CardFooter`), `Modal`, `Sheet`, `Tooltip` y `Toast` ya no asumen `mode = 'light'`. Cada primitivo lee `useThemeStore().resolvedMode` y lo usa como default cuando no llega la prop `mode` (decisión aprobada: `resolved = mode ?? resolvedMode`). Los callers que pasaban `mode={resolvedMode}` explícito se conservan y siguen funcionando igual.
- **`themeStore.initialize()` escucha cambios del sistema**: `Appearance.addChangeListener` (único, con guard `appearanceSubscription`) para reaccionar a light/dark del SO cuando `mode === 'system'`.
- **zIndex 9999 → tokens `ZIndex`**: `Toast` (`ZIndex.toast`), `Tooltip` (`ZIndex.tooltip`) y overlay de `Spinner` (`ZIndex.loading`).
- **Eliminado `SemanticColors`** (dead code ~45 líneas con referencias `{token}` que nunca se resolvieron): se exportaba en `colors.ts` y `theme/index.ts`.
- **Regla semántica aprobada "Accent = encontrado/disponible"**: `statusAvailable` ahora usa el verde accent (`#00C896` light / `#00D9A5` dark) en vez de `#22C55E`; `statusOld` y `statusUnknown` se mantienen.
- **`Box.bg` acepta token de paleta o valor crudo** (`isPaletteColor`), reemplazando la prop `bgColor` eliminada.
- **`Toast` reescrito con tokens**: config `success/error/warning/info` mapea a `success/error/warning/primary` con fg `on*`, zIndex token y altura safe-area superior.
- **Bordes hardcoded `#333/#e5e7eb` → `colors.divider`** en `SavedSellerCard`, `SavedSearchCard`, `(tabs)/saved.tsx`, `profile/preferences.tsx` y `profile/edit.tsx`.
- **`#2563EB` duplicados → `colors.primary`**: underline del tab activo y `RefreshControl` en `(tabs)/saved.tsx`; `Switch.trackColor` en `profile/preferences.tsx`.
- **Limpieza de `Spacing`**: eliminado `Spacing.radius` (los radios viven en `BorderRadius` de `radius.ts`) y movido `import { Platform }` al tope de `spacing.ts`.
- `npx tsc --noEmit` ✅. Verificación visual Android (light/dark) pendiente.

### FASE 3 — Navegación: 5 tabs, Mapa fuera del tab bar (completada)
- **Mapa fuera del tab bar** (decisión aprobada): la pantalla de productos cercanos se movió de `(tabs)/nearby.tsx` a `src/app/map.tsx` como ruta root del Stack → el tab bar pasa de 6 a **5 tabs** (Inicio, Buscar, Guardados, Alertas, Perfil).
- **Entrada secundaria desde results**: botón "🗺️ Mapa" en el header de `results.tsx` (mismo contexto de resultados en una vista geográfica).
- **Header del mapa con botón de retroceso** (`←`) para volver desde la vista empujada (antes no había forma de regresar sin tab bar).
- `map` registrado explícitamente en el Stack raíz (`headerShown: false` — mantiene el layout custom con `SafeAreaView`).
- Nota: `.expo/types/router.d.ts` (typed routes) se regenera al correr `expo start`; está gitignored. Los `router.push` a `/map` usan cast para no depender de la generación.
- `npx tsc --noEmit` ✅.

### FASE 4 — Home: búsqueda protagonista (completada)
- **`SearchBar` con prop `size` (`'md'` | `'lg'`)**: el Home usa la variante `lg` (56dp, tipografía `xl`) como elemento protagonista — primera interacción de la pantalla con placeholder "Encuentra lo que buscas hoy...".
- **Tendencias convertidas en "buscan ahora"**: las búsquedas trending pasan a chips compactos en scroll horizontal, colocados inmediatamente bajo el buscador (refuerzan la acción de buscar), con `Pressable` + `OpacityTokens` en vez de botones `outline`.
- **Categorías compactadas a pills horizontales** (icono + nombre, `borderRadius="full"` en scroll horizontal) en lugar de la cuadrícula `width: 23%` — libera espacio vertical para que el buscador quede sobre el fold.
- Eliminado `Button` (import sin uso) de `(tabs)/index.tsx`.
- `npx tsc --noEmit` ✅.

### FASE 5 — Search/Results: ProductCard agrupado (completada)
- **Nueva variante `accent` en `Badge`** (`accentContainer`/`accent`) para la regla semántica "Accent = encontrado/disponible".
- **`ProductCard` usa accent para disponibilidad**: el estado "Reciente" (encontrado/disponible) ahora renderiza con la variante `accent` (antes `success`); "Esta semana" = warning, "Antiguo" = default.
- **Lista de ofertas agrupadas con identidad de fuente**: en lugar del `sourceId` crudo, cada oferta muestra su icono (`getSourceIcon`) + nombre ("Revolico", "1Cuba", "CholesLibres"...).
- **Nuevo prop `showFavorite`** en `ProductCard` (default `true`, sin cambio de comportamiento en callers existentes) para ocultar el corazón cuando el contexto no lo maneja.
- **Pestaña Search unificada al `ProductCard` agrupado**: se eliminó el card duplicado hecho a mano (imagen + minPrice + chips), que no mostraba agrupación de ofertas ni disponibilidad. Los resultados de `useMultiSourceSearch` ahora usan el `ProductCard` agrupado (`layout="list"`, `showFavorite={false}`) con min-precio, "en N ofertas", badges de disponibilidad accent y nombre real de fuente.
- Limpieza: imports sin uso eliminados en `(tabs)/search.tsx` (`Image`, `SourceChip`, `getColors`) y en `ProductCard` (agrega `getSourceIcon`).
- `npx tsc --noEmit` ✅.

### FASE 6 — Product Detail: comparar ofertas (completada)
- **Disponibilidad con semántica accent**: el estado "Reciente" (encontrado/disponible) usa `accent` (regla approbada); "Esta semana" = warning, "Antiguo" = default.
- **Delta de ahorro por oferta**: cada oferta que no es la menor muestra `+$X vs menor` bajo el precio, para dimensionar el diferencial al comparar (regla "Accent = encontrado/disponible, Success = positivo general": la menor oferta conserva `success`).
- **Acceso al mapa desde el detail**: el card de mejor precio incluye la entrada "🗺️ Ver cerca en el mapa" (contexto secundario Mapa, como en results Fase 3) que navega a `/map`, con borde primary para no confundirse con la acción principal.
- `npx tsc --noEmit` ✅.

### FASE 7 — Calidad: mocks DEV, Skeleton, ESLint flat + Jest (completada 30-ago-2026)

- **Skeleton** (`src/components/ui/Skeleton.tsx`): esqueleto con pulso Animated, bg `surfaceVariant`, mediante tokens del theme (getColors/spacing/radius). Acompañado de `ProductCardSkeleton` (`src/components/product/`) con layouts `list`/`grid` y prop `count`.
- **Loading states con skeletons**: Home (3 bloques: list + 2 grids horizontales), Results (count=6), Search tab (count=4 + hint "Buscando en todas las fuentes..."), Product detail (imagen 300h + líneas de detalle). Spinners remanentes sin uso eliminados.
- **Mocks DEV**: flag `FEATURES.useMocks` en `src/config.ts` (env `EXPO_PUBLIC_USE_MOCKS`, default false) + dataset tipado `MOCK_PRODUCTS` en `src/mocks/products.ts` (5 productos con ofertas). Home muestra: `productsResponse?.data ?? (FEATURES.useMocks ? MOCK_PRODUCTS : [])`.
- **ESLint flat**: nuevo `eslint.config.js` (eslint-config-expo/flat, reglas react-hooks de React Compiler a `warn`), `.eslintrc.js` legacy eliminado. **eslint bajado a 9.39.5** (10.8.1 crasheaba con eslint-plugin-react 7.37.5: `contextOrFilename.getFilename is not a function`). `npm run lint`: **0 errores** (136 warnings pre-existentes).
- **Jest funcionando**: `jest-expo@57.0.5`, `jest@30.5.0`, `@react-native/jest-preset@0.86.2` (versionado con RN 0.86.2, jamás @latest — el 0.87.1 rompía `react-native/setup-env`), `@testing-library/react-native@14.0.1` (API async: `await render()` + `screen`) y `test-renderer@^1.0.0` (nuevo renderer peer de RNTL v14, reemplaza a react-test-renderer). Corregido typo `setupFilesAfterSetup` → `setupFilesAfterEnv`.
- **`jest.setup.js` despojado**: ya NO hace `require('expo-router/entry')` — bootstrappea la app y crashea en Node (`window.location` null).
- **Tests (54 en verde)**: `format` (sanitizado contra la API real), `validation` (cobertura completa de funciones) y smoke de UI primitives (`Text`, `Badge`, `Box` con RNTL).
- **Cleanups**: `src/theme/index.ts` sin re-exports duplicados; `search.tsx` sin entidades sin escapar; purity en `product/[id].tsx` (`useState(() => Date.now())`).
- `npx tsc --noEmit` ✅.

## [1.1.0] - 2026-08-28

### Arreglado
- **`lineHeight` absoluto en el Design System de tipografía** (`src/theme/typography.ts`): React Native interpreta `lineHeight` como valor absoluto en dp, no como multiplicador. Los ratios de `LineHeights` (1, 1.1, 1.25, 1.5, 1.625, 2) se usaban directo y aplastaban el texto en Android. Ahora todas las `TypographyVariants` calculan el valor absoluto con `getLineHeight(ratio, fontSize)`; los ratios quedan como referencia.
- **Crash de Hermes con `Intl.RelativeTimeFormat`** (`src/utils/format.ts`): el uso a nivel de módulo crasheaba todo el bundle en Android (errores en cascada). Se usa `Intl` solo si está disponible, con inicialización perezosa y fallback manual en español (`hace X min / en X horas`).
- **Hook inválido en Zustand** (`src/store/themeStore.ts`): `useColorScheme()` era llamado dentro de acciones del store (fuera del render). Reemplazado por `Appearance.getColorScheme()` de react-native.
- **Login no obligatorio**: se eliminó el auth guard de `src/app/_layout.tsx`; la app abre directo en Home (`initialRouteName="(tabs)"`). Iniciar sesión es opcional.
- **Ruta `/search` duplicada**: la pantalla de resultados `src/app/search.tsx` colisionaba con el tab `(tabs)/search.tsx`. Renombrada a `src/app/results.tsx`; actualizadas las navegaciones en Home, Saved, Search y Alerts.
- **Navegación a `/login` inexistente** en `(tabs)/alerts.tsx` → corregido a `/(auth)/login`.
- **Búsqueda sin backend**: `search.service.ts` consultaba un backend en `localhost:3000` (inexistente en el dispositivo) → `ConnectException` y resultados vacíos. `search()`/`searchDB()` consultan Supabase directamente (ILIKE sobre nombre/marca/modelo/descripción, filtros y normalización snake_case→camelCase) y `searchRevolico` se omite silenciosamente cuando la URL apunta a localhost fuera de web.
- **Tab bar sobre la barra del sistema Android**: solapaba la barra de navegación del sistema. Corregido con `useSafeAreaInsets()` en `(tabs)/_layout.tsx` (height `60 + insets.bottom`, paddingBottom `Math.max(insets.bottom, 8)`).
- **Pestaña Mapa mal renderizada**: `(tabs)/nearby.tsx` se auto-agregaba como tab sin icono y con el nombre inglés "Nearby". Configurada como tab "Mapa" con icono `map`/`map-outline`.
- **`resizeMode` deprecado en expo-image**: reemplazado por `contentFit` en todos los `Image` de expo-image.

### Añadido
- `metro.config.js`: `blockList` que excluye directorios corruptos NTFS en `node_modules` (`expo-dev-launcher/android/build-corrupt`) que hacían fallar Metro con `I/O error scandir`.

## [1.0.0] - 2026-08-27

- Webapp inicial: agregador de productos para Cuba con búsqueda multi-fuente (Revolico, Facebook, Instagram, Telegram, 1Cuba, CholesLibres, comunidad).
- Autenticación con Supabase, guardados, alertas de precio, geolocalización y publicación de productos (5 pasos) completos.
- Build local exitoso del APK de debug (arm64-v8a) tras instalar las toolchain Linux del Android SDK (build-tools, CMake, Ninja y NDK r27b).