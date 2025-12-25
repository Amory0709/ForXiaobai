import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ 注意：这里的 '/christmas-tree/' 必须和你 GitHub 上的仓库名一致
  // 如果你的仓库叫 'my-project'，这里就改成 '/my-project/'
  base: '/christmas-tree/', 
  build: {
    outDir: 'dist',
  },
});
