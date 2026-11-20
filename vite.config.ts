import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function resolveBasePath(command: 'serve' | 'build'): string {
  if (command === 'serve') {
    return '/';
  }
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1] ?? '';
    if (!repo || repo.endsWith('.github.io')) {
      return '/';
    }
    return `/${repo}/`;
  }
  return './';
}

export default defineConfig(({command, mode}) => {
  const isMiniGame = mode === 'minigame';
  // 小游戏容器使用相对路径；PWA Service Worker 在小游戏内不需要，反而可能干扰平台缓存。
  const basePath = isMiniGame ? './' : resolveBasePath(command);
  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      ...(isMiniGame ? [] : [VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: basePath,
          name: '弑神道果：万亿亿劫',
          short_name: '弑神道果',
          description: '修仙×克苏鲁题材策略构筑与天文数字增量放置游戏',
          theme_color: '#0b0d15',
          background_color: '#0b0d15',
          display: 'standalone',
          orientation: 'portrait',
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
          // 商店图集仅用于 OG 分享与上架物料，不进离线缓存（省约 1.4MB 首装流量）
          globIgnores: ['**/aistudio/**', 'taptap/**'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      })]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
