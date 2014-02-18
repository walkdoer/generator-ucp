/**
 * Selector Module
 */
define(function (require, exports, module) {
    'use strict';

    var $ = require('zepto');

    // add fadeIn, fadeOut to Zepto
    var speeds = {
        normal: 400,
        fast: 200,
        slow: 600
    };

    function fadeTo(el, speed, opacity, callback) {
        if (typeof speed === 'function' && !callback) {
            callback = speed;
            speed = undefined;
        }
        speed = typeof speed === 'number' ? speed : (speeds[speed] || speeds.normal);
        return el.anim({opacity: opacity}, speed / 1000, null, callback);
    }

    $.fn.fadeIn = $.fn.fadeIn || function (speed, callback) {
        this.css({
            opacity: 0,
            display: 'inherit'
        });
        return fadeTo(this, speed, 1, callback);
    };

    $.fn.fadeOut = $.fn.fadeOut || function (speed, callback) {
        if (typeof speed === 'function' && !callback) {
            callback = speed;
            speed = undefined;
        }
        this.css('opacity', 1);
        return fadeTo(this, speed, 0, function () {
            $.fn.hide.call($(this));
            if (typeof callback === 'function') {
                callback.call(this);
            }
        });
    };

    module.exports = $;
});