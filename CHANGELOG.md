# Changelog

Todas las cambios notables de Dónde Hay se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

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