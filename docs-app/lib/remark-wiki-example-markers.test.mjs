import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import { remarkWikiExampleMarkers } from './remark-wiki-example-markers.mjs';

function render(markdown, components = {}) {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm, remarkWikiExampleMarkers],
      components,
    }, markdown),
  );
}

function inspectCodeBlocks() {
  return { code: ({ node, children }) => {
    const source = node?.properties?.wikiExampleSource;
    return React.createElement('code', {
      'data-source-path': source?.sourcePath ?? 'none',
      'data-snippet-id': source?.snippetId ?? 'none',
    }, children);
  } };
}

test('marks a valid canonical Kotlin source region and leaves unmanaged and Gradle blocks unmarked', () => {
  const html = render([
    '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/src/main/kotlin/io/github/Example.kt#basic-usage -->',
    '```kotlin',
    'fun Example() {}',
    '```',
    '<!-- END WIKI EXAMPLE: basic-usage -->',
    '',
    '```kotlin',
    'fun Unmanaged() {}',
    '```',
    '',
    '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/build.gradle.kts#gradle -->',
    '```kotlin',
    'plugins { id("org.jetbrains.kotlin.jvm") }',
    '```',
    '<!-- END WIKI EXAMPLE: gradle -->',
  ].join('\n'), inspectCodeBlocks());

  assert.equal((html.match(/data-source-path="sample\/androidApp\/src\/main\/kotlin\/io\/github\/Example\.kt"/g) || []).length, 1);
  assert.equal((html.match(/data-source-path="none"/g) || []).length, 2);
  assert.match(html, /data-snippet-id="basic-usage"/);
});

test('marks multiple source regions separately and preserves Markdown between them', () => {
  const html = render([
    '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/src/main/kotlin/One.kt#one -->',
    '```kotlin',
    'fun one() {}',
    '```',
    '<!-- END WIKI EXAMPLE: one -->',
    '',
    'Intervening paragraph.',
    '',
    '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/src/main/kotlin/Two.kt#two -->',
    '```kotlin',
    'fun two() {}',
    '```',
    '<!-- END WIKI EXAMPLE: two -->',
  ].join('\n'), inspectCodeBlocks());

  assert.equal((html.match(/data-source-path="sample\/androidApp\/src\/main\/kotlin\/(?:One|Two)\.kt"/g) || []).length, 2);
  assert.match(html, /<p>Intervening paragraph\.<\/p>/);
});

test('fails closed for malformed, unmatched, noncanonical, and multi-block regions', () => {
  const html = render([
    '<!-- BEGIN WIKI EXAMPLE: sample/Bad.kt#missing -->',
    '```kotlin', 'fun missing() {}', '```',
    '',
    '<!-- BEGIN WIKI EXAMPLE: elsewhere/Bad.kt#path -->',
    '```kotlin', 'fun path() {}', '```',
    '<!-- END WIKI EXAMPLE: path -->',
    '',
    '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/src/main/kotlin/Two.kt#two -->',
    '```kotlin', 'fun one() {}', '```',
    '```kotlin', 'fun two() {}', '```',
    '<!-- END WIKI EXAMPLE: two -->',
  ].join('\n'), inspectCodeBlocks());

  assert.doesNotMatch(html, /data-source-path="sample/);
  assert.equal((html.match(/data-source-path="none"/g) || []).length, 4);
  assert.doesNotMatch(html, /WIKI EXAMPLE/);
});

test('hides synchronization markers and preserves surrounding Markdown and Kotlin code', () => {
  const markdown = [
    '## Basic usage',
    '',
    'Before the example.',
    '',
    '<!-- BEGIN WIKI EXAMPLE: sample/Example.kt#basic -->',
    '',
    '```kotlin',
    '@Composable',
    'fun Example() = Text("visible")',
    '```',
    '',
    '<!-- END WIKI EXAMPLE -->',
    '',
    'After the example.',
  ].join('\n');
  const html = render(markdown);

  assert.doesNotMatch(html, /BEGIN WIKI EXAMPLE|END WIKI EXAMPLE/);
  assert.match(html, /<h2>Basic usage<\/h2>/);
  assert.match(html, /Before the example\./);
  assert.match(html, /After the example\./);
  assert.match(html, /@Composable[\s\S]*fun Example\(\) = Text\(&quot;visible&quot;\)/);
});

test('hides multiple managed snippets in one document', () => {
  const markdown = [
    '<!-- BEGIN WIKI EXAMPLE: Example.kt#one -->',
    '',
    '```kotlin',
    'fun one() {}',
    '```',
    '',
    '<!-- END WIKI EXAMPLE: one -->',
    '',
    '<!-- BEGIN WIKI EXAMPLE: Example.kt#two -->',
    '',
    '```kotlin',
    'fun two() {}',
    '```',
    '',
    '<!-- END WIKI EXAMPLE: two -->',
  ].join('\n');
  const html = render(markdown);

  assert.doesNotMatch(html, /(?:BEGIN|END) WIKI EXAMPLE/);
  assert.match(html, /fun one\(\)/);
  assert.match(html, /fun two\(\)/);
});

test('preserves marker-like text inside fenced code blocks', () => {
  const markdown = ['```markdown', '<!-- BEGIN WIKI EXAMPLE: literal -->', '<!-- END WIKI EXAMPLE -->', '```'].join('\n');
  const html = render(markdown);

  assert.match(html, /&lt;!-- BEGIN WIKI EXAMPLE: literal --&gt;/);
  assert.match(html, /&lt;!-- END WIKI EXAMPLE --&gt;/);
});

test('uses the same marker handling for versioned wiki content', () => {
  for (const version of ['snapshot', '3.0.0', '2.4.0']) {
    const html = render([
      `## ${version}`,
      '',
      '<!-- BEGIN WIKI EXAMPLE: sample/androidApp/src/main/kotlin/Versioned.kt#sample -->',
      '',
      '```kotlin',
      `fun ${version.replaceAll('.', '_')}() {}`,
      '```',
      '',
      '<!-- END WIKI EXAMPLE: sample -->',
    ].join('\n'), inspectCodeBlocks());

    assert.doesNotMatch(html, /(?:BEGIN|END) WIKI EXAMPLE/, version);
    assert.match(html, /<h2/);
    assert.match(html, /fun /);
    assert.match(html, /data-source-path="sample\/androidApp\/src\/main\/kotlin\/Versioned\.kt"/, version);
  }
});
