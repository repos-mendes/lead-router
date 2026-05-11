import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackStart({
      server: { entry: 'server' },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    ...(command === 'build' ? [cloudflare()] : []),
  ],
}))
