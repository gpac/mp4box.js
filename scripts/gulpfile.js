const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const through2 = require('through2');
const fg = require('fast-glob');
const rimraf = require('rimraf');
const { createCompilerHost, createProgram } = require('typescript');

const runCmd = require('./runCmd');
const tsConfig = require('./getTSCommonConfig')();

function getProjectPath(...filePath) {
  return path.join(cwd, ...filePath);
}

const cwd = process.cwd();
const libDir = getProjectPath('lib');
const esDir = getProjectPath('es');

async function compileTs(modules = false, cb) {
  const options = {
    emitDeclarationOnly: true,
    ...tsConfig,
    moduleResolution: 2,
    baseUrl: '.',
  };

  const files = await fg(['src/*.ts'], {
    cwd,
  });
  const typedFiles = files.map((filename) => filename.replace('.ts', '.d.ts'));

  const createdFiles = {};
  const host = createCompilerHost(options);
  host.writeFile = (fileName, contents) => {
    createdFiles[path.isAbsolute(fileName) ? path.relative(cwd, fileName) : fileName] = contents;
  };

  const program = createProgram(files, options, host);
  program.emit();

  Object.keys(createdFiles).forEach((fileName) => {
    if (!typedFiles.includes(fileName)) return;

    const contents = createdFiles[fileName];
    const filePath = path.join(cwd, fileName.replace(/^src/, modules === false ? 'es' : 'lib'));
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, contents);
  });
  cb(0);
}

function compile(modules) {
  rimraf.sync(modules !== false ? libDir : esDir);

  const source = gulp
    .src(['src/*.ts'])
    .pipe(
      through2.obj(function (file, encoding, next) {
        // this.push(file.clone());
        next();
      })
    )
    .pipe(gulp.dest(modules === false ? esDir : libDir));
  return source;
}

gulp.task(
  'check-git',
  gulp.series((done) => {
    runCmd('git', ['status', '--porcelain'], (code, result) => {
      if (/^\?\?/m.test(result)) {
        return done(`There are untracked files in the working tree.\n${result}
      `);
      }
      if (/^([ADRM]| [ADRM])/m.test(result)) {
        return done(`There are uncommitted changes in the working tree.\n${result}
      `);
      }
      return done();
    });
  })
);

let startTime = new Date();
gulp.task('compile-with-es', (done) => {
  startTime = new Date();
  console.log('start compile at ', startTime);
  console.log('[Parallel] Compile to es...');
  compile(false).on('finish', done);
});

gulp.task('compile-with-lib', (done) => {
  console.log('[Parallel] Compile to js...');
  compile().on('finish', done);
});

gulp.task('compile-with-es-ts-type', async (done) => {
  console.log('[Parallel] Compile to es ts type...');
  await compileTs(false, done);
});

gulp.task('compile-with-lib-ts-type', async (done) => {
  console.log('[Parallel] Compile to lib ts type...');
  await compileTs(true, done);
});

gulp.task(
  'compile',
  gulp.series(
    gulp.parallel(
      'compile-with-es',
      'compile-with-lib',
      'compile-with-es-ts-type',
      'compile-with-lib-ts-type'
    ),
    (done) => {
      console.log('end compile at ', new Date());
      console.log('compile time ', (new Date() - startTime) / 1000, 's');
      done();
    }
  )
);

gulp.task(
  'pub',
  gulp.series('check-git', 'compile', (done) => {})
);
