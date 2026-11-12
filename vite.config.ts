import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { engineAlias } from './engine-root';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ['vue', 'pinia'],
    alias: engineAlias,
  },
});
