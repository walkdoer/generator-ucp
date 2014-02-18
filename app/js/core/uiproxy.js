/**
 * UIProxy Module
 * create by nino
 */
 /*jshint loopfunc: true */
define(function (require, exports, module) {
    'use strict';

    var _ = require('./lang'),
        TAP = 'tap',
        isMobile = navigator.userAgent.match(/(android|ipad;|ipod;|iphone;|iphone os|windows phone)/i);

    function isString(obj) {
        return _.type(obj) === 'string';
    }

    function isObject(obj) {
        return _.type(obj) === 'object';
    }

    function isArray(obj) {
        return _.type(obj) === 'array';
    }

    function isFunction(obj) {
        return _.type(obj) === 'function';
    }

    function isDef(obj) {
        return _.type(obj) !== 'undefined';
    }

    function isUndef(obj) {
        return _.type(obj) === 'undefined';
    }

    function Map() {
        this.init.apply(this, arguments);
    }

    Map.prototype = {
        init: function() {
            this.reset();
            this.set.apply(this, arguments);
        },
        get: function(key, init) {
            if (!this.has(key) && init) {
                this.map[key] = isFunction(init) ? init.call() : init;
            }
            return this.map[key];
        },
        has: function(key) {
            return isDef(this.map[key]);
        },
        add: function(key, value) {
            if (!this.has(key)) {
                this.set(key, value);
            }
        },
        set: function(key, value) {
            if (typeof key !== 'undefined') {
                this.map[key] = value;
            }
        },
        remove: function(key) {
            delete this.map[key];
        },
        keys: function() {
            return Object.keys(this.map);
        },
        size: function() {
            return this.keys().length;
        },
        each: function(fn, context) {
            if (fn) {
                _.each(this.map, function(value, key) {
                    fn.call(this, value, key);
                }, context || this);
            }
        },
        reset: function() {
            this.map = {};
        }
    };

    function newMap() {
        return new Map();
    }

    /**
     * 默认配置
     */
    var defaults = {
        type: TAP,

        preventDefault: false,
        stopPropagation: false,
        stopImmediatePropagation: false,

        tap: true,
        tapMaxDistance: 10 // pixels
    };

    /**
     * UIProxy
     */
    function UIProxy() {
        this.init.apply(this, arguments);
    }

    /**
     * 事件类型
     */
    UIProxy.prototype.types = [TAP];

    /**
     * 事件监听配置
     * 数据结构
     * eventMap: {
     *      proxy: {
     *          type: {
     *              selector: [
     *                  {fn, context, args},
     *                  {fn, context}
     *              ]
     *          }
     *     }
     * }
     */
    UIProxy.prototype.eventMap = null;

    /**
     * 代理类配置
     * 数据结构
     * proxyMap: {
     *      proxy: {
     *          startFn, moveFn, endFn
     *      }
     * }
     */
    UIProxy.prototype.proxyMap = null;

    /**
     * 取消事件默认方法或者冒泡
     */
    UIProxy.prototype.cancelEvent = function (event, force) {
        var defaults = this.defaults;
        if (defaults.preventDefault === true ||
            force === true) {
            event.preventDefault();
        }
        if (defaults.stopPropagation === true ||
            force === true) {
            event.stopPropagation();
        }
        if (defaults.stopImmediatePropagation === true ||
            force === true) {
            event.stopImmediatePropagation();
        }
    };

    UIProxy.prototype.preventDefault = function () {
        return function() {
            // 无效方法
            this.isDefaultPrevented = true;
        };
    };

    UIProxy.prototype.stopPropagation = function () {
        return function() {
            this.isPropagationStopped = true;
        };
    };

    UIProxy.prototype.stopImmediatePropagation = function () {
        return function() {
            this.isImmediatePropagationStopped = true;
        };
    };

    /**
     * 简单的元素选择器
     */
    UIProxy.prototype.$ = function (selector) {
        var matches = this.selectorExec(selector);

        // 处理 document
        if (matches[2] === 'document') {
            return [document];

        // 处理 body
        } else if (matches[2] === 'body') {
            return [document.body];

        // 处理 class
        } else if (matches[1] === '.') {
            return document.getElementsByClassName(matches[2]);

        // 处理 id
        } else if (matches[1] === '#') {
            var el = document.getElementById(matches[2]);
            return el ? [el] : [];

        // 处理 tagName
        } else if (matches[1] === selector) {
            return document.getElementsByTagName(matches[2]);
        }
    };

    /**
     * 初始化
     */
    UIProxy.prototype.init = function(options) {
        this.defaults = _.extend({}, defaults, options);
        this.reset();
    };

    /**
     * 重置所有环境
     */
    UIProxy.prototype.reset = function (resetDefaults) {
        if (this.proxyMap) {
            this.proxyMap.each(function(context, selector) {
                this.removeEvent(selector);
            }, this);
        }
        if (resetDefaults === true) {
            this.defaults = _.extend({}, this.originDefaults);
        }
        this.proxyMap = new Map();
        this.eventMap = new Map();
        return this;
    };

    /**
     * 配置默认选项
     */
    UIProxy.prototype.config = function (key, value) {
        if (isObject(key)) {
            _.each(key, function(v, k) {
                this.defaults[k] = v;
            }, this);
        } else if (isDef(value)) {
            this.defaults[key] = value;
        }
        return this;
    };

    /**
     * 解析 item
     */
    UIProxy.prototype.parseItem = function (item) {
        if (!item) {
            return;
        }
        var fn, context, args;
        if (isFunction(item)) {
            fn = item;
        } else if (isArray(item)) {
            fn = item[0];
            if (isArray(item[1])) {
                args = item[1];
            } else if (isObject(item[1])) {
                context = item[1];
            }
            if (isArray(item[2])) {
                args = item[2];
            }
        }
        return {fn: fn, context: context, args: args, options: {}};
    };

    /**
     * 委托响应函数
     *  on(selectors, item)
     *  on(selectors, proxy, item)
     * item 格式允许如下形式
     *  [fn, context]
     *  [fn, args]
     *  [fn, context, args]
     */
    UIProxy.prototype.on = function (selectors, proxy, item, options) {
        if (isObject(selectors)) {
            _.each(selectors, function(item, selector) {
                this.on(selector, proxy, item, options);
            }, this);
        } else if (isString(selectors)) {
            this.eachSelector(selectors, function(type, selector) {
                this.bindEvent(type, selector, proxy, item, options);
            }, this);
        }
        return this;
    };

    /**
     * 移除委托的响应函数
     *
     * 解绑元素委托在某个上级的指定响应函数
     *  off(selector, item)
     *  off(selector, proxy, item)
     *
     * 批量解绑元素委托在某个上级的指定响应函数
     *  off(selectors)
     *  off(selectors, proxy)
     *
     * 解绑元素委托在某个上级的所有响应函数
     *  off(selector)
     *  off(selector, proxy)
     *
     * 解绑元素委托在所有上级的所有响应函数
     *  off(selector, true)
     *
     * 解绑委托在指定元素上的所有响应函数
     *  off(true, selector)
     */
    UIProxy.prototype.off = function (selectors, proxy, item) {
        if (isObject(selectors)) {
            _.each(selectors, function(item, selector) {
                this.off(selector, proxy, item);
            }, this);
        } else if (isString(selectors)) {
            this.eachSelector(selectors, function(type, selector) {
                this.bindEvent(type, selector, proxy, item, true);
            }, this);
        } else if (selectors === true &&
            (isString(proxy) || isUndef(proxy))) {
            proxy = (proxy || 'document').trim();
            this.removeEvent(proxy);
        }
        return this;
    };

    /**
     * 绑定元素事件监听
     */
    UIProxy.prototype.addEvent = function (proxy) {
        if (!proxy) {
            return;
        }

        var that = this,
            bind,
            els = this.$(proxy),
            options = this.proxyMap.get(proxy);
        if (!els || options) {
            return;
        }

        bind = function(fn) {
            return function(event) {
                fn.call(that, event, options);
            };
        };

        options = {proxy: proxy, id: Math.random() * Math.random()};
        options.startFn = bind(this.onTouchStart());
        options.moveFn = bind(this.onTouchMove());
        options.endFn = bind(this.onTouchEnd());
        _.each(els, function(el) {
            if (el && el.addEventListener) {
                if (isMobile) {
                    el.addEventListener('touchstart', options.startFn);
                    el.addEventListener('touchmove', options.moveFn);
                    el.addEventListener('touchend', options.endFn);
                    el.addEventListener('touchcancel', options.endFn);
                } else {
                    el.addEventListener('mousedown', options.startFn);
                    el.addEventListener('mousemove', options.moveFn);
                    el.addEventListener('mouseup', options.endFn);
                }
            }
        });

        this.proxyMap.set(proxy, options);
    };

    /**
     * 解绑元素事件监听
     */
    UIProxy.prototype.removeEvent = function (proxy) {
        if (!proxy) {
            return;
        }

        var options = this.proxyMap.get(proxy);
        if (!options) {
            return;
        }

        var els = this.$(proxy);
        _.each(els, function(el) {
            if (el && el.removeEventListener) {
                el.removeEventListener('touchstart', options.startFn);
                el.removeEventListener('touchmove', options.moveFn);
                el.removeEventListener('touchend', options.endFn);
                el.removeEventListener('touchcancel', options.endFn);
                el.removeEventListener('mousedown', options.startFn);
                el.removeEventListener('mousemove', options.moveFn);
                el.removeEventListener('mouseup', options.endFn);
            }
        });

        this.proxyMap.remove(proxy);
    };

    /**
     * 更新元素事件监听
     * 如果没有监听就移除，如果还有加入监听则
     */
    UIProxy.prototype.updateEvent = function (proxy) {
        this.eventMap.each(function(typeMap, p) {
            if (!proxy || proxy === p) {
                var active = 0;
                typeMap.each(function(selectorMap) {
                    selectorMap.each(function(items) {
                        active += items.length;
                    });
                });
                if (active > 0) {
                    this.addEvent(p);
                } else {
                    this.removeEvent(p);
                }
            }
        }, this);
    };

    /**
     * 分解选择器并遍历
     */
    UIProxy.prototype.eachSelector = function (selectors, iterator) {
        var items, type, selector;
        selectors = selectors.split(',');
        _.each(selectors, function(item) {
            items = item.split(' ');
            if (items.length > 0 && this.types.indexOf(items[0]) > -1) {
                type = items.shift();
            } else {
                type = this.defaults.type;
            }
            selector = items.join(' ');
            iterator.call(this, type, selector);
        }, this);
    };

    /**
     * 拆分选择器
     */
    UIProxy.prototype.splitSelector = function (selectors) {
        var that = this, a, s;
        if (isArray(selectors)) {
            a = [];
            _.each(selectors, function(selector) {
                s = that.splitSelector(selector);
                a.push(s);
            });
        } else if (isString(selectors)) {
            if (!selectors) {
                return [];
            }
            a = selectors.replace(/\./g, '\x00.').replace(/#/g, '\x00#').split('\x00');
            if (a.length > 0 && a[0] === '') {
                a.shift();
            }
        }
        return a;
    };

    /**
     * 选择器分解
     */
    UIProxy.prototype.selectorExec = function (selector) {
        if (!selector) {
            return [];
        }

        // 处理 class 和 id
        var selectorExpr = /([\.#])(.*)/,
            matches = selectorExpr.exec(selector);

        // 处理 tagName
        if (!matches) {
            matches = [selector, null, selector];
        }
        return matches;
    };

    /**
     * 是否匹配选择器
     */
    UIProxy.prototype.isSelectorMatch = function (el, selector) {
        if (!el || !selector) {
            return false;
        }

        var array = this.splitSelector(selector),
            className, matches, isMatch;
        for(var i = 0; i < array.length; i++) {
            var part = array[i];
            matches = this.selectorExec(part);
            isMatch = false;

            // 处理 class
            if (matches[1] === '.') {
                className = el.className;
                if (className) {
                    _.each(className.split(' '), function(c) {
                        if (c === matches[2]) {
                            isMatch = true;
                        }
                    });
                }

            // 处理 id
            } else if (matches[1] === '#') {
                isMatch = el.id === matches[2];

            // 处理 tagName
            } else if (el && el.tagName) {
                isMatch = el.tagName.toLowerCase() === matches[2].toLowerCase();
            }
            if (!isMatch) {
                return isMatch;
            }
        }
        return true;
    };

    /**
     * 从源目标开始向上查找匹配事件监听的节点
     */
    UIProxy.prototype.walk = function (type, proxy, target, fn) {
        var typeMap = this.eventMap.get(proxy);
        if (!typeMap) {
            return;
        }

        var selectorMap = typeMap.get(type);
        if (!selectorMap) {
            return;
        }

        var el = target,
            targetMap = new Map(),
            levelMap = new Map(),
            level = 0,
            orders = [],
            origins = selectorMap.keys(),
            selectors = [];

        // 将 'div .a .b.c' 分解为 ['div', '.a', '.b.c']
        _.each(origins, function(selector) {
            selectors.push(selector.split(' '));
        });

        while (el) {
            _.each(selectors, function(selectorArray, index) {
                var length = selectorArray.length;
                if (length > 0) {
                    var selector = selectorArray[length - 1];
                    // 选择器是否匹配当前元素，匹配则取出
                    if (this.isSelectorMatch(el, selector)) {
                        if (!targetMap.has(index)) {
                            targetMap.set(index, el);
                            levelMap.set(index, level);
                            orders.push(index);
                        }
                        selectorArray.pop();
                    }
                }
            }, this);

            level++;

            if (el.parentNode && el.parentNode !== el) {
                el = el.parentNode;
            } else {
                break;
            }
        }

        var items;
        _.each(orders, function(index) {
            var selector;
            if (selectors[index].length === 0) {
                selector = origins[index];
                items = selectorMap.get(selector);
                level = levelMap.get(index);
                fn.call(this, items, target, targetMap.get(index, target), level);
            }
        });
    };

    /**
     * 绑定或解绑事件
     *  (type, selector[, proxy], item[, options])
     * 绑定对应的响应函数
     *  (type, selector, proxy, fn) // 指定代理元素
     *  (type, selector, fn) // 不指定代理元素
     * 解绑对应的响应函数
     *  (type, selector, item, true) // 解绑元素在 document 上的指定事件的响应函数
     *  (type, selector, proxy, item, true) // 解绑元素在指定父级元素上指定事件的响应函数
     * 解绑在指定父级元素所有响应函数
     *  (type, true, proxy, undefined, true)
     * 解绑在所有父级元素所有响应函数
     *  (type, selector, true, undefined, true)
     */
    UIProxy.prototype.bindEvent = function (type, selector, proxy, item, options) {
        if (!type || !isString(type) ||
            !selector || !isString(selector)) {
            return;
        }
        selector = selector.trim();

        // 处理不指定 proxy 的情况
        if (isFunction(proxy) || isObject(proxy) || isArray(proxy)) {
            item = proxy;
            proxy = 'document';

        // 处理 proxy 为字符串的情况
        } else if (isString(proxy) || isUndef(proxy)) {
            proxy = (proxy || 'document').trim();
        }

        // 解析 item
        if (item) {
            item = this.parseItem(item);
            _.extend(item.options, this.defaults);
            if (isObject(options)) {
                _.extend(item.options, options);
            }
        }
        var typeMap, selectorMap, content,
            remove = (options === true);

        // 移除响应的响应函数
        if (remove === true) {
            if ((proxy.toString() === 'true') &&
                (selector.toString() === 'true')) {
                this.reset();

            // 解绑在所有父级元素所有响应函数
            } else if (proxy.toString() === 'true') {
                this.eventMap.each(function(typeMap) {
                    selectorMap = typeMap.get(type);
                    if (selectorMap) {
                        selectorMap.remove(selector);
                    }
                });
                proxy = null;

            // 解绑在指定父级元素所有响应函数
            } else if (selector.toString() === 'true') {
                typeMap = this.eventMap.get(proxy);
                if (typeMap) {
                    typeMap.remove(type);
                }

            // 指定 type 和 proxy
            } else {
                typeMap = this.eventMap.get(proxy);
                if (!typeMap) {
                    return;
                }

                selectorMap = typeMap.get(type);
                if (!selectorMap) {
                    return;
                }

                if (item) {
                    content = selectorMap.get(selector);
                    if (!content) {
                        return;
                    }

                    var newContent = [];
                    _.each(content, function(c) {
                        if (c.fn !== item.fn) {
                            newContent.push(c);
                        }
                    });
                    content = newContent;
                    selectorMap.set(selector, newContent);
                } else {
                    selectorMap.remove(selector);
                }
            }
        // 如果有 item
        } else if (item) {
            typeMap = this.eventMap.get(proxy, newMap);
            selectorMap = typeMap.get(type, newMap);
            content = selectorMap.get(selector, []);
            content.push(item);
        }

        this.updateEvent(proxy);
    };

    /**
     * 向绑定事件监听的元素派发事件
     */
    UIProxy.prototype.trigger = function (type, options) {
        var proxy, event,
            typeMap, selectorMap,
            fireEvent = this.fireEvent;

        if (!options) {
            options = {};
        } else if (isArray(options)) {
            options = {args: options};
        } else if (isString(options)) {
            proxy = options;
            options = {proxy: proxy};
        } else if (isObject(options)) {
            proxy = options.proxy;
            event = options.event;
        }

        options.type = type;

        if (!proxy || !isString(proxy)) {
            proxy = 'document';
        }

        // 手动触发
        if (!event) {
            typeMap = this.eventMap.get(proxy);
            if (!typeMap) {
                return;
            }

            selectorMap = typeMap.get(type);
            if (!selectorMap) {
                return;
            }

            selectorMap.each(function(items) {
                fireEvent(items, options);
            });

        // 事件触发
        } else {
            var currentLevel = 0,
                clone = this.clone;
            this.walk(type, proxy, event.target, function(item, target, currentTarget, level) {
                if (!options.isImmediatePropagationStopped &&
                    (!options.isPropagationStopped ||
                        (options.isPropagationStopped && level <= currentLevel))) {
                    options.target = target;
                    options.currentTarget = currentTarget;
                    fireEvent(item, clone(options));
                    currentLevel = level;
                }
            });
        }
    };

    /**
     * 触发事件
     */
    UIProxy.prototype.fireEvent = function (items, options) {
        var fn, context, args, target, iterator;
        if (!options) {
            options = {};
        }
        iterator = function(item) {
            fn = item.fn;
            context = item.context || target;
            if (options.args) {
                args = options.args.slice();
            } else if (item.args) {
                args = item.args.slice();
            } else {
                args = [];
            }
            args.unshift(options);
            fn.apply(context, args);
        };
        if (isArray(items)) {
            var length = items.length;
            for (var i = 0; i < length; i++) {
                var item = items[i];
                iterator(item);
                if (options.isImmediatePropagationStopped) {
                    break;
                }
            }
        } else {
            iterator(items);
        }
    };

    /**
     * 响应触摸开始
     */
    UIProxy.prototype.onTouchStart = function () {
        return function(event, options) {
            this.cancelEvent(event);

            var start = this.extractTouches(event),
                fingers = start.length;

            // 重置手势
            this.resetGesture(options, {start: start, prev: start, current: start,
                fingers: fingers});

            options.event = event;
        };
    };

    /**
     * 响应触摸移动
     */
    UIProxy.prototype.onTouchMove = function () {
        return function(event, options) {
            this.cancelEvent(event);

            options.prev = options.current;
            options.current = this.extractTouches(event);
        };
    };

    /**
     * 响应触摸结束
     */
    UIProxy.prototype.onTouchEnd = function () {
        return function(event, options) {
            this.cancelEvent(event);

            var defaults = this.defaults,
                fingers = options.fingers;
            if (fingers === 1 && defaults.tap && !options.hold && this.isTap(options)) {
                this.tap(options);
            }
        };
    };

    /**
     * 重置手势
     */
    UIProxy.prototype.resetGesture = function (options, more) {
        if (!more) {
            more = {};
        }
        options.isDefaultPrevented = false;
        options.isImmediatePropagationStopped = false;
        options.isPropagationStopped = false;
        options.preventDefault = _.bind(this.preventDefault(), options);
        options.stopPropagation = _.bind(this.stopPropagation(), options);
        options.stopImmediatePropagation = _.bind(this.stopImmediatePropagation(), options);
        options.last = options.start || [];
        options.start = more.start || [];
        options.touches = options.start;
        options.prev = more.prev || [];
        options.current = more.current || [];
        options.fingers = more.fingers || 0;
    };

    /**
     * 合并属性
     */
    UIProxy.prototype.merge = function(options, more) {
        if (!more) {
            more = {};
        }
        return _.extend(options, more);
    };

    /**
     * 克隆
     */
    UIProxy.prototype.clone = function(origin) {
        return _.extend(true, {}, origin);
    };

    /**
     * tap
     */
    UIProxy.prototype.tap = function (options) {
        this.trigger(TAP, options);
    };

    /**
     * 判断是否是 tap
     */
    UIProxy.prototype.isTap = function (options) {
        var defaults = this.defaults,
            start = options.start,
            current = options.current,
            d = Math.abs(this.detectDistance(start, current)) < defaults.tapMaxDistance;
        return d;
    };

    /**
     * 提取 touch 信息
     */
    UIProxy.prototype.extractTouches = function (event) {
        var touches = event.touches,
            ts = [],
            el, id, x, y, t;
        if (touches) {
            for (var i = 0, len = touches.length; i < len; i++) {
                var touch = touches[i];
                el = touch.target;
                id = touch.identifier || Math.random() * 10000000;
                x = touch.pageX;
                y = touch.pageY;
                t = new Date();
                ts.push({el: el, id: id, x: x, y: y, t: t});
            }
        } else {
            ts.push({
                el: event.target,
                id: Math.random() * 10000000,
                x: event.clientX,
                y: event.clientY,
                t: new Date()
            });
        }
        return ts;
    };

    /**
     * 检测距离
     */
    UIProxy.prototype.detectDistance = function (start, end) {
        var t1, t2;
        if (!end) {
            t1 = start[0];
            t2 = start[1];
        } else if (start.length) {
            t1 = start[0];
            t2 = end[0];
        } else {
            t1 = start;
            t2 = end;
        }
        var dx = t2.x - t1.x,
            dy = t2.y - t1.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    module.exports = UIProxy;
});