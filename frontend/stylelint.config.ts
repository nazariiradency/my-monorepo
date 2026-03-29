import { type Config } from 'stylelint';

export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-scss'],
  rules: {
    'block-no-empty': true,
    'color-hex-length': 'long',
  },
} satisfies Config;
