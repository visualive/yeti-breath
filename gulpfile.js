/**
 * WPG for foundation.
 *
 * @author    KUCKLU & VisuALive.
 * @copyright Copyright (c) KUCKLU and VisuAlive.
 * @link      https://www.visualive.jp/
 * @license   MIT License
 */
'use strict';

var conf = require('./source/gulp/config.js');
var requireDir = require('require-dir');
var tasks = requireDir(conf.gulpTasks);
