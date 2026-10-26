import { defineConfig } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'game-attribution',
      async closeBundle() {
        const root = import.meta.dirname;
        await mkdir(resolve(root, 'dist/assets/licenses'), { recursive: true });
        await mkdir(resolve(root, 'dist/vendor'), { recursive: true });
        for (const [source, destination] of [
          ['credits.html', 'credits.html'],
          ['LICENSE', 'LICENSE.txt'],
          ['CREDITS.md', 'CREDITS.md'],
          ['vendor/NOTICE.md', 'vendor/NOTICE.md'],
          ['vendor/zirbel-LICENSE.txt', 'vendor/zirbel-LICENSE.txt'],
          ['node_modules/three/LICENSE', 'three-LICENSE.txt'],
          ['node_modules/three/LICENSE', 'assets/licenses/three-MIT.txt'],
        ]) {
          if (!source || !destination) throw new Error('Invalid attribution entry');
          await copyFile(resolve(root, source), resolve(root, 'dist', destination));
        }
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5184, strictPort: true },
  build: { target: 'es2022' },
});
