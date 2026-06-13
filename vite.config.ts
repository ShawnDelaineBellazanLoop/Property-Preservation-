import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // This base path is required for GitHub Pages to load assets correctly
    base: '/Property-Preservation/',
});