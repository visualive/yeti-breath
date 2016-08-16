"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    ;(function () {
      'use strict';

      /**
       * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
       *
       * @codingstandard ftlabs-jsv2
       * @copyright The Financial Times Limited [All Rights Reserved]
       * @license MIT License (see LICENSE.txt)
       */

      /*jslint browser:true, node:true*/
      /*global define, Event, Node*/

      /**
       * Instantiate fast-clicking listeners on the specified layer.
       *
       * @constructor
       * @param {Element} layer The layer to listen on
       * @param {Object} [options={}] The options to override the defaults
       */

      function FastClick(layer, options) {
        var oldOnClick;

        options = options || {};

        /**
         * Whether a click is currently being tracked.
         *
         * @type boolean
         */
        this.trackingClick = false;

        /**
         * Timestamp for when click tracking started.
         *
         * @type number
         */
        this.trackingClickStart = 0;

        /**
         * The element being tracked for a click.
         *
         * @type EventTarget
         */
        this.targetElement = null;

        /**
         * X-coordinate of touch start event.
         *
         * @type number
         */
        this.touchStartX = 0;

        /**
         * Y-coordinate of touch start event.
         *
         * @type number
         */
        this.touchStartY = 0;

        /**
         * ID of the last touch, retrieved from Touch.identifier.
         *
         * @type number
         */
        this.lastTouchIdentifier = 0;

        /**
         * Touchmove boundary, beyond which a click will be cancelled.
         *
         * @type number
         */
        this.touchBoundary = options.touchBoundary || 10;

        /**
         * The FastClick layer.
         *
         * @type Element
         */
        this.layer = layer;

        /**
         * The minimum time between tap(touchstart and touchend) events
         *
         * @type number
         */
        this.tapDelay = options.tapDelay || 200;

        /**
         * The maximum time for a tap
         *
         * @type number
         */
        this.tapTimeout = options.tapTimeout || 700;

        if (FastClick.notNeeded(layer)) {
          return;
        }

        // Some old versions of Android don't have Function.prototype.bind
        function bind(method, context) {
          return function () {
            return method.apply(context, arguments);
          };
        }

        var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
        var context = this;
        for (var i = 0, l = methods.length; i < l; i++) {
          context[methods[i]] = bind(context[methods[i]], context);
        }

        // Set up event handlers as required
        if (deviceIsAndroid) {
          layer.addEventListener('mouseover', this.onMouse, true);
          layer.addEventListener('mousedown', this.onMouse, true);
          layer.addEventListener('mouseup', this.onMouse, true);
        }

        layer.addEventListener('click', this.onClick, true);
        layer.addEventListener('touchstart', this.onTouchStart, false);
        layer.addEventListener('touchmove', this.onTouchMove, false);
        layer.addEventListener('touchend', this.onTouchEnd, false);
        layer.addEventListener('touchcancel', this.onTouchCancel, false);

        // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
        // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
        // layer when they are cancelled.
        if (!Event.prototype.stopImmediatePropagation) {
          layer.removeEventListener = function (type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
              rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
              rmv.call(layer, type, callback, capture);
            }
          };

          layer.addEventListener = function (type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
              adv.call(layer, type, callback.hijacked || (callback.hijacked = function (event) {
                if (!event.propagationStopped) {
                  callback(event);
                }
              }), capture);
            } else {
              adv.call(layer, type, callback, capture);
            }
          };
        }

        // If a handler is already declared in the element's onclick attribute, it will be fired before
        // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
        // adding it as listener.
        if (typeof layer.onclick === 'function') {

          // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
          // - the old one won't work if passed to addEventListener directly.
          oldOnClick = layer.onclick;
          layer.addEventListener('click', function (event) {
            oldOnClick(event);
          }, false);
          layer.onclick = null;
        }
      }

      /**
      * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
      *
      * @type boolean
      */
      var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

      /**
       * Android requires exceptions.
       *
       * @type boolean
       */
      var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;

      /**
       * iOS requires exceptions.
       *
       * @type boolean
       */
      var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;

      /**
       * iOS 4 requires an exception for select elements.
       *
       * @type boolean
       */
      var deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent);

      /**
       * iOS 6.0-7.* requires the target element to be manually derived
       *
       * @type boolean
       */
      var deviceIsIOSWithBadTarget = deviceIsIOS && /OS [6-7]_\d/.test(navigator.userAgent);

      /**
       * BlackBerry requires exceptions.
       *
       * @type boolean
       */
      var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

      /**
       * Determine whether a given element requires a native click.
       *
       * @param {EventTarget|Element} target Target DOM element
       * @returns {boolean} Returns true if the element needs a native click
       */
      FastClick.prototype.needsClick = function (target) {
        switch (target.nodeName.toLowerCase()) {

          // Don't send a synthetic click to disabled inputs (issue #62)
          case 'button':
          case 'select':
          case 'textarea':
            if (target.disabled) {
              return true;
            }

            break;
          case 'input':

            // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
            if (deviceIsIOS && target.type === 'file' || target.disabled) {
              return true;
            }

            break;
          case 'label':
          case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
          case 'video':
            return true;
        }

        return (/\bneedsclick\b/.test(target.className)
        );
      };

      /**
       * Determine whether a given element requires a call to focus to simulate click into element.
       *
       * @param {EventTarget|Element} target Target DOM element
       * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
       */
      FastClick.prototype.needsFocus = function (target) {
        switch (target.nodeName.toLowerCase()) {
          case 'textarea':
            return true;
          case 'select':
            return !deviceIsAndroid;
          case 'input':
            switch (target.type) {
              case 'button':
              case 'checkbox':
              case 'file':
              case 'image':
              case 'radio':
              case 'submit':
                return false;
            }

            // No point in attempting to focus disabled inputs
            return !target.disabled && !target.readOnly;
          default:
            return (/\bneedsfocus\b/.test(target.className)
            );
        }
      };

      /**
       * Send a click event to the specified element.
       *
       * @param {EventTarget|Element} targetElement
       * @param {Event} event
       */
      FastClick.prototype.sendClick = function (targetElement, event) {
        var clickEvent, touch;

        // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
        if (document.activeElement && document.activeElement !== targetElement) {
          document.activeElement.blur();
        }

        touch = event.changedTouches[0];

        // Synthesise a click event, with an extra attribute so it can be tracked
        clickEvent = document.createEvent('MouseEvents');
        clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
        clickEvent.forwardedTouchEvent = true;
        targetElement.dispatchEvent(clickEvent);
      };

      FastClick.prototype.determineEventType = function (targetElement) {

        //Issue #159: Android Chrome Select Box does not open with a synthetic click event
        if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
          return 'mousedown';
        }

        return 'click';
      };

      /**
       * @param {EventTarget|Element} targetElement
       */
      FastClick.prototype.focus = function (targetElement) {
        var length;

        // Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
        if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
          length = targetElement.value.length;
          targetElement.setSelectionRange(length, length);
        } else {
          targetElement.focus();
        }
      };

      /**
       * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
       *
       * @param {EventTarget|Element} targetElement
       */
      FastClick.prototype.updateScrollParent = function (targetElement) {
        var scrollParent, parentElement;

        scrollParent = targetElement.fastClickScrollParent;

        // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
        // target element was moved to another parent.
        if (!scrollParent || !scrollParent.contains(targetElement)) {
          parentElement = targetElement;
          do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
              scrollParent = parentElement;
              targetElement.fastClickScrollParent = parentElement;
              break;
            }

            parentElement = parentElement.parentElement;
          } while (parentElement);
        }

        // Always update the scroll top tracker if possible.
        if (scrollParent) {
          scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
        }
      };

      /**
       * @param {EventTarget} targetElement
       * @returns {Element|EventTarget}
       */
      FastClick.prototype.getTargetElementFromEventTarget = function (eventTarget) {

        // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
        if (eventTarget.nodeType === Node.TEXT_NODE) {
          return eventTarget.parentNode;
        }

        return eventTarget;
      };

      /**
       * On touch start, record the position and scroll offset.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.onTouchStart = function (event) {
        var targetElement, touch, selection;

        // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
        if (event.targetTouches.length > 1) {
          return true;
        }

        targetElement = this.getTargetElementFromEventTarget(event.target);
        touch = event.targetTouches[0];

        if (deviceIsIOS) {

          // Only trusted events will deselect text on iOS (issue #49)
          selection = window.getSelection();
          if (selection.rangeCount && !selection.isCollapsed) {
            return true;
          }

          if (!deviceIsIOS4) {

            // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
            // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
            // with the same identifier as the touch event that previously triggered the click that triggered the alert.
            // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
            // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
            // Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
            // which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
            // random integers, it's safe to to continue if the identifier is 0 here.
            if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
              event.preventDefault();
              return false;
            }

            this.lastTouchIdentifier = touch.identifier;

            // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
            // 1) the user does a fling scroll on the scrollable layer
            // 2) the user stops the fling scroll with another tap
            // then the event.target of the last 'touchend' event will be the element that was under the user's finger
            // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
            // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
            this.updateScrollParent(targetElement);
          }
        }

        this.trackingClick = true;
        this.trackingClickStart = event.timeStamp;
        this.targetElement = targetElement;

        this.touchStartX = touch.pageX;
        this.touchStartY = touch.pageY;

        // Prevent phantom clicks on fast double-tap (issue #36)
        if (event.timeStamp - this.lastClickTime < this.tapDelay) {
          event.preventDefault();
        }

        return true;
      };

      /**
       * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.touchHasMoved = function (event) {
        var touch = event.changedTouches[0],
            boundary = this.touchBoundary;

        if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
          return true;
        }

        return false;
      };

      /**
       * Update the last position.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.onTouchMove = function (event) {
        if (!this.trackingClick) {
          return true;
        }

        // If the touch has moved, cancel the click tracking
        if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
          this.trackingClick = false;
          this.targetElement = null;
        }

        return true;
      };

      /**
       * Attempt to find the labelled control for the given label element.
       *
       * @param {EventTarget|HTMLLabelElement} labelElement
       * @returns {Element|null}
       */
      FastClick.prototype.findControl = function (labelElement) {

        // Fast path for newer browsers supporting the HTML5 control attribute
        if (labelElement.control !== undefined) {
          return labelElement.control;
        }

        // All browsers under test that support touch events also support the HTML5 htmlFor attribute
        if (labelElement.htmlFor) {
          return document.getElementById(labelElement.htmlFor);
        }

        // If no for attribute exists, attempt to retrieve the first labellable descendant element
        // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
        return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
      };

      /**
       * On touch end, determine whether to send a click event at once.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.onTouchEnd = function (event) {
        var forElement,
            trackingClickStart,
            targetTagName,
            scrollParent,
            touch,
            targetElement = this.targetElement;

        if (!this.trackingClick) {
          return true;
        }

        // Prevent phantom clicks on fast double-tap (issue #36)
        if (event.timeStamp - this.lastClickTime < this.tapDelay) {
          this.cancelNextClick = true;
          return true;
        }

        if (event.timeStamp - this.trackingClickStart > this.tapTimeout) {
          return true;
        }

        // Reset to prevent wrong click cancel on input (issue #156).
        this.cancelNextClick = false;

        this.lastClickTime = event.timeStamp;

        trackingClickStart = this.trackingClickStart;
        this.trackingClick = false;
        this.trackingClickStart = 0;

        // On some iOS devices, the targetElement supplied with the event is invalid if the layer
        // is performing a transition or scroll, and has to be re-detected manually. Note that
        // for this to function correctly, it must be called *after* the event target is checked!
        // See issue #57; also filed as rdar://13048589 .
        if (deviceIsIOSWithBadTarget) {
          touch = event.changedTouches[0];

          // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
          targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
          targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
        }

        targetTagName = targetElement.tagName.toLowerCase();
        if (targetTagName === 'label') {
          forElement = this.findControl(targetElement);
          if (forElement) {
            this.focus(targetElement);
            if (deviceIsAndroid) {
              return false;
            }

            targetElement = forElement;
          }
        } else if (this.needsFocus(targetElement)) {

          // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
          // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
          if (event.timeStamp - trackingClickStart > 100 || deviceIsIOS && window.top !== window && targetTagName === 'input') {
            this.targetElement = null;
            return false;
          }

          this.focus(targetElement);
          this.sendClick(targetElement, event);

          // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
          // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
          if (!deviceIsIOS || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
          }

          return false;
        }

        if (deviceIsIOS && !deviceIsIOS4) {

          // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
          // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
          scrollParent = targetElement.fastClickScrollParent;
          if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
          }
        }

        // Prevent the actual click from going though - unless the target node is marked as requiring
        // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
        if (!this.needsClick(targetElement)) {
          event.preventDefault();
          this.sendClick(targetElement, event);
        }

        return false;
      };

      /**
       * On touch cancel, stop tracking the click.
       *
       * @returns {void}
       */
      FastClick.prototype.onTouchCancel = function () {
        this.trackingClick = false;
        this.targetElement = null;
      };

      /**
       * Determine mouse events which should be permitted.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.onMouse = function (event) {

        // If a target element was never set (because a touch event was never fired) allow the event
        if (!this.targetElement) {
          return true;
        }

        if (event.forwardedTouchEvent) {
          return true;
        }

        // Programmatically generated events targeting a specific element should be permitted
        if (!event.cancelable) {
          return true;
        }

        // Derive and check the target element to see whether the mouse event needs to be permitted;
        // unless explicitly enabled, prevent non-touch click events from triggering actions,
        // to prevent ghost/doubleclicks.
        if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

          // Prevent any user-added listeners declared on FastClick element from being fired.
          if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
          }

          // Cancel the event
          event.stopPropagation();
          event.preventDefault();

          return false;
        }

        // If the mouse event is permitted, return true for the action to go through.
        return true;
      };

      /**
       * On actual clicks, determine whether this is a touch-generated click, a click action occurring
       * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
       * an actual click which should be permitted.
       *
       * @param {Event} event
       * @returns {boolean}
       */
      FastClick.prototype.onClick = function (event) {
        var permitted;

        // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
        if (this.trackingClick) {
          this.targetElement = null;
          this.trackingClick = false;
          return true;
        }

        // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
        if (event.target.type === 'submit' && event.detail === 0) {
          return true;
        }

        permitted = this.onMouse(event);

        // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
        if (!permitted) {
          this.targetElement = null;
        }

        // If clicks are permitted, return true for the action to go through.
        return permitted;
      };

      /**
       * Remove all FastClick's event listeners.
       *
       * @returns {void}
       */
      FastClick.prototype.destroy = function () {
        var layer = this.layer;

        if (deviceIsAndroid) {
          layer.removeEventListener('mouseover', this.onMouse, true);
          layer.removeEventListener('mousedown', this.onMouse, true);
          layer.removeEventListener('mouseup', this.onMouse, true);
        }

        layer.removeEventListener('click', this.onClick, true);
        layer.removeEventListener('touchstart', this.onTouchStart, false);
        layer.removeEventListener('touchmove', this.onTouchMove, false);
        layer.removeEventListener('touchend', this.onTouchEnd, false);
        layer.removeEventListener('touchcancel', this.onTouchCancel, false);
      };

      /**
       * Check whether FastClick is needed.
       *
       * @param {Element} layer The layer to listen on
       */
      FastClick.notNeeded = function (layer) {
        var metaViewport;
        var chromeVersion;
        var blackberryVersion;
        var firefoxVersion;

        // Devices that don't support touch don't need FastClick
        if (typeof window.ontouchstart === 'undefined') {
          return true;
        }

        // Chrome version - zero for other browsers
        chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

        if (chromeVersion) {

          if (deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
              // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
              if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                return true;
              }
              // Chrome 32 and above with width=device-width or less don't need FastClick
              if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                return true;
              }
            }

            // Chrome desktop doesn't need FastClick (issue #15)
          } else {
            return true;
          }
        }

        if (deviceIsBlackBerry10) {
          blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

          // BlackBerry 10.3+ does not require Fastclick library.
          // https://github.com/ftlabs/fastclick/issues/251
          if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
              // user-scalable=no eliminates click delay.
              if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                return true;
              }
              // width=device-width (or less than device-width) eliminates click delay.
              if (document.documentElement.scrollWidth <= window.outerWidth) {
                return true;
              }
            }
          }
        }

        // IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
        if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
          return true;
        }

        // Firefox version - zero for other browsers
        firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

        if (firefoxVersion >= 27) {
          // Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

          metaViewport = document.querySelector('meta[name=viewport]');
          if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
            return true;
          }
        }

        // IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
        // http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
        if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
          return true;
        }

        return false;
      };

      /**
       * Factory method for creating a FastClick object
       *
       * @param {Element} layer The layer to listen on
       * @param {Object} [options={}] The options to override the defaults
       */
      FastClick.attach = function (layer, options) {
        return new FastClick(layer, options);
      };

      if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

        // AMD. Register as an anonymous module.
        define(function () {
          return FastClick;
        });
      } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = FastClick.attach;
        module.exports.FastClick = FastClick;
      } else {
        window.FastClick = FastClick;
      }
    })();
  }, {}], 2: [function (require, module, exports) {
    'use strict';

    !function ($) {

      /**
       * AccordionMenu module.
       * @module foundation.accordionMenu
       * @requires foundation.util.keyboard
       * @requires foundation.util.motion
       * @requires foundation.util.nest
       */

      var AccordionMenu = function () {
        /**
         * Creates a new instance of an accordion menu.
         * @class
         * @fires AccordionMenu#init
         * @param {jQuery} element - jQuery object to make into an accordion menu.
         * @param {Object} options - Overrides to the default plugin settings.
         */
        function AccordionMenu(element, options) {
          _classCallCheck(this, AccordionMenu);

          this.$element = element;
          this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

          Foundation.Nest.Feather(this.$element, 'accordion');

          this._init();

          Foundation.registerPlugin(this, 'AccordionMenu');
          Foundation.Keyboard.register('AccordionMenu', {
            'ENTER': 'toggle',
            'SPACE': 'toggle',
            'ARROW_RIGHT': 'open',
            'ARROW_UP': 'up',
            'ARROW_DOWN': 'down',
            'ARROW_LEFT': 'close',
            'ESCAPE': 'closeAll',
            'TAB': 'down',
            'SHIFT_TAB': 'up'
          });
        }

        /**
         * Initializes the accordion menu by hiding all nested menus.
         * @private
         */


        _createClass(AccordionMenu, [{
          key: "_init",
          value: function _init() {
            this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
            this.$element.attr({
              'role': 'tablist',
              'aria-multiselectable': this.options.multiOpen
            });

            this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
            this.$menuLinks.each(function () {
              var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
                  $elem = $(this),
                  $sub = $elem.children('[data-submenu]'),
                  subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
                  isActive = $sub.hasClass('is-active');
              $elem.attr({
                'aria-controls': subId,
                'aria-expanded': isActive,
                'role': 'tab',
                'id': linkId
              });
              $sub.attr({
                'aria-labelledby': linkId,
                'aria-hidden': !isActive,
                'role': 'tabpanel',
                'id': subId
              });
            });
            var initPanes = this.$element.find('.is-active');
            if (initPanes.length) {
              var _this = this;
              initPanes.each(function () {
                _this.down($(this));
              });
            }
            this._events();
          }

          /**
           * Adds event handlers for items within the menu.
           * @private
           */

        }, {
          key: "_events",
          value: function _events() {
            var _this = this;

            this.$element.find('li').each(function () {
              var $submenu = $(this).children('[data-submenu]');

              if ($submenu.length) {
                $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
                  e.preventDefault();

                  _this.toggle($submenu);
                });
              }
            }).on('keydown.zf.accordionmenu', function (e) {
              var $element = $(this),
                  $elements = $element.parent('ul').children('li'),
                  $prevElement,
                  $nextElement,
                  $target = $element.children('[data-submenu]');

              $elements.each(function (i) {
                if ($(this).is($element)) {
                  $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
                  $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

                  if ($(this).children('[data-submenu]:visible').length) {
                    // has open sub menu
                    $nextElement = $element.find('li:first-child').find('a').first();
                  }
                  if ($(this).is(':first-child')) {
                    // is first element of sub menu
                    $prevElement = $element.parents('li').first().find('a').first();
                  } else if ($prevElement.children('[data-submenu]:visible').length) {
                    // if previous element has open sub menu
                    $prevElement = $prevElement.find('li:last-child').find('a').first();
                  }
                  if ($(this).is(':last-child')) {
                    // is last element of sub menu
                    $nextElement = $element.parents('li').first().next('li').find('a').first();
                  }

                  return;
                }
              });
              Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
                open: function () {
                  if ($target.is(':hidden')) {
                    _this.down($target);
                    $target.find('li').first().find('a').first().focus();
                  }
                },
                close: function () {
                  if ($target.length && !$target.is(':hidden')) {
                    // close active sub of this item
                    _this.up($target);
                  } else if ($element.parent('[data-submenu]').length) {
                    // close currently open sub
                    _this.up($element.parent('[data-submenu]'));
                    $element.parents('li').first().find('a').first().focus();
                  }
                },
                up: function () {
                  $prevElement.attr('tabindex', -1).focus();
                  return true;
                },
                down: function () {
                  $nextElement.attr('tabindex', -1).focus();
                  return true;
                },
                toggle: function () {
                  if ($element.children('[data-submenu]').length) {
                    _this.toggle($element.children('[data-submenu]'));
                  }
                },
                closeAll: function () {
                  _this.hideAll();
                },
                handled: function (preventDefault) {
                  if (preventDefault) {
                    e.preventDefault();
                  }
                  e.stopImmediatePropagation();
                }
              });
            }); //.attr('tabindex', 0);
          }

          /**
           * Closes all panes of the menu.
           * @function
           */

        }, {
          key: "hideAll",
          value: function hideAll() {
            this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
          }

          /**
           * Toggles the open/close state of a submenu.
           * @function
           * @param {jQuery} $target - the submenu to toggle
           */

        }, {
          key: "toggle",
          value: function toggle($target) {
            if (!$target.is(':animated')) {
              if (!$target.is(':hidden')) {
                this.up($target);
              } else {
                this.down($target);
              }
            }
          }

          /**
           * Opens the sub-menu defined by `$target`.
           * @param {jQuery} $target - Sub-menu to open.
           * @fires AccordionMenu#down
           */

        }, {
          key: "down",
          value: function down($target) {
            var _this = this;

            if (!this.options.multiOpen) {
              this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
            }

            $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

            //Foundation.Move(this.options.slideSpeed, $target, function() {
            $target.slideDown(_this.options.slideSpeed, function () {
              /**
               * Fires when the menu is done opening.
               * @event AccordionMenu#down
               */
              _this.$element.trigger('down.zf.accordionMenu', [$target]);
            });
            //});
          }

          /**
           * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
           * @param {jQuery} $target - Sub-menu to close.
           * @fires AccordionMenu#up
           */

        }, {
          key: "up",
          value: function up($target) {
            var _this = this;
            //Foundation.Move(this.options.slideSpeed, $target, function(){
            $target.slideUp(_this.options.slideSpeed, function () {
              /**
               * Fires when the menu is done collapsing up.
               * @event AccordionMenu#up
               */
              _this.$element.trigger('up.zf.accordionMenu', [$target]);
            });
            //});

            var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

            $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
          }

          /**
           * Destroys an instance of accordion menu.
           * @fires AccordionMenu#destroyed
           */

        }, {
          key: "destroy",
          value: function destroy() {
            this.$element.find('[data-submenu]').slideDown(0).css('display', '');
            this.$element.find('a').off('click.zf.accordionMenu');

            Foundation.Nest.Burn(this.$element, 'accordion');
            Foundation.unregisterPlugin(this);
          }
        }]);

        return AccordionMenu;
      }();

      AccordionMenu.defaults = {
        /**
         * Amount of time to animate the opening of a submenu in ms.
         * @option
         * @example 250
         */
        slideSpeed: 250,
        /**
         * Allow the menu to have multiple open panes.
         * @option
         * @example true
         */
        multiOpen: true
      };

      // Window exports
      Foundation.plugin(AccordionMenu, 'AccordionMenu');
    }(jQuery);
  }, {}], 3: [function (require, module, exports) {
    !function ($) {

      "use strict";

      var FOUNDATION_VERSION = '6.2.2';

      // Global Foundation object
      // This is attached to the window, or used as a module for AMD/Browserify
      var Foundation = {
        version: FOUNDATION_VERSION,

        /**
         * Stores initialized plugins.
         */
        _plugins: {},

        /**
         * Stores generated unique ids for plugin instances
         */
        _uuids: [],

        /**
         * Returns a boolean for RTL support
         */
        rtl: function () {
          return $('html').attr('dir') === 'rtl';
        },
        /**
         * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
         * @param {Object} plugin - The constructor of the plugin.
         */
        plugin: function (plugin, name) {
          // Object key to use when adding to global Foundation object
          // Examples: Foundation.Reveal, Foundation.OffCanvas
          var className = name || functionName(plugin);
          // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
          // Examples: data-reveal, data-off-canvas
          var attrName = hyphenate(className);

          // Add to the Foundation object and the plugins list (for reflowing)
          this._plugins[attrName] = this[className] = plugin;
        },
        /**
         * @function
         * Populates the _uuids array with pointers to each individual plugin instance.
         * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
         * Also fires the initialization event for each plugin, consolidating repetitive code.
         * @param {Object} plugin - an instance of a plugin, usually `this` in context.
         * @param {String} name - the name of the plugin, passed as a camelCased string.
         * @fires Plugin#init
         */
        registerPlugin: function (plugin, name) {
          var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
          plugin.uuid = this.GetYoDigits(6, pluginName);

          if (!plugin.$element.attr("data-" + pluginName)) {
            plugin.$element.attr("data-" + pluginName, plugin.uuid);
          }
          if (!plugin.$element.data('zfPlugin')) {
            plugin.$element.data('zfPlugin', plugin);
          }
          /**
           * Fires when the plugin has initialized.
           * @event Plugin#init
           */
          plugin.$element.trigger("init.zf." + pluginName);

          this._uuids.push(plugin.uuid);

          return;
        },
        /**
         * @function
         * Removes the plugins uuid from the _uuids array.
         * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
         * Also fires the destroyed event for the plugin, consolidating repetitive code.
         * @param {Object} plugin - an instance of a plugin, usually `this` in context.
         * @fires Plugin#destroyed
         */
        unregisterPlugin: function (plugin) {
          var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

          this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
          plugin.$element.removeAttr("data-" + pluginName).removeData('zfPlugin')
          /**
           * Fires when the plugin has been destroyed.
           * @event Plugin#destroyed
           */
          .trigger("destroyed.zf." + pluginName);
          for (var prop in plugin) {
            plugin[prop] = null; //clean up script to prep for garbage collection.
          }
          return;
        },

        /**
         * @function
         * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
         * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
         * @default If no argument is passed, reflow all currently active plugins.
         */
        reInit: function (plugins) {
          var isJQ = plugins instanceof $;
          try {
            if (isJQ) {
              plugins.each(function () {
                $(this).data('zfPlugin')._init();
              });
            } else {
              var type = typeof plugins,
                  _this = this,
                  fns = {
                'object': function (plgs) {
                  plgs.forEach(function (p) {
                    p = hyphenate(p);
                    $('[data-' + p + ']').foundation('_init');
                  });
                },
                'string': function () {
                  plugins = hyphenate(plugins);
                  $('[data-' + plugins + ']').foundation('_init');
                },
                'undefined': function () {
                  this['object'](Object.keys(_this._plugins));
                }
              };
              fns[type](plugins);
            }
          } catch (err) {
            console.error(err);
          } finally {
            return plugins;
          }
        },

        /**
         * returns a random base-36 uid with namespacing
         * @function
         * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
         * @param {String} namespace - name of plugin to be incorporated in uid, optional.
         * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
         * @returns {String} - unique id
         */
        GetYoDigits: function (length, namespace) {
          length = length || 6;
          return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? "-" + namespace : '');
        },
        /**
         * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
         * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
         * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
         */
        reflow: function (elem, plugins) {

          // If plugins is undefined, just grab everything
          if (typeof plugins === 'undefined') {
            plugins = Object.keys(this._plugins);
          }
          // If plugins is a string, convert it to an array with one item
          else if (typeof plugins === 'string') {
              plugins = [plugins];
            }

          var _this = this;

          // Iterate through each plugin
          $.each(plugins, function (i, name) {
            // Get the current plugin
            var plugin = _this._plugins[name];

            // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
            var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

            // For each plugin found, initialize it
            $elem.each(function () {
              var $el = $(this),
                  opts = {};
              // Don't double-dip on plugins
              if ($el.data('zfPlugin')) {
                console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
                return;
              }

              if ($el.attr('data-options')) {
                var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
                  var opt = e.split(':').map(function (el) {
                    return el.trim();
                  });
                  if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
                });
              }
              try {
                $el.data('zfPlugin', new plugin($(this), opts));
              } catch (er) {
                console.error(er);
              } finally {
                return;
              }
            });
          });
        },
        getFnName: functionName,
        transitionend: function ($elem) {
          var transitions = {
            'transition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'otransitionend'
          };
          var elem = document.createElement('div'),
              end;

          for (var t in transitions) {
            if (typeof elem.style[t] !== 'undefined') {
              end = transitions[t];
            }
          }
          if (end) {
            return end;
          } else {
            end = setTimeout(function () {
              $elem.triggerHandler('transitionend', [$elem]);
            }, 1);
            return 'transitionend';
          }
        }
      };

      Foundation.util = {
        /**
         * Function for applying a debounce effect to a function call.
         * @function
         * @param {Function} func - Function to be called at end of timeout.
         * @param {Number} delay - Time in ms to delay the call of `func`.
         * @returns function
         */
        throttle: function (func, delay) {
          var timer = null;

          return function () {
            var context = this,
                args = arguments;

            if (timer === null) {
              timer = setTimeout(function () {
                func.apply(context, args);
                timer = null;
              }, delay);
            }
          };
        }
      };

      // TODO: consider not making this a jQuery function
      // TODO: need way to reflow vs. re-initialize
      /**
       * The Foundation jQuery method.
       * @param {String|Array} method - An action to perform on the current jQuery object.
       */
      var foundation = function (method) {
        var type = typeof method,
            $meta = $('meta.foundation-mq'),
            $noJS = $('.no-js');

        if (!$meta.length) {
          $('<meta class="foundation-mq">').appendTo(document.head);
        }
        if ($noJS.length) {
          $noJS.removeClass('no-js');
        }

        if (type === 'undefined') {
          //needs to initialize the Foundation object, or an individual plugin.
          Foundation.MediaQuery._init();
          Foundation.reflow(this);
        } else if (type === 'string') {
          //an individual method to invoke on a plugin or group of plugins
          var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
          var plugClass = this.data('zfPlugin'); //determine the class of plugin

          if (plugClass !== undefined && plugClass[method] !== undefined) {
            //make sure both the class and method exist
            if (this.length === 1) {
              //if there's only one, call it directly.
              plugClass[method].apply(plugClass, args);
            } else {
              this.each(function (i, el) {
                //otherwise loop through the jQuery collection and invoke the method on each
                plugClass[method].apply($(el).data('zfPlugin'), args);
              });
            }
          } else {
            //error for no class or no method
            throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
          }
        } else {
          //error for invalid argument type
          throw new TypeError("We're sorry, " + type + " is not a valid parameter. You must use a string representing the method you wish to invoke.");
        }
        return this;
      };

      window.Foundation = Foundation;
      $.fn.foundation = foundation;

      // Polyfill for requestAnimationFrame
      (function () {
        if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
          return new Date().getTime();
        };

        var vendors = ['webkit', 'moz'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
          var vp = vendors[i];
          window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
          window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
        }
        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
          var lastTime = 0;
          window.requestAnimationFrame = function (callback) {
            var now = Date.now();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function () {
              callback(lastTime = nextTime);
            }, nextTime - now);
          };
          window.cancelAnimationFrame = clearTimeout;
        }
        /**
         * Polyfill for performance.now, required by rAF
         */
        if (!window.performance || !window.performance.now) {
          window.performance = {
            start: Date.now(),
            now: function () {
              return Date.now() - this.start;
            }
          };
        }
      })();
      if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
          if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
          }

          var aArgs = Array.prototype.slice.call(arguments, 1),
              fToBind = this,
              fNOP = function () {},
              fBound = function () {
            return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
          };

          if (this.prototype) {
            // native functions don't have a prototype
            fNOP.prototype = this.prototype;
          }
          fBound.prototype = new fNOP();

          return fBound;
        };
      }
      // Polyfill to get the name of a function in IE9
      function functionName(fn) {
        if (Function.prototype.name === undefined) {
          var funcNameRegex = /function\s([^(]{1,})\(/;
          var results = funcNameRegex.exec(fn.toString());
          return results && results.length > 1 ? results[1].trim() : "";
        } else if (fn.prototype === undefined) {
          return fn.constructor.name;
        } else {
          return fn.prototype.constructor.name;
        }
      }
      function parseValue(str) {
        if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
        return str;
      }
      // Convert PascalCase to kebab-case
      // Thank you: http://stackoverflow.com/a/8955580
      function hyphenate(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      }
    }(jQuery);
  }, {}], 4: [function (require, module, exports) {
    'use strict';

    !function ($) {

      /**
       * DropdownMenu module.
       * @module foundation.dropdown-menu
       * @requires foundation.util.keyboard
       * @requires foundation.util.box
       * @requires foundation.util.nest
       */

      var DropdownMenu = function () {
        /**
         * Creates a new instance of DropdownMenu.
         * @class
         * @fires DropdownMenu#init
         * @param {jQuery} element - jQuery object to make into a dropdown menu.
         * @param {Object} options - Overrides to the default plugin settings.
         */
        function DropdownMenu(element, options) {
          _classCallCheck(this, DropdownMenu);

          this.$element = element;
          this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

          Foundation.Nest.Feather(this.$element, 'dropdown');
          this._init();

          Foundation.registerPlugin(this, 'DropdownMenu');
          Foundation.Keyboard.register('DropdownMenu', {
            'ENTER': 'open',
            'SPACE': 'open',
            'ARROW_RIGHT': 'next',
            'ARROW_UP': 'up',
            'ARROW_DOWN': 'down',
            'ARROW_LEFT': 'previous',
            'ESCAPE': 'close'
          });
        }

        /**
         * Initializes the plugin, and calls _prepareMenu
         * @private
         * @function
         */


        _createClass(DropdownMenu, [{
          key: "_init",
          value: function _init() {
            var subs = this.$element.find('li.is-dropdown-submenu-parent');
            this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

            this.$menuItems = this.$element.find('[role="menuitem"]');
            this.$tabs = this.$element.children('[role="menuitem"]');
            this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

            if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
              this.options.alignment = 'right';
              subs.addClass('opens-left');
            } else {
              subs.addClass('opens-right');
            }
            this.changed = false;
            this._events();
          }
        }, {
          key: "_events",

          /**
           * Adds event listeners to elements within the menu
           * @private
           * @function
           */
          value: function _events() {
            var _this = this,
                hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
                parClass = 'is-dropdown-submenu-parent';

            // used for onClick and in the keyboard handlers
            var handleClickFn = function (e) {
              var $elem = $(e.target).parentsUntil('ul', "." + parClass),
                  hasSub = $elem.hasClass(parClass),
                  hasClicked = $elem.attr('data-is-click') === 'true',
                  $sub = $elem.children('.is-dropdown-submenu');

              if (hasSub) {
                if (hasClicked) {
                  if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                    return;
                  } else {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    _this._hide($elem);
                  }
                } else {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  _this._show($elem.children('.is-dropdown-submenu'));
                  $elem.add($elem.parentsUntil(_this.$element, "." + parClass)).attr('data-is-click', true);
                }
              } else {
                return;
              }
            };

            if (this.options.clickOpen || hasTouch) {
              this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
            }

            if (!this.options.disableHover) {
              this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
                var $elem = $(this),
                    hasSub = $elem.hasClass(parClass);

                if (hasSub) {
                  clearTimeout(_this.delay);
                  _this.delay = setTimeout(function () {
                    _this._show($elem.children('.is-dropdown-submenu'));
                  }, _this.options.hoverDelay);
                }
              }).on('mouseleave.zf.dropdownmenu', function (e) {
                var $elem = $(this),
                    hasSub = $elem.hasClass(parClass);
                if (hasSub && _this.options.autoclose) {
                  if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                    return false;
                  }

                  clearTimeout(_this.delay);
                  _this.delay = setTimeout(function () {
                    _this._hide($elem);
                  }, _this.options.closingTime);
                }
              });
            }
            this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
              var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
                  isTab = _this.$tabs.index($element) > -1,
                  $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
                  $prevElement,
                  $nextElement;

              $elements.each(function (i) {
                if ($(this).is($element)) {
                  $prevElement = $elements.eq(i - 1);
                  $nextElement = $elements.eq(i + 1);
                  return;
                }
              });

              var nextSibling = function () {
                if (!$element.is(':last-child')) {
                  $nextElement.children('a:first').focus();
                  e.preventDefault();
                }
              },
                  prevSibling = function () {
                $prevElement.children('a:first').focus();
                e.preventDefault();
              },
                  openSub = function () {
                var $sub = $element.children('ul.is-dropdown-submenu');
                if ($sub.length) {
                  _this._show($sub);
                  $element.find('li > a:first').focus();
                  e.preventDefault();
                } else {
                  return;
                }
              },
                  closeSub = function () {
                //if ($element.is(':first-child')) {
                var close = $element.parent('ul').parent('li');
                close.children('a:first').focus();
                _this._hide(close);
                e.preventDefault();
                //}
              };
              var functions = {
                open: openSub,
                close: function () {
                  _this._hide(_this.$element);
                  _this.$menuItems.find('a:first').focus(); // focus to first element
                  e.preventDefault();
                },
                handled: function () {
                  e.stopImmediatePropagation();
                }
              };

              if (isTab) {
                if (_this.$element.hasClass(_this.options.verticalClass)) {
                  // vertical menu
                  if (_this.options.alignment === 'left') {
                    // left aligned
                    $.extend(functions, {
                      down: nextSibling,
                      up: prevSibling,
                      next: openSub,
                      previous: closeSub
                    });
                  } else {
                    // right aligned
                    $.extend(functions, {
                      down: nextSibling,
                      up: prevSibling,
                      next: closeSub,
                      previous: openSub
                    });
                  }
                } else {
                  // horizontal menu
                  $.extend(functions, {
                    next: nextSibling,
                    previous: prevSibling,
                    down: openSub,
                    up: closeSub
                  });
                }
              } else {
                // not tabs -> one sub
                if (_this.options.alignment === 'left') {
                  // left aligned
                  $.extend(functions, {
                    next: openSub,
                    previous: closeSub,
                    down: nextSibling,
                    up: prevSibling
                  });
                } else {
                  // right aligned
                  $.extend(functions, {
                    next: closeSub,
                    previous: openSub,
                    down: nextSibling,
                    up: prevSibling
                  });
                }
              }
              Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
            });
          }

          /**
           * Adds an event handler to the body to close any dropdowns on a click.
           * @function
           * @private
           */

        }, {
          key: "_addBodyHandler",
          value: function _addBodyHandler() {
            var $body = $(document.body),
                _this = this;
            $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
              var $link = _this.$element.find(e.target);
              if ($link.length) {
                return;
              }

              _this._hide();
              $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
            });
          }

          /**
           * Opens a dropdown pane, and checks for collisions first.
           * @param {jQuery} $sub - ul element that is a submenu to show
           * @function
           * @private
           * @fires DropdownMenu#show
           */

        }, {
          key: "_show",
          value: function _show($sub) {
            var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
              return $(el).find($sub).length > 0;
            }));
            var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
            this._hide($sibs, idx);
            $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
            var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
            if (!clear) {
              var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
                  $parentLi = $sub.parent('.is-dropdown-submenu-parent');
              $parentLi.removeClass("opens" + oldClass).addClass("opens-" + this.options.alignment);
              clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
              if (!clear) {
                $parentLi.removeClass("opens-" + this.options.alignment).addClass('opens-inner');
              }
              this.changed = true;
            }
            $sub.css('visibility', '');
            if (this.options.closeOnClick) {
              this._addBodyHandler();
            }
            /**
             * Fires when the new dropdown pane is visible.
             * @event DropdownMenu#show
             */
            this.$element.trigger('show.zf.dropdownmenu', [$sub]);
          }

          /**
           * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
           * @function
           * @param {jQuery} $elem - element with a submenu to hide
           * @param {Number} idx - index of the $tabs collection to hide
           * @private
           */

        }, {
          key: "_hide",
          value: function _hide($elem, idx) {
            var $toClose;
            if ($elem && $elem.length) {
              $toClose = $elem;
            } else if (idx !== undefined) {
              $toClose = this.$tabs.not(function (i, el) {
                return i === idx;
              });
            } else {
              $toClose = this.$element;
            }
            var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

            if (somethingToClose) {
              $toClose.find('li.is-active').add($toClose).attr({
                'aria-expanded': false,
                'data-is-click': false
              }).removeClass('is-active');

              $toClose.find('ul.js-dropdown-active').attr({
                'aria-hidden': true
              }).removeClass('js-dropdown-active');

              if (this.changed || $toClose.find('opens-inner').length) {
                var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
                $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass("opens-inner opens-" + this.options.alignment).addClass("opens-" + oldClass);
                this.changed = false;
              }
              /**
               * Fires when the open menus are closed.
               * @event DropdownMenu#hide
               */
              this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
            }
          }

          /**
           * Destroys the plugin.
           * @function
           */

        }, {
          key: "destroy",
          value: function destroy() {
            this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
            $(document.body).off('.zf.dropdownmenu');
            Foundation.Nest.Burn(this.$element, 'dropdown');
            Foundation.unregisterPlugin(this);
          }
        }]);

        return DropdownMenu;
      }();

      /**
       * Default settings for plugin
       */


      DropdownMenu.defaults = {
        /**
         * Disallows hover events from opening submenus
         * @option
         * @example false
         */
        disableHover: false,
        /**
         * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
         * @option
         * @example true
         */
        autoclose: true,
        /**
         * Amount of time to delay opening a submenu on hover event.
         * @option
         * @example 50
         */
        hoverDelay: 50,
        /**
         * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
         * @option
         * @example true
         */
        clickOpen: false,
        /**
         * Amount of time to delay closing a submenu on a mouseleave event.
         * @option
         * @example 500
         */

        closingTime: 500,
        /**
         * Position of the menu relative to what direction the submenus should open. Handled by JS.
         * @option
         * @example 'left'
         */
        alignment: 'left',
        /**
         * Allow clicks on the body to close any open submenus.
         * @option
         * @example true
         */
        closeOnClick: true,
        /**
         * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
         * @option
         * @example 'vertical'
         */
        verticalClass: 'vertical',
        /**
         * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
         * @option
         * @example 'align-right'
         */
        rightClass: 'align-right',
        /**
         * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
         * @option
         * @example false
         */
        forceFollow: true
      };

      // Window exports
      Foundation.plugin(DropdownMenu, 'DropdownMenu');
    }(jQuery);
  }, {}], 5: [function (require, module, exports) {
    'use strict';

    !function ($) {

      Foundation.Box = {
        ImNotTouchingYou: ImNotTouchingYou,
        GetDimensions: GetDimensions,
        GetOffsets: GetOffsets
      };

      /**
       * Compares the dimensions of an element to a container and determines collision events with container.
       * @function
       * @param {jQuery} element - jQuery object to test for collisions.
       * @param {jQuery} parent - jQuery object to use as bounding container.
       * @param {Boolean} lrOnly - set to true to check left and right values only.
       * @param {Boolean} tbOnly - set to true to check top and bottom values only.
       * @default if no parent object passed, detects collisions with `window`.
       * @returns {Boolean} - true if collision free, false if a collision in any direction.
       */
      function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
        var eleDims = GetDimensions(element),
            top,
            bottom,
            left,
            right;

        if (parent) {
          var parDims = GetDimensions(parent);

          bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
          top = eleDims.offset.top >= parDims.offset.top;
          left = eleDims.offset.left >= parDims.offset.left;
          right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
        } else {
          bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
          top = eleDims.offset.top >= eleDims.windowDims.offset.top;
          left = eleDims.offset.left >= eleDims.windowDims.offset.left;
          right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
        }

        var allDirs = [bottom, top, left, right];

        if (lrOnly) {
          return left === right === true;
        }

        if (tbOnly) {
          return top === bottom === true;
        }

        return allDirs.indexOf(false) === -1;
      };

      /**
       * Uses native methods to return an object of dimension values.
       * @function
       * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
       * @returns {Object} - nested object of integer pixel values
       * TODO - if element is window, return only those values.
       */
      function GetDimensions(elem, test) {
        elem = elem.length ? elem[0] : elem;

        if (elem === window || elem === document) {
          throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
        }

        var rect = elem.getBoundingClientRect(),
            parRect = elem.parentNode.getBoundingClientRect(),
            winRect = document.body.getBoundingClientRect(),
            winY = window.pageYOffset,
            winX = window.pageXOffset;

        return {
          width: rect.width,
          height: rect.height,
          offset: {
            top: rect.top + winY,
            left: rect.left + winX
          },
          parentDims: {
            width: parRect.width,
            height: parRect.height,
            offset: {
              top: parRect.top + winY,
              left: parRect.left + winX
            }
          },
          windowDims: {
            width: winRect.width,
            height: winRect.height,
            offset: {
              top: winY,
              left: winX
            }
          }
        };
      }

      /**
       * Returns an object of top and left integer pixel values for dynamically rendered elements,
       * such as: Tooltip, Reveal, and Dropdown
       * @function
       * @param {jQuery} element - jQuery object for the element being positioned.
       * @param {jQuery} anchor - jQuery object for the element's anchor point.
       * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
       * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
       * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
       * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
       * TODO alter/rewrite to work with `em` values as well/instead of pixels
       */
      function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
        var $eleDims = GetDimensions(element),
            $anchorDims = anchor ? GetDimensions(anchor) : null;

        switch (position) {
          case 'top':
            return {
              left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
              top: $anchorDims.offset.top - ($eleDims.height + vOffset)
            };
            break;
          case 'left':
            return {
              left: $anchorDims.offset.left - ($eleDims.width + hOffset),
              top: $anchorDims.offset.top
            };
            break;
          case 'right':
            return {
              left: $anchorDims.offset.left + $anchorDims.width + hOffset,
              top: $anchorDims.offset.top
            };
            break;
          case 'center top':
            return {
              left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
              top: $anchorDims.offset.top - ($eleDims.height + vOffset)
            };
            break;
          case 'center bottom':
            return {
              left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
              top: $anchorDims.offset.top + $anchorDims.height + vOffset
            };
            break;
          case 'center left':
            return {
              left: $anchorDims.offset.left - ($eleDims.width + hOffset),
              top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
            };
            break;
          case 'center right':
            return {
              left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
              top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
            };
            break;
          case 'center':
            return {
              left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
              top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
            };
            break;
          case 'reveal':
            return {
              left: ($eleDims.windowDims.width - $eleDims.width) / 2,
              top: $eleDims.windowDims.offset.top + vOffset
            };
          case 'reveal full':
            return {
              left: $eleDims.windowDims.offset.left,
              top: $eleDims.windowDims.offset.top
            };
            break;
          case 'left bottom':
            return {
              left: $anchorDims.offset.left - ($eleDims.width + hOffset),
              top: $anchorDims.offset.top + $anchorDims.height
            };
            break;
          case 'right bottom':
            return {
              left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
              top: $anchorDims.offset.top + $anchorDims.height
            };
            break;
          default:
            return {
              left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
              top: $anchorDims.offset.top + $anchorDims.height + vOffset
            };
        }
      }
    }(jQuery);
  }, {}], 6: [function (require, module, exports) {
    /*******************************************
     *                                         *
     * This util was created by Marius Olbertz *
     * Please thank Marius on GitHub /owlbertz *
     * or the web http://www.mariusolbertz.de/ *
     *                                         *
     ******************************************/

    'use strict';

    !function ($) {

      var keyCodes = {
        9: 'TAB',
        13: 'ENTER',
        27: 'ESCAPE',
        32: 'SPACE',
        37: 'ARROW_LEFT',
        38: 'ARROW_UP',
        39: 'ARROW_RIGHT',
        40: 'ARROW_DOWN'
      };

      var commands = {};

      var Keyboard = {
        keys: getKeyCodes(keyCodes),

        /**
         * Parses the (keyboard) event and returns a String that represents its key
         * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
         * @param {Event} event - the event generated by the event handler
         * @return String key - String that represents the key pressed
         */
        parseKey: function (event) {
          var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
          if (event.shiftKey) key = "SHIFT_" + key;
          if (event.ctrlKey) key = "CTRL_" + key;
          if (event.altKey) key = "ALT_" + key;
          return key;
        },


        /**
         * Handles the given (keyboard) event
         * @param {Event} event - the event generated by the event handler
         * @param {String} component - Foundation component's name, e.g. Slider or Reveal
         * @param {Objects} functions - collection of functions that are to be executed
         */
        handleKey: function (event, component, functions) {
          var commandList = commands[component],
              keyCode = this.parseKey(event),
              cmds,
              command,
              fn;

          if (!commandList) return console.warn('Component not defined!');

          if (typeof commandList.ltr === 'undefined') {
            // this component does not differentiate between ltr and rtl
            cmds = commandList; // use plain list
          } else {
            // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
            if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
          }
          command = cmds[keyCode];

          fn = functions[command];
          if (fn && typeof fn === 'function') {
            // execute function  if exists
            var returnValue = fn.apply();
            if (functions.handled || typeof functions.handled === 'function') {
              // execute function when event was handled
              functions.handled(returnValue);
            }
          } else {
            if (functions.unhandled || typeof functions.unhandled === 'function') {
              // execute function when event was not handled
              functions.unhandled();
            }
          }
        },


        /**
         * Finds all focusable elements within the given `$element`
         * @param {jQuery} $element - jQuery object to search within
         * @return {jQuery} $focusable - all focusable elements within `$element`
         */
        findFocusable: function ($element) {
          return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
            if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
              return false;
            } //only have visible elements and those that have a tabindex greater or equal 0
            return true;
          });
        },


        /**
         * Returns the component name name
         * @param {Object} component - Foundation component, e.g. Slider or Reveal
         * @return String componentName
         */

        register: function (componentName, cmds) {
          commands[componentName] = cmds;
        }
      };

      /*
       * Constants for easier comparing.
       * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
       */
      function getKeyCodes(kcs) {
        var k = {};
        for (var kc in kcs) {
          k[kcs[kc]] = kcs[kc];
        }return k;
      }

      Foundation.Keyboard = Keyboard;
    }(jQuery);
  }, {}], 7: [function (require, module, exports) {
    'use strict';

    !function ($) {

      // Default set of media queries
      var defaultQueries = {
        'default': 'only screen',
        landscape: 'only screen and (orientation: landscape)',
        portrait: 'only screen and (orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
      };

      var MediaQuery = {
        queries: [],

        current: '',

        /**
         * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
         * @function
         * @private
         */
        _init: function () {
          var self = this;
          var extractedStyles = $('.foundation-mq').css('font-family');
          var namedQueries;

          namedQueries = parseStyleToObject(extractedStyles);

          for (var key in namedQueries) {
            if (namedQueries.hasOwnProperty(key)) {
              self.queries.push({
                name: key,
                value: "only screen and (min-width: " + namedQueries[key] + ")"
              });
            }
          }

          this.current = this._getCurrentSize();

          this._watcher();
        },


        /**
         * Checks if the screen is at least as wide as a breakpoint.
         * @function
         * @param {String} size - Name of the breakpoint to check.
         * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
         */
        atLeast: function (size) {
          var query = this.get(size);

          if (query) {
            return window.matchMedia(query).matches;
          }

          return false;
        },


        /**
         * Gets the media query of a breakpoint.
         * @function
         * @param {String} size - Name of the breakpoint to get.
         * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
         */
        get: function (size) {
          for (var i in this.queries) {
            if (this.queries.hasOwnProperty(i)) {
              var query = this.queries[i];
              if (size === query.name) return query.value;
            }
          }

          return null;
        },


        /**
         * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
         * @function
         * @private
         * @returns {String} Name of the current breakpoint.
         */
        _getCurrentSize: function () {
          var matched;

          for (var i = 0; i < this.queries.length; i++) {
            var query = this.queries[i];

            if (window.matchMedia(query.value).matches) {
              matched = query;
            }
          }

          if (typeof matched === 'object') {
            return matched.name;
          } else {
            return matched;
          }
        },


        /**
         * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
         * @function
         * @private
         */
        _watcher: function () {
          var _this2 = this;

          $(window).on('resize.zf.mediaquery', function () {
            var newSize = _this2._getCurrentSize(),
                currentSize = _this2.current;

            if (newSize !== currentSize) {
              // Change the current media query
              _this2.current = newSize;

              // Broadcast the media query change on the window
              $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
            }
          });
        }
      };

      Foundation.MediaQuery = MediaQuery;

      // matchMedia() polyfill - Test a CSS media type/query in JS.
      // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
      window.matchMedia || (window.matchMedia = function () {
        'use strict';

        // For browsers that support matchMedium api such as IE 9 and webkit

        var styleMedia = window.styleMedia || window.media;

        // For those that don't support matchMedium
        if (!styleMedia) {
          var style = document.createElement('style'),
              script = document.getElementsByTagName('script')[0],
              info = null;

          style.type = 'text/css';
          style.id = 'matchmediajs-test';

          script.parentNode.insertBefore(style, script);

          // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
          info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

          styleMedia = {
            matchMedium: function (media) {
              var text = "@media " + media + "{ #matchmediajs-test { width: 1px; } }";

              // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
              if (style.styleSheet) {
                style.styleSheet.cssText = text;
              } else {
                style.textContent = text;
              }

              // Test if media query is true or false
              return info.width === '1px';
            }
          };
        }

        return function (media) {
          return {
            matches: styleMedia.matchMedium(media || 'all'),
            media: media || 'all'
          };
        };
      }());

      // Thank you: https://github.com/sindresorhus/query-string
      function parseStyleToObject(str) {
        var styleObject = {};

        if (typeof str !== 'string') {
          return styleObject;
        }

        str = str.trim().slice(1, -1); // browsers re-quote string style values

        if (!str) {
          return styleObject;
        }

        styleObject = str.split('&').reduce(function (ret, param) {
          var parts = param.replace(/\+/g, ' ').split('=');
          var key = parts[0];
          var val = parts[1];
          key = decodeURIComponent(key);

          // missing `=` should be `null`:
          // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
          val = val === undefined ? null : decodeURIComponent(val);

          if (!ret.hasOwnProperty(key)) {
            ret[key] = val;
          } else if (Array.isArray(ret[key])) {
            ret[key].push(val);
          } else {
            ret[key] = [ret[key], val];
          }
          return ret;
        }, {});

        return styleObject;
      }

      Foundation.MediaQuery = MediaQuery;
    }(jQuery);
  }, {}], 8: [function (require, module, exports) {
    'use strict';

    !function ($) {

      /**
       * Motion module.
       * @module foundation.motion
       */

      var initClasses = ['mui-enter', 'mui-leave'];
      var activeClasses = ['mui-enter-active', 'mui-leave-active'];

      var Motion = {
        animateIn: function (element, animation, cb) {
          animate(true, element, animation, cb);
        },

        animateOut: function (element, animation, cb) {
          animate(false, element, animation, cb);
        }
      };

      function Move(duration, elem, fn) {
        var anim,
            prog,
            start = null;
        // console.log('called');

        function move(ts) {
          if (!start) start = window.performance.now();
          // console.log(start, ts);
          prog = ts - start;
          fn.apply(elem);

          if (prog < duration) {
            anim = window.requestAnimationFrame(move, elem);
          } else {
            window.cancelAnimationFrame(anim);
            elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
          }
        }
        anim = window.requestAnimationFrame(move);
      }

      /**
       * Animates an element in or out using a CSS transition class.
       * @function
       * @private
       * @param {Boolean} isIn - Defines if the animation is in or out.
       * @param {Object} element - jQuery or HTML object to animate.
       * @param {String} animation - CSS class to use.
       * @param {Function} cb - Callback to run when animation is finished.
       */
      function animate(isIn, element, animation, cb) {
        element = $(element).eq(0);

        if (!element.length) return;

        var initClass = isIn ? initClasses[0] : initClasses[1];
        var activeClass = isIn ? activeClasses[0] : activeClasses[1];

        // Set up the animation
        reset();

        element.addClass(animation).css('transition', 'none');

        requestAnimationFrame(function () {
          element.addClass(initClass);
          if (isIn) element.show();
        });

        // Start the animation
        requestAnimationFrame(function () {
          element[0].offsetWidth;
          element.css('transition', '').addClass(activeClass);
        });

        // Clean up the animation when it finishes
        element.one(Foundation.transitionend(element), finish);

        // Hides the element (for out animations), resets the element, and runs a callback
        function finish() {
          if (!isIn) element.hide();
          reset();
          if (cb) cb.apply(element);
        }

        // Resets transitions and removes motion-specific classes
        function reset() {
          element[0].style.transitionDuration = 0;
          element.removeClass(initClass + " " + activeClass + " " + animation);
        }
      }

      Foundation.Move = Move;
      Foundation.Motion = Motion;
    }(jQuery);
  }, {}], 9: [function (require, module, exports) {
    'use strict';

    !function ($) {

      var Nest = {
        Feather: function (menu) {
          var type = arguments.length <= 1 || arguments[1] === undefined ? 'zf' : arguments[1];

          menu.attr('role', 'menubar');

          var items = menu.find('li').attr({ 'role': 'menuitem' }),
              subMenuClass = "is-" + type + "-submenu",
              subItemClass = subMenuClass + "-item",
              hasSubClass = "is-" + type + "-submenu-parent";

          menu.find('a:first').attr('tabindex', 0);

          items.each(function () {
            var $item = $(this),
                $sub = $item.children('ul');

            if ($sub.length) {
              $item.addClass(hasSubClass).attr({
                'aria-haspopup': true,
                'aria-expanded': false,
                'aria-label': $item.children('a:first').text()
              });

              $sub.addClass("submenu " + subMenuClass).attr({
                'data-submenu': '',
                'aria-hidden': true,
                'role': 'menu'
              });
            }

            if ($item.parent('[data-submenu]').length) {
              $item.addClass("is-submenu-item " + subItemClass);
            }
          });

          return;
        },
        Burn: function (menu, type) {
          var items = menu.find('li').removeAttr('tabindex'),
              subMenuClass = "is-" + type + "-submenu",
              subItemClass = subMenuClass + "-item",
              hasSubClass = "is-" + type + "-submenu-parent";

          menu.find('*').removeClass(subMenuClass + " " + subItemClass + " " + hasSubClass + " is-submenu-item submenu is-active").removeAttr('data-submenu').css('display', '');

          // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
          //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
          //           .removeAttr('data-submenu'));
          // items.each(function(){
          //   var $item = $(this),
          //       $sub = $item.children('ul');
          //   if($item.parent('[data-submenu]').length){
          //     $item.removeClass('is-submenu-item ' + subItemClass);
          //   }
          //   if($sub.length){
          //     $item.removeClass('has-submenu');
          //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
          //   }
          // });
        }
      };

      Foundation.Nest = Nest;
    }(jQuery);
  }, {}], 10: [function (require, module, exports) {
    window.whatInput = function () {

      'use strict';

      /*
        ---------------
        variables
        ---------------
      */

      // array of actively pressed keys

      var activeKeys = [];

      // cache document.body
      var body;

      // boolean: true if touch buffer timer is running
      var buffer = false;

      // the last used input type
      var currentInput = null;

      // form input types
      var formInputs = ['button', 'input', 'select', 'textarea'];

      // detect version of mouse wheel event to use
      // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
      var mouseWheel = detectWheel();

      // list of modifier keys commonly used with the mouse and
      // can be safely ignored to prevent false keyboard detection
      var ignoreMap = [16, // shift
      17, // control
      18, // alt
      91, // Windows key / left Apple cmd
      93 // Windows menu / right Apple cmd
      ];

      // mapping of events to input types
      var inputMap = {
        'keydown': 'keyboard',
        'keyup': 'keyboard',
        'mousedown': 'mouse',
        'mousemove': 'mouse',
        'MSPointerDown': 'pointer',
        'MSPointerMove': 'pointer',
        'pointerdown': 'pointer',
        'pointermove': 'pointer',
        'touchstart': 'touch'
      };

      // add correct mouse wheel event mapping to `inputMap`
      inputMap[detectWheel()] = 'mouse';

      // array of all used input types
      var inputTypes = [];

      // mapping of key codes to a common name
      var keyMap = {
        9: 'tab',
        13: 'enter',
        16: 'shift',
        27: 'esc',
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
      };

      // map of IE 10 pointer events
      var pointerMap = {
        2: 'touch',
        3: 'touch', // treat pen like touch
        4: 'mouse'
      };

      // touch buffer timer
      var timer;

      /*
        ---------------
        functions
        ---------------
      */

      // allows events that are also triggered to be filtered out for `touchstart`
      function eventBuffer(event) {
        clearTimer();
        setInput(event);

        buffer = true;
        timer = window.setTimeout(function () {
          buffer = false;
        }, 650);
      }

      function bufferedEvent(event) {
        if (!buffer) setInput(event);
      }

      function unBufferedEvent(event) {
        clearTimer();
        setInput(event);
      }

      function clearTimer() {
        window.clearTimeout(timer);
      }

      function setInput(event) {
        var eventKey = key(event);
        var value = inputMap[event.type];
        if (value === 'pointer') value = pointerType(event);

        // don't do anything if the value matches the input type already set
        if (currentInput !== value) {
          var activeElement = document.activeElement.nodeName.toLowerCase();

          if (
          // only if the user flag to allow input switching
          // while interacting with form fields isn't set
          !body.hasAttribute('data-whatinput-formswitching') &&

          // support for legacy keyword
          !body.hasAttribute('data-whatinput-formtyping') &&

          // only if currentInput has a value
          currentInput && formInputs.indexOf(activeElement) > -1 ||
          // ignore modifier keys
          ignoreMap.indexOf(eventKey) > -1) {
            // ignore keyboard typing and do nothing
          } else {
            switchInput(value);
          }
        }

        if (value === 'keyboard') logKeys(eventKey);
      }

      function switchInput(string) {
        currentInput = string;
        body.setAttribute('data-whatinput', currentInput);

        if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
      }

      function key(event) {
        return event.keyCode ? event.keyCode : event.which;
      }

      function target(event) {
        return event.target || event.srcElement;
      }

      function pointerType(event) {
        if (typeof event.pointerType === 'number') {
          return pointerMap[event.pointerType];
        } else {
          return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
        }
      }

      // keyboard logging
      function logKeys(eventKey) {
        if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
      }

      function unLogKeys(event) {
        var eventKey = key(event);
        var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

        if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
      }

      function bindEvents() {
        body = document.body;

        // pointer events (mouse, pen, touch)
        if (window.PointerEvent) {
          body.addEventListener('pointerdown', bufferedEvent);
          body.addEventListener('pointermove', bufferedEvent);
        } else if (window.MSPointerEvent) {
          body.addEventListener('MSPointerDown', bufferedEvent);
          body.addEventListener('MSPointerMove', bufferedEvent);
        } else {

          // mouse events
          body.addEventListener('mousedown', bufferedEvent);
          body.addEventListener('mousemove', bufferedEvent);

          // touch events
          if ('ontouchstart' in window) {
            body.addEventListener('touchstart', eventBuffer);
          }
        }

        // mouse wheel
        body.addEventListener(mouseWheel, bufferedEvent);

        // keyboard events
        body.addEventListener('keydown', eventBuffer);
        body.addEventListener('keyup', eventBuffer);
        document.addEventListener('keyup', unLogKeys);
      }

      /*
        ---------------
        utilities
        ---------------
      */

      // detect version of mouse wheel event to use
      // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
      function detectWheel() {
        return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

        document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
        'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
      }

      /*
        ---------------
        init
         don't start script unless browser cuts the mustard,
        also passes if polyfills are used
        ---------------
      */

      if ('addEventListener' in window && Array.prototype.indexOf) {

        // if the dom is already ready already (script was placed at bottom of <body>)
        if (document.body) {
          bindEvents();

          // otherwise wait for the dom to load (script was placed in the <head>)
        } else {
          document.addEventListener('DOMContentLoaded', bindEvents);
        }
      }

      /*
        ---------------
        api
        ---------------
      */

      return {

        // returns string: the current input type
        ask: function () {
          return currentInput;
        },

        // returns array: currently pressed keys
        keys: function () {
          return activeKeys;
        },

        // returns array: all the detected input types
        types: function () {
          return inputTypes;
        },

        // accepts string: manually set the input type
        set: switchInput
      };
    }();
  }, {}], 11: [function (require, module, exports) {
    /**
     * File skip-link-focus-fix.js.
     *
     * Helps with accessibility for keyboard only users.
     *
     * Learn more: https://git.io/vWdr2
     */
    (function () {
      var isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1,
          isOpera = navigator.userAgent.toLowerCase().indexOf('opera') > -1,
          isIe = navigator.userAgent.toLowerCase().indexOf('msie') > -1;

      if ((isWebkit || isOpera || isIe) && document.getElementById && window.addEventListener) {
        window.addEventListener('hashchange', function () {
          var id = location.hash.substring(1),
              element;

          if (!/^[A-z0-9_-]+$/.test(id)) {
            return;
          }

          element = document.getElementById(id);

          if (element) {
            if (!/^(?:a|select|input|button|textarea)$/i.test(element.tagName)) {
              element.tabIndex = -1;
            }

            element.focus();
          }
        }, false);
      }
    })();
  }, {}], 12: [function (require, module, exports) {
    var fastclick = require('fastclick/lib/fastclick');
    var whatInput = require('what-input/what-input.js');
    var foundation = require('foundation-sites/js/foundation.core');
    var foundationUtilMediaQuery = require('foundation-sites/js/foundation.util.mediaQuery');
    var foundationUtilKeyboard = require('foundation-sites/js/foundation.util.keyboard');
    var foundationUtilBox = require('foundation-sites/js/foundation.util.box');
    var foundationUtilMotion = require('foundation-sites/js/foundation.util.motion');
    var foundationUtilNest = require('foundation-sites/js/foundation.util.nest');
    var foundationDropdownMenu = require('foundation-sites/js/foundation.dropdownMenu');
    var foundationAccordionMenu = require('foundation-sites/js/foundation.accordionMenu');
    var skipLinkFocusFix = require('./components/skip-link-focus-fix');

    (function ($) {
      'use strict';

      $(document).foundation();
    })(jQuery);
  }, { "./components/skip-link-focus-fix": 11, "fastclick/lib/fastclick": 1, "foundation-sites/js/foundation.accordionMenu": 2, "foundation-sites/js/foundation.core": 3, "foundation-sites/js/foundation.dropdownMenu": 4, "foundation-sites/js/foundation.util.box": 5, "foundation-sites/js/foundation.util.keyboard": 6, "foundation-sites/js/foundation.util.mediaQuery": 7, "foundation-sites/js/foundation.util.motion": 8, "foundation-sites/js/foundation.util.nest": 9, "what-input/what-input.js": 10 }] }, {}, [12]);