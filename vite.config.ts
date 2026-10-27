import { defineConfig, type Plugin } from 'vite';

/**
 * Puts the built script and styles inside index.html, so the page is one
 * self-contained file: it opens by double-click (file://, where browsers refuse
 * to load separate module scripts) and can be shared as a single file.
 */
function singleFile(): Plugin {
  return {
    name: 'spark-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'));
      if (!html || html.type !== 'asset') return;
      let source = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          const script = new RegExp(`<script[^>]*src="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*></script>`);
          // `</script` inside the code would end the tag early.
          source = source.replace(script, () => `<script type="module">${file.code.replace(/<\/script/gi, '<\\/script')}</script>`);
          delete bundle[name];
        } else if (file.type === 'asset' && name.endsWith('.css')) {
          const link = new RegExp(`<link[^>]*href="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
          source = source.replace(link, () => `<style>${String(file.source)}</style>`);
          delete bundle[name];
        }
      }
      html.source = source;
    },
  };
}

// The web lab lives in web/; the engine in src/ is imported directly.
// The site (default): the lab's script and styles as files of their own, shared by all the site's pages
// (scripts/build-site.ts writes them). `--mode single`: the lab as one self-contained file, to open by
// double-click or send to students.
export default defineConfig(({ mode }) => ({
  root: 'web',
  base: './',
  plugins: mode === 'single' ? [singleFile()] : [],
  build:
    mode === 'single'
      ? { outDir: '../dist-offline', emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false }
      : { outDir: '../dist-web', emptyOutDir: true, cssCodeSplit: false },
  // 127.0.0.1 rather than "localhost": some browser setups never open the latter.
  server: { host: '127.0.0.1', open: true },
  preview: { host: '127.0.0.1' },
}));
