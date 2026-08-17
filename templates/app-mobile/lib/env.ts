// Typed access to public env vars. Expo inlines `EXPO_PUBLIC_*` at build time;
// anything without that prefix is NOT available on device. Keep secrets server-side.
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://my-api.cz/',
}
