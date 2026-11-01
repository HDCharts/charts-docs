import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import { remarkWikiExampleMarkers } from './remark-wiki-example-markers.ts';

function render(markdown) {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm, remarkWikiExampleMarkers],
    }, markdown),
  );
}

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
      '<!-- BEGIN WIKI EXAMPLE: Versioned.kt#sample -->',
      '',
      '```kotlin',
      `fun ${version.replaceAll('.', '_')}() {}`,
      '```',
      '',
      '<!-- END WIKI EXAMPLE -->',
    ].join('\n'));

    assert.doesNotMatch(html, /(?:BEGIN|END) WIKI EXAMPLE/, version);
    assert.match(html, /<h2/);
    assert.match(html, /fun /);
  }
});
