import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative base so the build also works when hosted in a sub-folder (e.g. GitHub Pages).
  base: './',
  plugins: [vue()],
  test: {
    environment: 'node',
  },
})
