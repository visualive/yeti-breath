'use strict';

var conf = require('../config.js');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var watching = false;

gulp.task('scss', function () {
    return gulp.src(conf.scss.src)
        .pipe($.sass({
            includePaths: [
                conf.nodeModules + '/foundation-sites/scss',
                conf.nodeModules + '/motion-ui/src'
            ]
        }).on('error', $.sass.logError))
        .pipe($.if('*.css', $.autoprefixer({
            browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']
        })))
        .pipe($.if('*.css', $.mergeMediaQueries()))
        .pipe($.if('*.css', $.csscomb()))
        .pipe(gulp.dest(conf.scss.dest))
        .pipe($.if('*.css', $.rename({suffix: '.min'})))
        .pipe($.if('*.css', $.csso()))
        .pipe(gulp.dest(conf.scss.dest))
        .pipe($.if(watching, browserSync.reload({
            stream: true
        })));
});

gulp.task('watchMode:scss', function () {
    watching = true
});

gulp.task('watch:scss', ['watchMode:scss', 'scss']);
