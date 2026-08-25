/**
 * Dónde Hay - EAS Build & Submit Metadata
 * Constants for build identification and store listings
 */

export const BUILD_CONFIG = {
  appName: 'Dónde Hay',
  bundleId: 'com.akdudev.dondehay',
  bundleIdDev: 'com.akdudev.dondehay.dev',
  version: '1.0.0',
  androidVersionCode: 1,
  projectId: '41d6883e-6a1c-4de7-89bc-be26c1a98c58',
} as const;

export const STORE_LISTING = {
  shortDescription:
    'Agregador de productos para Cuba — busca, compara precios y encuentra lo que necesitas.',
  longDescription: `Dónde Hay es la aplicación definitiva para encontrar productos en Cuba.

• Busca en múltiples fuentes: Revolico, Facebook Marketplace, Instagram, Telegram, 1Cuba, CholesLibres y la comunidad Dónde Hay.
• Compara precios al instante entre diferentes vendedores y plataformas.
• Recibe alertas de precio para no perderte las mejores ofertas.
• Guarda tus productos favoritos y búsquedas frecuentes.
• Geolocalización para encontrar productos cerca de ti.
• Interfaz rápida y sencilla, diseñada para conexiones lentas.`,
  keywords: [
    'productos',
    'cuba',
    'comparar precios',
    'marketplace',
    'comprar',
    'ofertas',
    'revolico',
    'donde hay',
    'tienda',
    'buscar productos',
  ],
  category: 'Shopping',
  supportUrl: 'https://dondehay.app/soporte',
  privacyUrl: 'https://dondehay.app/privacidad',
  marketingUrl: 'https://dondehay.app',
  releaseNotes: 'Versión inicial de Dónde Hay.',
} as const;

export const BUILD_PROFILES = {
  development: {
    description: 'Dev client with hot reload for local development',
    env: 'development',
  },
  preview: {
    description: 'Internal APK for QA and stakeholder testing',
    env: 'preview',
  },
  production: {
    description: 'Store-ready build for Google Play and App Store',
    env: 'production',
  },
} as const;
