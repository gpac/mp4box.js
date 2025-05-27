/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '!(test)*.{js,json,md}': ['prettier --write'],
};
