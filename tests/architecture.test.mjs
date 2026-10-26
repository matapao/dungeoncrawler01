import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { parsers } from 'prettier/plugins/typescript';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
    }),
  );
  return children.flat();
}

test('new game preserves inward imports, portable deterministic rules and 600-line module budgets', async () => {
  const root = resolve('src');
  const errors = [];
  for (const path of [...(await files(root))]) {
    const name = relative(root, path);
    const portable = name.startsWith('game/') || name.startsWith('core/');
    const source = await readFile(path, 'utf8');
    if (source.trimEnd().split('\n').length > 600) errors.push(`${name}: exceeds 600 lines`);
    const ast = await parsers.typescript.parse(source, {});
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      const specifier = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(
        node.type,
      )
        ? node.source?.value
        : node.type === 'ImportExpression'
          ? node.source?.value
          : undefined;
      if (
        typeof specifier === 'string' &&
        specifier.startsWith('.') &&
        relative(root, resolve(dirname(path), specifier)).startsWith('..')
      )
        errors.push(`${name}: import escapes source root ${specifier}`);
      if (typeof specifier === 'string' && portable) {
        const target = relative(root, resolve(dirname(path), specifier));
        const gameImport = name.startsWith('game/') && target.startsWith('game/');
        const sharedCoreImport = target.startsWith('core/');
        if (!specifier.startsWith('.') || (!gameImport && !sharedCoreImport))
          errors.push(`${name}: outward import ${specifier}`);
      }
      if (portable && node.type === 'Identifier' && ['window', 'document', 'navigator'].includes(node.name))
        errors.push(`${name}: browser API ${node.name}`);
      if (portable && node.type === 'NewExpression' && node.callee?.name === 'Date')
        errors.push(`${name}: non-deterministic rule`);
      if (portable && node.type === 'CallExpression') {
        const callee = node.callee;
        if (callee?.type === 'MemberExpression' && callee.object?.type === 'Identifier') {
          if (
            callee.object.name === 'performance' ||
            (callee.object.name === 'Date' && callee.property?.name === 'now') ||
            (callee.object.name === 'Math' && callee.property?.name === 'random')
          )
            errors.push(`${name}: non-deterministic rule`);
        }
      }
      for (const [key, value] of Object.entries(node)) {
        if (['comments', 'tokens', 'loc', 'range'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
  }
  assert.deepEqual(errors, []);
});
