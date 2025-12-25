import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  
  return {
    plugins: [react()],
    // 修复：本地开发(dev)时使用根路径 '/'，只有打包(build)时才使用子路径 '/christmas-tree/'
    // 这样你就不会因为路径不对而看到白屏了
    base: isDev ? '/' : '/christmas-tree/', 
    build: {
      outDir: 'dist',
    },
  };
});
