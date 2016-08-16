'use strict';

var conf = require('../config.js');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');

gulp.task('browserSync', function () {
    return browserSync.init(null, {
        notify: false,
        open  : 'external',
        proxy : conf.wpURI,
        https : conf.wpSSL
        //server: {
        //    baseDir: conf.wpPath
        //}
    });
});
