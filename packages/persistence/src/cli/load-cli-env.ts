import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

export function loadCliEnvironment(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../apps/web/.env')
  ];

  const loaded = new Set<string>();
  for (const candidate of candidates) {
    if (loaded.has(candidate) || !existsSync(candidate)) continue;
    loadEnvFile(candidate);
    loaded.add(candidate);
  }
}
