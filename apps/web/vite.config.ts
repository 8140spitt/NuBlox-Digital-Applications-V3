import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  const nubloxEnvironment = loadEnv(mode, repositoryRoot, 'NUBLOX_');
  Object.assign(process.env, nubloxEnvironment);

  return {
    envDir: repositoryRoot,
    plugins: [sveltekit()]
  };
});
