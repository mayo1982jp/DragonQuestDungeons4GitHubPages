import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the built dist/ works at the domain root and in a subdirectory.
  base: './',
  plugins: [react(), tailwindcss()],
});
