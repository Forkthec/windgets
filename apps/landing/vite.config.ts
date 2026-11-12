import { defineConfig } from 'vite';

// Sitio estático sin servidor (D-195). WINDGETS_GITHUB_REPO se lee en la compilación.
export default defineConfig({
  envPrefix: ['VITE_', 'WINDGETS_'],
  server: { port: 5173, strictPort: true },
});
