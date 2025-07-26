import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  server: {
    port: 8082
  },
  plugins: [vue(), jsx()],
})
