import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const WIKI_EXAMPLE_MARKER = /^<!--[ \t]*(?:BEGIN WIKI EXAMPLE: [^\r\n]*|END WIKI EXAMPLE(?:: [^\r\n]*)?)[ \t]*-->$/;

/** Remove synchronization marker HTML nodes while leaving code nodes untouched. */
export const remarkWikiExampleMarkers: Plugin<[], Root> = () => (tree) => {
  removeWikiExampleMarkers(tree);
};

function removeWikiExampleMarkers(node: { children?: unknown[] }): void {
  if (!node.children) return;

  node.children = node.children.filter((child) => {
    if (!child || typeof child !== 'object') return true;

    const childNode = child as { type?: string; value?: string; children?: unknown[] };
    if (childNode.type === 'html' && typeof childNode.value === 'string' && WIKI_EXAMPLE_MARKER.test(childNode.value.trim())) {
      return false;
    }

    // Markdown code fences are leaf `code` nodes, so marker-like code is preserved.
    removeWikiExampleMarkers(childNode);
    return true;
  });
}
