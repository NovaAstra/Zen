import { resolve, join, dirname } from 'path';
import { promises, existsSync } from 'fs';
import { fileURLToPath } from 'url';

export async function readLoadingHtml(template: string) {
  const path = resolve(process.cwd(), template);

  const templatePath = existsSync(path)
    ? path
    : join(dirname(fileURLToPath(import.meta.url)), 'loading.html');

  return await promises.readFile(templatePath, 'utf8');
}

export async function readPackageJSON(cwd: string): Promise<{ version: string }> {
  const pkgPath = resolve(cwd, 'package.json');
  const pkgRaw = await promises.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  return { version: pkg.version || 'unknown' };
}