/**
 * Language Module
 */
/*jshint curly: false, forin: false, noempty: false */
define(function (require, exports, module) {
    'use strict';

    var objProto = Object.prototype,
        arrProto = Array.prototype,
        toString = objProto.toString,
        hasOwn = objProto.hasOwnProperty,
        slice = arrProto.slice,
        _ = {};

    // 检测系统和浏览器
    var ua = navigator.userAgent,
        os = {},
        browser = {},
        webkit = ua.match(/WebKit\/([\d.]+)/),
        android = ua.match(/(Android)\s+([\d.]+)/),
        ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
        iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
        kindle = ua.match(/Kindle\/([\d.]+)/),
        silk = ua.match(/Silk\/([\d._]+)/),
        uc = ua.match(/UC/);

    browser.webkit = !!webkit;
    if (browser.webkit) { browser.version = webkit[1]; }
    if (android) { os.android = true; os.version = android[2]; }
    if (iphone) { os.ios = os.iphone = true; os.version = iphone[2].replace(/_/g, '.'); }
    if (ipad) { os.ios = os.ipad = true; os.version = ipad[2].replace(/_/g, '.'); }
    if (kindle) { os.kindle = true; os.version = kindle[1]; }
    if (silk) { browser.silk = true; browser.version = silk[1]; }
    if (!silk && os.android && ua.match(/Kindle Fire/)) { browser.silk = true; }
    if (uc) { browser.uc = true; }
    if (!android && !ipad && !iphone && !kindle && !silk && !uc) {
        browser.desktop = true;
    }
    _.os = os;
    _.browser = browser;

    // 返回对象的类型
    _.type = function (obj) {
        var type;
        if (obj == null) {
            type = String(obj);
        } else {
            type = toString.call(obj).toLowerCase();
            type = type.substring(8, type.length - 1);
        }
        return type;
    };

    // 遍历数组或对象，当迭代函数返回 false 时终止
    _.each = function (obj, iterator, context) {
        /*jshint curly: false */
        var i, l, type;
        if (typeof obj !== 'object') return;

        type = _.type(obj);
        context = context || obj;
        if (type === 'array' || type === 'arguments') {
            for (i=0, l=obj.length; i<l; i++) {
                if (iterator.call(context, obj[i], i, obj) === false) return;
            }
        } else {
            for (i in obj) {
                if (hasOwn.call(obj, i)) {
                    if (iterator.call(context, obj[i], i, obj) === false) return;
                }
            }
        }
    };

    // 将方法的 this 绑定为指定的对象
    _.bind = function (func, context) {
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(context, args.concat(slice.call(arguments)));
        };
    };

    // 来自 jQuery
    _.isPlainObject = function (obj) {
        var key;
        if (!obj || _.type(obj) !== 'object' ||
            obj.nodeType || 'setInterval' in obj) {
            return false;
        }

        if (obj.constructor &&
            !hasOwn.call(obj, 'constructor') &&
            !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
            return false;
        }

        for (key in obj) {}
        return key === undefined || hasOwn.call(obj, key);
    };

    // 扩展方法
    // 来自 jQuery
    // extend([deep,] target, obj1 [, objN])
    _.extend = function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== 'object' && _.type(target) !== 'function') {
            target = {};
        }

        // extend caller itself if only one argument is passed
        if (length === i) {
            target = this;
            --i;
        }

        for (; i<length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (_.isPlainObject(copy) || (copyIsArray = _.type(copy) === 'array'))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && _.type(src) === 'array' ? src : [];
                        } else {
                            clone = src && _.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = _.extend(deep, clone, copy);

                    // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    // shim for Array.prototype.indexOf from MDN
    _.indexOf = function (arr, element, fromIndex) {
        if (arr == null) {
            throw new TypeError();
        }
        var t = Object(arr),
            len = Number(t.length);

        if (len !== len || len === 0) {
            return -1;
        }

        var n = 0;
        if (arguments.length > 1) {
            n = Number(fromIndex);
            // if it's NaN
            if (n !== n) {
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === element) {
                    return k;
                }
            }
            return -1;
        }
    };

    module.exports = _;
});