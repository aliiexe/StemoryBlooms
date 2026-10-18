import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

// A structural security rule: directly reachable admin actions must authorize before any work.
test('every exported admin server action starts by awaiting its own admin assertion', () => {
  const root = new URL('../../app/admin/', import.meta.url);
  const violations: string[] = [];
  let checked = 0;
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (!entry.name.endsWith('.ts')) continue;
      const text = readFileSync(path, 'utf8');
      if (!/^['"]use server['"];/.test(text)) continue;
      const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
      for (const node of file.statements) {
        if (!ts.isFunctionDeclaration(node) || !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
        checked++;
        const first = node.body?.statements[0];
        let authorized = false;
        function visit(child: ts.Node) {
          if (ts.isAwaitExpression(child) && ts.isCallExpression(child.expression) && child.expression.expression.getText(file) === 'assertAdmin') authorized = true;
          ts.forEachChild(child, visit);
        }
        if (first) visit(first);
        if (!authorized) violations.push(`${path}: ${node.name?.text}`);
      }
    }
  }
  scan(root.pathname);
  assert.ok(checked > 30, 'The action inventory must include the actual admin modules.');
  assert.deepEqual(violations, []);
});

// Layout checks do not protect independently fetched nested server components.
test('every async admin page authorizes before reading its data', () => {
  const violations: string[] = [];
  let checked = 0;
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (entry.name !== 'page.tsx') continue;
      const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      for (const node of file.statements) {
        if (!ts.isFunctionDeclaration(node) || !node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) || !node.modifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) continue;
        checked++;
        if (!node.body?.statements[0]?.getText(file).includes('await assertAdmin()')) violations.push(path);
      }
    }
  }
  scan(new URL('../../app/admin/', import.meta.url).pathname);
  assert.ok(checked > 20);
  assert.deepEqual(violations, []);
});
