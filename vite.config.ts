import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ IMPORTANT: Change 'repository-name' to the actual name of your GitHub repository
  // For example, if your repo is 'christmas-tree', this should be '/christmas-tree/'
  base: '/repository-name/', 
  build: {
    outDir: 'dist',
  },
});
