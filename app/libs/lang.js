/**
 * Language Module
 *
 * Adapted from OzJS's lang module and underscore
 * https://github.com/dexteryy/OzJS/blob/master/mod/lang.js
 * https://github.com/documentcloud/underscore/blob/master/underscore.js 
 */
'use strict';

var objProto = Object.prototype,
    arrProto = Array.prototype,
    toString = objProto.toString,
    hasOwn = objProto.hasOwnProperty,
    slice = arrProto.slice,
    _ = {};

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

// 找出在 source 中而不在 rest 中的元素
_.difference = function difference(source, rest) {
    if (!Array.isArray(rest)) {
        return source;
    }
    return source.filter(function (value) {
        return rest.indexOf(value) === -1;
    });
};

module.exports = _;
