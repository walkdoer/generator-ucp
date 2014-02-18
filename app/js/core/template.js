/**
 * Template Module
 * original author: Dexter.Yy
 * https://github.com/dexteryy/OzJS/blob/master/mod/template.js
 * modified by Hinc
 */
/*jshint evil: true */
define(function (require, exports) {
    'use strict';

    var _ = require('./lang'),
        tplMethods;

    exports.escapeHTML = function (str) {
        var xmlchar = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\'': '&#39;',
            '"': '&quot;',
            '{': '&#123;',
            '}': '&#125;',
            '@': '&#64;'
        };
        str = str || '';

        return str.replace(/[&<>'"\{\}@]/g, function($1){
            return xmlchar[$1];
        });
    };

    /**
     * @public 按字节长度截取字符串
     * @param {string} str是包含中英文的字符串
     * @param {int} limit是长度限制（按英文字符的长度计算）
     * @param {function} cb返回的字符串会被方法返回
     * @return {string} 返回截取后的字符串,默认末尾带有"..."
     */
    exports.substr = function (str, limit, cb) {
        var sub;
        if(!str || typeof str !== 'string') {
            return '';
        }

        sub = str.substr(0, limit).replace(/([^\x00-\xff])/g, '$1 ')
            .substr(0, limit).replace(/([^\x00-\xff])\s/g, '$1');

        return cb ? cb.call(sub, sub) : (str.length > sub.length ? sub + '...' : sub);
    };

    exports.trueSize = function (str) {
        return str.replace(/([^\x00-\xff]|[A-Z])/g, '$1 ').length;
    };

    exports.str2html = function (str) {
        var temp = document.createElement('div'),
            child, fragment;
        temp.innerHTML = str;
        child = temp.firstChild;
        if (temp.childNodes.length === 1) {
            return child;
        }

        fragment = document.createDocumentFragment();
        do {
            fragment.appendChild(child);
            child = temp.firstChild;
        } while (child);
        return fragment;
    };

    // From Underscore.js
    // JavaScript micro-templating, similar to John Resig's implementation.
    exports.tplSettings = {
        cache: {},
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g
    };

    tplMethods = {
        escapeHTML: exports.escapeHTML,
        substr: exports.substr,
        include: tmpl
    };

    function tmpl(str, data, helper) {
        var settings = exports.tplSettings,
            tplContent, func,
            result = '';
        helper = _.extend({}, tplMethods, helper);
        if (!/[<>\t\r\n ]/.test(str)) {
            func = settings.cache[str];
            if (!func) {
                tplContent = document.getElementById(str);
                if (tplContent) {
                    func = settings.cache[str] = tmpl(tplContent.innerHTML);
                }
            }
        } else {
            func = new Function('data', 'helper', 'var __tpl="";__tpl+="' +
                str.replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(settings.interpolate, function(match, code) {
                        return '"+' + code.replace(/\\"/g, '"') + '+"';
                    })
                    .replace(settings.evaluate || null, function(match, code) {
                        return '";' + code.replace(/\\"/g, '"')
                            .replace(/[\r\n\t]/g, ' ') + '__tpl+="';
                    })
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t') +
                '";return __tpl;');
        }
        if (func) {
            if (arguments.length > 1) {
                result = func(data, helper);
            } else {
                result = func;
            }
        }
        return result;
    }

    exports.tmpl = tmpl;
    exports.reload = function(str){
        delete exports.tplSettings.cache[str];
    };
});