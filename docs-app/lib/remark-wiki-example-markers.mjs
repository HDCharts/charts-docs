/** @type {import('unified').Plugin<[], import('mdast').Root>} */
export const remarkWikiExampleMarkers = () => (tree) => {
  markSourceBackedExamples(tree);
};

const BEGIN_MARKER = /^<!--[ \t]*BEGIN WIKI EXAMPLE: ([^#<>]+)#([a-z0-9-]+)[ \t]*-->$/;
const END_MARKER = /^<!--[ \t]*END WIKI EXAMPLE: ([a-z0-9-]+)[ \t]*-->$/;
const MARKER_LIKE = /^<!--[ \t]*(?:BEGIN|END) WIKI EXAMPLE\b/;

/**
 * Mark only a complete Kotlin region that references a canonical source file.
 * The docs publishing workflow does not prove that this exact source revision
 * passed ciCompile, so this is source-backed metadata rather than a compile claim.
 */
function markSourceBackedExamples(tree) {
  if (!Array.isArray(tree.children)) return;

  const children = tree.children;
  const remove = new Set();
  let index = 0;

  while (index < children.length) {
    const child = children[index];
    if (child?.type !== 'html' || typeof child.value !== 'string') {
      index += 1;
      continue;
    }

    const begin = BEGIN_MARKER.exec(child.value.trim());
    if (!begin) {
      if (MARKER_LIKE.test(child.value.trim())) remove.add(index);
      index += 1;
      continue;
    }

    const [, sourcePath, identifier] = begin;
    let endIndex = index + 1;
    while (endIndex < children.length && children[endIndex]?.type !== 'html') endIndex += 1;
    const endNode = children[endIndex];
    const end = endNode?.type === 'html' && typeof endNode.value === 'string'
      ? END_MARKER.exec(endNode.value.trim())
      : null;

    remove.add(index);
    if (end && end[1] === identifier) {
      remove.add(endIndex);
      const region = children.slice(index + 1, endIndex);
      const blocks = region.filter((node) => node?.type === 'code');
      const containsOnlyCode = region.every((node) => node?.type === 'code');
      const isCanonicalSourcePath = /^sample\/[^/]+\/src\/main\/kotlin\/(?!.*\.gradle\.kts$)[^#<>]+\.kt$/.test(sourcePath)
        && !sourcePath.split('/').includes('..');
      if (isCanonicalSourcePath && containsOnlyCode && blocks.length === 1 && blocks[0].lang === 'kotlin') {
        blocks[0].data ??= {};
        blocks[0].data.hProperties = {
          ...blocks[0].data.hProperties,
          wikiExampleSource: { sourcePath, snippetId: identifier },
        };
      }
    }
    index += 1;
  }

  tree.children = children.filter((_, childIndex) => !remove.has(childIndex));
}
