// Bundles the backend with its dependencies into dist/app.js and dist/server.js.
// Vercel runs dist/app.js without node_modules, so the output must be self-contained.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/app.ts', 'src/server.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  logLevel: 'warning',
  logOverride: { 'commonjs-variable-in-esm': 'silent' },
  // Optional native/peer modules that mongodb and ws load only when present.
  external: [
    'kerberos',
    '@mongodb-js/zstd',
    '@aws-sdk/credential-providers',
    'gcp-metadata',
    'snappy',
    'socks',
    'aws4',
    'mongodb-client-encryption',
    'bufferutil',
    'utf-8-validate',
  ],
});
