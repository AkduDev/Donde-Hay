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
- **WebSocket**: Socket.IO para tiempo real
- **Testing**: Jest + React Native Testing Library
- **TypeScript**: v6 estricto

## Arquitectura

```
src/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Home, Favorites, Alerts, Profile
│   ├── (auth)/            # Login, Register, Forgot/Reset Password
│   └── _layout.tsx        # Root layout con auth guard
├── components/            # Componentes reutilizables
│   ├── ui/                # Design system (Box, Text, Button, Input, etc.)
│   ├── product/           # ProductCard, ProductList, SourceChip
│   └── search/            # SearchBar, FilterPanel, ResultsGrid
├── config.ts              # Centralizada: API URLs, Cuban sources, timeouts
├── hooks/                 # Custom hooks (use-auth, use-products, use-search, etc.)
├── lib/                   # API client, React Query provider
├── services/              # API services (auth, products, search, categories, etc.)
├── store/                 # Zustand stores (auth, location, theme, etc.)
├── theme/                 # Design tokens (colors, spacing, typography, radius)
├── types/                 # TypeScript interfaces y types
└── utils/                 # Utilities (format, validation, storage, platform)
```

## Convenciones de Código

### Diseño
- **Tokens de spacing**: Usar strings (`"xxxs"`, `"xxs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"xxl"`)
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
| `src/services/index.ts` | Barrel export de todos los services |
| `src/hooks/index.ts` | Barrel export de todos los hooks |
| `src/store/authStore.ts` | Zustand auth store con JWT refresh |
| `src/types/index.ts` | Interfaces: Product, SearchFilters, User, etc. |
| `src/theme/colors.ts` | Light/dark mode palettes |
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
```

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

- **403 pre-existentes**: Archivos legacy no modificados, no afectan nuevo código
- **ESLint 10.x**: Configuración en parent `eslint.config.mjs` causa conflictos, ignorado
- **Typed routes**: Requiere regenerar `.expo/types/router.d.ts` al agregar nuevas rutas

## Plan de Desarrollo

Ver `IMPLEMENTATION_PLAN.md` para el plan completo de 10 fases.
