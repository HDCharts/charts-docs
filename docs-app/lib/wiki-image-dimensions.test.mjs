import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const lib = path.dirname(fileURLToPath(import.meta.url));
const build = mkdtempSync(path.join(lib, '.test-image-dimensions-'));
let getWikiImageDimensions;

try {
  execFileSync('tsc', [
    '--ignoreConfig', '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck',
    '--outDir', build, path.join(lib, 'wiki-image-dimensions.ts'),
  ], { cwd: path.dirname(lib), stdio: 'inherit' });
  ({ getWikiImageDimensions } = createRequire(import.meta.url)(path.join(build, 'wiki-image-dimensions.js')));
} finally {
  rmSync(build, { recursive: true, force: true });
}

test('reserves intrinsic dimensions for versioned wiki GIF and PNG assets', () => {
  const gif = '/content/3.1.0/wiki/assets/line_gradient.gif';
  const png = '/content/3.1.0/wiki/assets/wiki-line-basic.png';
  const dimensions = getWikiImageDimensions('![Gradient](' + gif + ')\n![Line](' + png + ')');

  for (const src of [gif, png]) {
    assert.ok(dimensions[src]?.width > 0, src + ' width');
    assert.ok(dimensions[src]?.height > 0, src + ' height');
  }
});

test('skips unsupported or missing assets without failing page rendering', () => {
  assert.deepEqual(getWikiImageDimensions(
    '![External](https://example.com/plot.gif)\n![Missing](/content/3.1.0/wiki/assets/not-present.gif)',
  ), {});
});
