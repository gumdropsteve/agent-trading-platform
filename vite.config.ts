import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH is the sub-path the site is served from: '/agent-trading-platform/' on
// <user>.github.io, '/' on a custom domain. Set by the Pages workflow.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
