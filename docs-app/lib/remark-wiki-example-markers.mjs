/** @type {import('unified').Plugin<[], import('mdast').Root>} */
export const remarkWikiExampleMarkers = () => (tree) => {
  removeWikiExampleMarkers(tree);
};

const WIKI_EXAMPLE_MARKER = /^<!--[ \t]*(?:BEGIN WIKI EXAMPLE: [^\r\n]*|END WIKI EXAMPLE(?:: [^\r\n]*)?)[ \t]*-->$/;

/** Remove synchronization marker HTML nodes while leaving code nodes untouched. */
function removeWikiExampleMarkers(node) {
  if (!node.children) return;

  node.children = node.children.filter((child) => {
    if (!child || typeof child !== 'object') return true;

    if (child.type === 'html' && typeof child.value === 'string' && WIKI_EXAMPLE_MARKER.test(child.value.trim())) {
      return false;
    }

    // Markdown code fences are leaf `code` nodes, so marker-like code is preserved.
    removeWikiExampleMarkers(child);
    return true;
  });
}
