// eslint-disable-next-line n/no-unpublished-import
import { config } from '@slashnephy/eslint-config'

export default config({
  ignores: [
    'dist/',
    'types/GM_config.d.ts',
    'rollup.config.ts',
  ],
}, {
  rules: {
    'import-x/extensions': 'off',
  },
})
