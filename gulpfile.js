'use strict';
const gulp = require('gulp');

const log = require('fancy-log');
const c = require('ansi-colors');

const pkg = require('./config.json');
const paths = pkg.paths;

const gif = require('gulp-if');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const connect = require('gulp-connect');
const sassLint = require('gulp-sass-lint');

const merge = require('merge-stream');

const sourcemapsEnabled = true;

const config = require('@tridnguyen/config');


// Lint scss file with `sass-lint`
function sassLinter(file) {
    return gulp
        .src(file)
        .pipe(
            sassLint({
                options: {
                    configFile: '.sass-lint.yml'
                }
            })
        )
        .pipe(sassLint.format());
}

// Compile scss
function compileScss(src, dest) {
    log('Compiling ' + c.yellow(src + '/*.scss') + ' into ' + c.green(dest));

    return gulp
        .src(src + '/*.scss')
        .pipe(gif(sourcemapsEnabled, sourcemaps.init()))
        .pipe(
            sass({
                outputStyle: 'expanded',
                includePaths: paths.core['sass-includePaths']
            }).on('error', sass.logError)
        )
        .pipe(
            prefix({
                overrideBrowserslist: ['last 2 versions'],
                cascade: true
            })
        )
        .pipe(gif(sourcemapsEnabled, sourcemaps.write('./')))
        .pipe(gulp.dest(dest));
}

function compileScssRefresh() {
    return compileScss(paths.css[0].src, paths.css[0].dest);
}

const cors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
};

function connectLiveReload() {
    return connect.server({
        root: paths.css[0].root,
        https: true,
        port: 8081,
        host: '0.0.0.0',
        livereload: {
            start: true,
            port: 9000
        },
        middleware: function() {
            return [cors];
        }
    });
}

function watchStyles(src, func) {
    log('Watching ' + c.cyan(src + '/**/*.scss'));
    gulp.watch(src + '/**/*.scss', gulp.series(func, reloadContent)).on('change', function(changedFile) {
        log('File ' + c.yellow(changedFile) + ' was modified');
        sassLinter(changedFile);
    });
}

function reloadContent() {
    log('Reloading CSS...');
    var streams = merge();
    [paths.css[0].dest].forEach(function(path) {
        streams.add(gulp.src(path + '/*.css').pipe(connect.reload()));
    });
    return streams;
}

// Tasks
gulp.task('compile:scss', gulp.series(compileScssRefresh));

gulp.task(
    'default',
    gulp.series(
        gulp.parallel(connectLiveReload, function() {
            watchStyles(paths.css[0].src, compileScssRefresh);
        })
    )
);
