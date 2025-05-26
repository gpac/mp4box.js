/* eslint-disable no-undef */

// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0);
}

// Install Husky hooks
console.log('Installing Husky...');
const husky = (await import('husky')).default;
const output = husky();

if (output && output.length > 0) {
  console.log(output);
}
