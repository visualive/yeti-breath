var fastclick                = require('fastclick/lib/fastclick');
var whatInput                = require('what-input/what-input.js');
var foundation               = require('foundation-sites/js/foundation.core');
var foundationUtilMediaQuery = require('foundation-sites/js/foundation.util.mediaQuery');
var foundationUtilKeyboard   = require('foundation-sites/js/foundation.util.keyboard');
var foundationUtilBox        = require('foundation-sites/js/foundation.util.box');
var foundationUtilMotion     = require('foundation-sites/js/foundation.util.motion');
var foundationUtilNest       = require('foundation-sites/js/foundation.util.nest');
var foundationDropdownMenu   = require('foundation-sites/js/foundation.dropdownMenu');
var foundationAccordionMenu  = require('foundation-sites/js/foundation.accordionMenu');
var skipLinkFocusFix         = require('./components/skip-link-focus-fix');

(function ($) {
    'use strict';

    $(document).foundation();
})(jQuery);
