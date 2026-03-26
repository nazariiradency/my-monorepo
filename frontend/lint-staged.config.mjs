import baseConfig from '../lint-staged.config.mjs';

/**
 * @type {import('lint-staged').Configuration}
 */
const config = {
  ...baseConfig,
  '**/*.{ts,tsx}': ['pnpm --filter frontend run lint'],
  '**/*.scss': ['pnpm --filter frontend run lint:scss'],
};

export default config;
