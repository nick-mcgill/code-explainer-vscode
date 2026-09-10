const esbuild = require('esbuild');

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');
const shouldMinify = isProduction || process.argv.includes('--minify');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node24',
  sourcemap: !shouldMinify,
  minify: shouldMinify,
  metafile: shouldMinify,
  logLevel: 'info'
};

async function main() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    const result = await esbuild.build(buildOptions);
    if (shouldMinify) {
      const output = result.metafile?.outputs?.['dist/extension.js'];
      if (output && output.bytes > 250 * 1024) {
        throw new Error(`Production bundle is ${output.bytes} bytes; maximum is 250 KB.`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
