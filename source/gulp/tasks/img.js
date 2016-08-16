'use strict';

var conf = require('../config.js');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');

gulp.task('img', function () {
    return gulp.src(conf.img.src)
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(conf.img.dest))
        .pipe(browserSync.reload({
            stream: true,
            once: true
        }));
});
