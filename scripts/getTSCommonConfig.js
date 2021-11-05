'use strict';

const fs = require('fs');
const path = require('path');
const assign = require('object-assign');

const cwd = process.cwd();
function getProjectPath(...filePath) {
  return path.join(cwd, ...filePath);
}

module.exports = function () {
  let my = {};
  if (fs.existsSync(getProjectPath('tsconfig.json'))) {
    my = require(getProjectPath('tsconfig.json'));
  }
  return assign(
    {
      noUnusedParameters: true,
      noUnusedLocals: true,
      strictNullChecks: true,
      target: 'esnext',
      moduleResolution: 'node',
      declaration: true,
      allowSyntheticDefaultImports: true,
    },
    my.compilerOptions
  );
};
