import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compile the API modules with the project's existing TypeScript dependency.
// Inject only Vite's environment and browser storage; exercise the real adapters.
export function loadTypeScript(path, overrides = {}) {
  const cache = new Map();
  function load(specifier) {
    if (specifier in overrides) return overrides[specifier];
    if (cache.has(specifier)) return cache.get(specifier).exports;
    const file = fileURLToPath(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url));
    const source = readFileSync(file, 'utf8').replaceAll('import.meta.env', '__env');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const module = { exports: {} };
    cache.set(specifier, module);
    const execute = new Function('require', 'module', 'exports', '__env', outputText);
    execute(load, module, module.exports, { VITE_API_URL: 'http://api.test' });
    return module.exports;
  }
  return load(path);
}
