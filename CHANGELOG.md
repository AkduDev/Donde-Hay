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