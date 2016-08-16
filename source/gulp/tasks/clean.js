'use strict';

var conf = require('../config.js');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('clean', function (cb) {
    return $.cache.clearAll(cb);
});
