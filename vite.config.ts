import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polifill untuk process.env agar code yang menggunakan process.env.API_KEY tidak error
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': process.env
    },
    build: {
      outDir: 'dist',
    }
  };
});