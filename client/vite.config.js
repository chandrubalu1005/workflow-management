import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'os'

// Auto-detect the machine's LAN IP so all network devices can reach the API
// Prefer real LAN ranges (10.x, 192.168.x) over virtual adapters (172.x = Hyper-V/WSL/Docker)
const getNetworkIP = () => {
  const nets = networkInterfaces()
  const candidates = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address)
      }
    }
  }
  // Prefer real LAN IPs: 10.x.x.x first, then 192.168.x.x, then anything else
  const preferred = candidates.find(ip => ip.startsWith('10.'))
    || candidates.find(ip => ip.startsWith('192.168.'))
    || candidates[0]
    || 'localhost'
  return preferred
}
const HOST_IP = getNetworkIP()
const API_BASE = `http://${HOST_IP}:3000`

console.log(`\n🌐 Vite will use API: ${API_BASE}\n`)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject the real network IP into every file that uses import.meta.env.VITE_API_URL
    // Use the environment variable if provided (for production), otherwise fallback to LAN IP for dev
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || API_BASE),
  },
  server: {
    host: '0.0.0.0',   // Bind to all interfaces (LAN access)
    port: 5173,
    watch: {
      usePolling: true
    },
    proxy: {
      // Local fallback proxy for localhost dev (in case define doesn't apply during HMR)
      '/api': {
        target: `http://${HOST_IP}:3000`,
        changeOrigin: true,
      }
    }
  },
  build: {
    // Raise chunk warning threshold
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core — smallest, most cached chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Framer Motion (heavy) — isolated chunk
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Recharts (heavy) — isolated chart chunk
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // DnD Kit
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd';
          }
          // All other node_modules go into a general vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        }
      }
    },
    // Source maps only for debugging
    sourcemap: false,
    // Disable compression reporting for faster builds
    reportCompressedSize: false,
  }
})
