import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    target: 'es2020',
    cssMinify: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
