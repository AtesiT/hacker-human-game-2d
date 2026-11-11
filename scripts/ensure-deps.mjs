// Запускается перед `npm run dev` и `npm run build` (хуки predev/prebuild).
// Если каких-то зависимостей нет в node_modules, ставит их сам —
// поэтому свежий клон запускается одной командой, без отдельного `npm install`.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);

const pkg = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));
const wanted = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const missing = wanted.filter((name) => !existsSync(fromRoot(`node_modules/${name}`)));

if (missing.length > 0) {
  console.log(`Не установлены зависимости (${missing.join(', ')}) — запускаю npm install...`);
  execSync('npm install', { cwd: fromRoot(''), stdio: 'inherit' });
}
