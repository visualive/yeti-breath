"use strict";

(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
			}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];return s(n ? n : e);
			}, l, l.exports, e, t, n, r);
		}return n[o].exports;
	}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
		s(r[o]);
	}return s;
})({ 1: [function (require, module, exports) {
		/**
   * File customizer.js.
   *
   * Theme Customizer enhancements for a better user experience.
   *
   * Contains handlers to make Theme Customizer preview reload changes asynchronously.
   */

		(function ($) {

			// Site title and description.
			wp.customize('blogname', function (value) {
				value.bind(function (to) {
					$('.site-title a').text(to);
				});
			});
			wp.customize('blogdescription', function (value) {
				value.bind(function (to) {
					$('.site-description').text(to);
				});
			});

			// Header text color.
			wp.customize('header_textcolor', function (value) {
				value.bind(function (to) {
					if ('blank' === to) {
						$('.site-title a, .site-description').css({
							'clip': 'rect(1px, 1px, 1px, 1px)',
							'position': 'absolute'
						});
					} else {
						$('.site-title a, .site-description').css({
							'clip': 'auto',
							'position': 'relative'
						});
						$('.site-title a, .site-description').css({
							'color': to
						});
					}
				});
			});
		})(jQuery);
	}, {}] }, {}, [1]);