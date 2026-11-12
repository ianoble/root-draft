import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { engineAlias } from './engine-root';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ['vue', 'pinia'],
    alias: engineAlias,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
