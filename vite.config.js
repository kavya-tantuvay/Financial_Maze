import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config. `npm start` runs the dev server on port 3000 and opens the
// browser, which keeps the same workflow you would get from Create React App.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Split the big 3D library away from our own code. Three.js barely
        // ever changes, so browsers can keep it cached between deploys while
        // the game code updates.
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
