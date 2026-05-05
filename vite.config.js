import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            'vendor-antd': ['antd', '@ant-design/icons'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            'vendor-charts': ['recharts'],
            'vendor-socket': ['socket.io-client'],
            'vendor-utils': ['lodash', 'date-fns', 'moment', 'xlsx'],
          },
        },
      },
    },
  };
});
