import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  server: { port: 5173 },
  plugins: [vue()],
  // @gsg/shared-types is a CJS workspace package resolved via a pnpm symlink.
  // Vite serves symlinked workspace packages raw via /@fs/ instead of running
  // them through its normal dependency pre-bundling pipeline, and the raw
  // single-file CJS→ESM interop transform fails to detect named exports for
  // this package's output shape. Forcing it into optimizeDeps routes it
  // through esbuild's bundler-mode transform instead, which handles CJS
  // interop correctly.
  optimizeDeps: {
    include: [
      '@gsg/shared-types',
      '@gsg/shared-types/domain',
      '@gsg/shared-types/permissions',
      '@gsg/shared-types/schemas',
      '@gsg/shared-types/events',
    ],
  },
})
