import { oxContent } from '@ox-content/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'content',
  build: { outDir: '../dist' },
  plugins: [
    oxContent({
      srcDir: '.',
      outDir: '../dist',
      gfm: true,
      search: true,
      docs: {
        entryPoints: [{ path: 'src/lib.ts', name: 'lib' }],
        src: ['../src'],
        out: 'api',
        pathStrategy: 'typedoc',
      },
      ssg: { siteName: 'repro' },
    }),
  ],
});
