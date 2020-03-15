'use strict';
const gulp = require('gulp');

const log = require('fancy-log');
const c = require('ansi-colors');

const config = require('./config.json');

const gif = require('gulp-if');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const connect = require('gulp-connect');
const styleLint = require('gulp-stylelint');

const sourcemapsEnabled = true;

// Lint scss file with `stylelint`
function sassLinter(file) {
    return gulp.src(file).pipe(
        styleLint({
            failAfterError: false,
            reporters: [{ formatter: 'verbose', console: true }]
        })
    );
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
                includePaths: config['scss-include']
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

function compileProjectScss() {
    return compileScss(config['scss-source'], config['css-destination']);
}

const cors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
};

function connectLiveReload() {
    return connect.server({
        root: config['root'],
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
    return gulp
    .src(config['scss-source'])
    .pipe(connect.reload());
}

// Tasks
gulp.task('compile:scss', gulp.series(compileProjectScss));

gulp.task(
    'default',
    gulp.series(
        gulp.parallel(connectLiveReload, function() {
            watchStyles(config['scss-source'], compileProjectScss);
        })
    )
);
