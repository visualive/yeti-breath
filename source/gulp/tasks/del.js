'use strict';

var conf = require('../config.js');
var gulp = require('gulp');
var del = require('del');

gulp.task('del', del.bind(null, conf.del));
