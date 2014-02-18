/**
    Router
    inspired by TJ Holowaychuk's page.js
    https://github.com/visionmedia/page.js
 */
/*jshint bitwise: false */
define(function (require, exports, module) {
    'use strict';

    var _ = require('./lang'),
        slice = Array.prototype.slice,
        decode = window.decodeURIComponent;

    /**
        @example
        normalize('path/to/page#hash'); // -> /path/to/page
     */
    function normalize(path) {
        path = path.replace(/^#!?/, '').replace(/#.*/, '');
        path = (path.length > 0 && path[0] !== '/') ? '/' + path : path;
        return path;
    }

    /**
        Parse search string to params object
        @param {String} search
        @returns {Object} params
     */
    function parseSearch(search) {
        var query = search[0] === '?' ? search.slice(1) : search,
            // Fragment shouldn't contain `&`, use `!!` instead
            // http://tools.ietf.org/html/rfc3986
            // @example #!/wallpaper?super=beauty!!sub=nude
            pairs = query.length > 0 ? query.split('!!') : [],
            params = {};

        _.each(pairs, function (pair) {
            pair = pair.replace(/\+/g, '%20');

            var i = pair.indexOf('='),
                key = ~i ? pair.slice(0, i) : pair,
                value = ~i ? pair.slice(i + 1) : '';

            try {
                key = decode(key);
                value = decode(value);
            } catch (e) {}

            params[key] = value;
        });

        return params;
    }

    function parse(hash) {
        hash = /#/.test(hash) ? hash.replace(/.*#!?\/?/, '') : '';
        if (!hash)
            return [{}];
        hash = hash.split('/');
        var kv, params = {},
            o = hash.pop(),
            paramsRule = /\?.*/,
            kvRule = /([^&=\?]+)(=[^&=]*)/g;
        if (o) {
            var end = o.replace(paramsRule, '');
            if (/\=/.test(o)) {
                if (end && paramsRule.test(o)) {
                    hash.push(end);
                }
                while (kv = kvRule.exec(o)) {
                    params[kv[1]] = kv[2].substr(1);
                }
            } else {
                hash.push(end);
            }
            hash.unshift(params);
        }
        return hash;
    }

    function Context(path, state) {
        var hashbang = location.hash.length === 0 ||
            /^#!/.test(location.hash);

        path = this.path = normalize(path);
        this.state = state || {};
        this.target = path ? '#' + (hashbang ? '!' : '') + path : path;

        var i = path.indexOf('?');
        this.pathname = ~i ? path.slice(0, i) : path;
        this.search = ~i ? path.slice(i) : '';
        this.queries = parseSearch(this.search);
        this.params = {};
        this.dispatch = true;
    }

    /**
        @example
        router('*', handler);
        router('/user/:id', load, user);
        router('/user/' + user.id, {some: 'thing'});
        router('/user/' + user.id);
        router(options);
     */
    function router(path, state) {
        if (_.type(state) === 'function') {
            router.bind.apply(router, arguments);
        } else if (_.type(path) === 'string') {
            router.route(path, state);
        } else {
            router.start(path);
        }
    }

    router.running = false;    // router 工作状态
    router.dispatching = null; // 当前正在进行的 dispatch 任务指针
    router.context = null;     // 当前的上下文对象缓存
    router.contexts = [];      // context 堆栈
    router.handlers = [];      // 全部 middleware

    function onhashchange() {
        var ctx = router.contexts.pop();
        if (!ctx) {
            ctx = new Context(location.hash);
        }
        router.context = ctx;

        if (ctx.dispatch === false) {
            return;
        }
        router.dispatch(ctx);
    }

    router.start = function () {
        if (this.running) {
            return;
        }
        this.running = true;
        window.addEventListener('hashchange', onhashchange, false);
        onhashchange();
    };

    router.stop = function () {
        this.running = false;
        window.removeEventListener('hashchange', onhashchange, false);
    };

    router.bind = function (pattern /*, handler1, handler2, ... */) {
        var handlers = slice.call(arguments, 1);
        _.each(handlers, function (handler) {
            this.handlers.push(this.middleware(pattern, handler));
        }, this);
    };

    router.unbind = function (pattern /*, handler1, handler2, ... */) {
        var handlers = slice.call(arguments, 1);
        _.each(handlers, function (handler) {
            var middlewares = this.handlers,
                dispatching = this.dispatching,
                i = 0,
                l = middlewares.length;
            for (; i < l; i++) {
                // 使用 pattern 和 handler 可以唯一确定一个 middleware
                if (middlewares[i]._pattern === pattern &&
                    middlewares[i]._handler === handler) {
                    middlewares.splice(i, 1);
                    // 调整删除 handler 后 router.dispatch 中的指针位置
                    if (dispatching && dispatching.index - 1 <= i) {
                        dispatching.index = dispatching.index - 1;
                    }
                    i = i - 1;
                    l = l - 1;
                }
            }
        }, this);
    };

    router.reset = function () {
        this.dispatching = null;
        this.contexts.length = 0;
        this.handlers.length = 0;
    };

    router.route = function (path, state, dispatch) {
        if (_.type(state) === 'boolean') {
            dispatch = state;
            state = null;
        }
        var ctx = new Context(path, state);
        ctx.dispatch = dispatch;
        if (router.context.target !== ctx.target) {
            this.contexts.push(ctx);
            location.href = ctx.target;
        }
        return ctx;
    };

    router.replace = function (path, state, dispatch) {
        if (_.type(state) === 'boolean') {
            dispatch = state;
            state = null;
        }
        var ctx = new Context(path, state);
        ctx.dispatch = dispatch;
        if (router.context.target !== ctx.target) {
            this.contexts.push(ctx);
            location.replace(ctx.target);
        }
        return ctx;
    };

    router.middleware = function (pattern, handler) {
        var that = this;
        function middleware(ctx, next) {
            if (that.match(pattern, ctx.pathname, ctx.params)) {
                handler(ctx, next);
            } else {
                next();
            }
        }
        // for unbind
        middleware._pattern = pattern,
        middleware._handler = handler;
        return middleware;
    };

    router.match = function (pattern, pathname, params) {
        var keys = [];
        pattern = pattern.replace(/:(\w+)/g, function (_, key) {
            keys.push(key);
            return '([^\/]+)';
        }).replace(/\*/g, '(.*)') || '';
        pattern = '^' + pattern + '$';

        var match = pathname.match(new RegExp(pattern));
        if (!match) {
            return false;
        }

        _.each(keys, function (key, i) {
            params[key] = decode(match[i + 1]);
        });
        return true;
    };

    router.dispatch = function (ctx) {
        var handlers = this.handlers;

        // dispatch 指针
        function next() {
            var middleware = handlers[next.index++];
            if (middleware) {
                middleware(ctx, next);
            }
        }

        // 检查正在 dispatch 的任务
        // 若上一次 dispatch 未完成，则强制停止
        if (this.dispatching) {
            this.dispatching.index = handlers.length;
        }

        // 保存当前的 dispatch 指针
        this.dispatching = next;
        next.index = 0;
        next();
    };

    // todo: 完善back功能
    router.back = function () {
        history.back();
    };

    router._normalize = normalize;
    router._parseSearch = parseSearch;
    router._Context = Context;
    router.parse = parse;
    module.exports = router;
});