import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ImageDimensions {
  width: number;
  height: number;
}

const contentRoot = path.resolve(process.cwd(), '..', 'content');
const dimensionsCache = new Map<string, ImageDimensions | null>();

/** Read intrinsic sizes without decoding potentially large animated GIFs. */
function readImageDimensions(filePath: string): ImageDimensions | null {
  const header = Buffer.alloc(24);
  let fd: number | undefined;

  try {
    fd = fs.openSync(filePath, 'r');
    const count = fs.readSync(fd, header, 0, header.length, 0);

    if (count >= 10 && (header.toString('ascii', 0, 6) === 'GIF89a' || header.toString('ascii', 0, 6) === 'GIF87a')) {
      return { width: header.readUInt16LE(6), height: header.readUInt16LE(8) };
    }

    if (count >= 24 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
    }
  } catch {
    // Markdown may refer to assets not present in the current checkout.
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }

  return null;
}

/** Reserve image space for stable heading-anchor navigation on GIF-heavy wiki pages. */
export function getWikiImageDimensions(markdown: string): Record<string, ImageDimensions> {
  const dimensions: Record<string, ImageDimensions> = {};

  for (const match of markdown.matchAll(/!\[[^\]]*\]\((\/content\/(?:snapshot|\d+\.\d+\.\d+)\/wiki\/assets\/[A-Za-z0-9_.-]+\.(?:gif|png))\)/g)) {
    const src = match[1];
    if (!dimensionsCache.has(src)) {
      const filePath = path.resolve(contentRoot, src.slice('/content/'.length));
      const withinRoot = filePath.startsWith(contentRoot + path.sep);
      dimensionsCache.set(src, withinRoot ? readImageDimensions(filePath) : null);
    }

    const size = dimensionsCache.get(src);
    if (size && size.width > 0 && size.height > 0) dimensions[src] = size;
  }

  return dimensions;
}
