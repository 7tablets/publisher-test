const gulp = require('gulp');
const inlinesource = require('gulp-inline-source');
const replace = require('gulp-replace');
var clean = require('gulp-rimraf');

gulp.task('clean', function () {
  console.log('Clean all files in build folder');
  return gulp.src('build/*', { read: false }).pipe(clean());
});

gulp.task('bundle', () => {
  return gulp
    .src('./build/*.html')
    .pipe(replace('.js"></script>', '.js" inline></script>'))
    .pipe(replace('rel="stylesheet">', 'rel="stylesheet" inline>'))
    .pipe(
      inlinesource({
        compress: false,
        ignore: ['png'],
      })
    )
    .pipe(gulp.dest('.'));
});
