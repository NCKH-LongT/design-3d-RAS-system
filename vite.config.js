import {defineConfig} from 'vite';
export default defineConfig({base:process.env.GITHUB_PAGES==='true'?'/design-3d-RAS-system/':'/',server:{allowedHosts:['terminal.local']},build:{rollupOptions:{output:{manualChunks:{three:['three','three/addons/controls/OrbitControls.js']}}}}});
