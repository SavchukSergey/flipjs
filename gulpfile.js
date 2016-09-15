var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourceMaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');

gulp.task('typescript', function () {
    var tsResult = gulp.src(['./src/js/**/*.ts'], {
        base: './src/js'
    }).pipe(sourceMaps.init())
        .pipe(ts({
            module: "system",
            target: 'es5',
            outFile: 'flipper.js'
        }), undefined, ts.reporter.fullReporter());

    return tsResult.js
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest('./src/js'));
})

gulp.task('scss', function () {
    return gulp.src('./src/css/**/*.scss')
        .pipe(sourceMaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('./src/css'));
})

gulp.task('default', function () {
    gulp.run('typescript');
    gulp.run('scss');
});