import baseConfig from '../lint-staged.config.mjs';

/**
 * @type {import('lint-staged').Configuration}
 */
const config = {
  ...baseConfig,
  '**/*.ts': [() => 'pnpm --filter backend run lint'],
};

export default config;
