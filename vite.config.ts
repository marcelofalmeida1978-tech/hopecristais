import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import processPaymentHandler from './api/process-payment';
import calculateShippingHandler from './api/calculate-shipping';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/process-payment') || url.startsWith('/api/calculate-shipping')) {
          let bodyData = '';
          req.on('data', (chunk) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              (req as any).body = bodyData ? JSON.parse(bodyData) : {};
            } catch {
              (req as any).body = {};
            }
            try {
              if (url.startsWith('/api/process-payment')) {
                await processPaymentHandler(req, res);
              } else if (url.startsWith('/api/calculate-shipping')) {
                await calculateShippingHandler(req, res);
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
