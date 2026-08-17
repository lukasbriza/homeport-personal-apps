import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Vite 8 resolves tsconfig `paths` natively — no vite-tsconfig-paths plugin needed.
  resolve: { tsconfigPaths: true },
  plugins: [reactRouter()],
})
