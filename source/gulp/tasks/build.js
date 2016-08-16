'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('build', ['clean', 'del'], function (cb) {
    return runSequence(['img', 'scss', 'js'], 'clean', cb);
});
