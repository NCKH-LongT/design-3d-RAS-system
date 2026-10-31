import {defineConfig} from 'vite';
export default defineConfig({server:{allowedHosts:['terminal.local']},build:{rollupOptions:{output:{manualChunks:{three:['three','three/addons/controls/OrbitControls.js']}}}}});
