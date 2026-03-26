/**
 * @type {import('lint-staged').Configuration}
 */
const config = {
  '*': [
    () => 'pnpm lint:editor',
    () => 'pnpm lint:files',
    () => 'pnpm lint:format',
  ],
};

export default config;
