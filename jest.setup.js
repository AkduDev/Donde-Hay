// Configuración global para tests de Jest (React Native + RNTL).
// NOTA: no cargar 'expo-router/entry' aquí — bootstrappea la app y
// referencia window.location (null en el entorno de Node del test runner).