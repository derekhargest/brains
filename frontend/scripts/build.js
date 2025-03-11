import { build } from 'vite';

async function main() {
  await build({
    root: './frontend',
    build: {
      outDir: '../dist',
      emptyOutDir: true
    }
  });
}

main().catch(console.error); 