/**
 * Watch Module
 *
 * Adapted from grunt's watch task
 * https://github.com/cowboy/grunt/blob/master/tasks/watch.js
 */
'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('./lang'),
    util = require('./util'),
    existsSync = fs.existsSync || path.existsSync,
    slice = Array.prototype.slice,
    keys = Object.keys;

function Watcher() {
    var that = this;
    this.init(arguments);
    this.mtimes = {};
    this.watched = {};
    this.changed = {};
    this.getFiles().forEach(this.watch, this);
    this.intervalId = setInterval(function () {
        var watched = keys(that.watched).map(function (value) {
                if (!existsSync(value)) {
                    that.unwatch(value);
                }
                return fs.realpathSync(value);
            }),
            added = _.difference(that.getFiles(), watched);

        added.forEach(function (filepath) {
            this.change('add', filepath);
        }, that);
    }, 200);
}

Watcher.prototype = {
    constructor: Watcher,
    init: function (args) {
        var arg;
        args = slice.call(args);
        while (args.length) {
            arg = args.shift();
            switch (typeof arg) {
            case 'string':
                this.path = [arg];
                break;
            case 'function':
                this.handler = arg;
                break;
            default:
                if (Array.isArray(arg)) {
                    this.path = arg;
                }
            }
        }
    },
    getFiles: function (input) {
        var files = [];
        input = input || this.path;

        input.forEach(function (filepath) {
            files = files.concat(util.expandPath(filepath));
        });

        return files;
    },
    watch: function (filepath) {
        var that = this,
            mtimes = this.mtimes,
            watched = this.watched,
            changed = this.changed;

        if (watched[filepath]) {
            return;
        }

        watched[filepath] = fs.watch(filepath, function (e) {
            var mtime,
                deleted = !existsSync(filepath);

            // node will fire 'rename' when file is edited with vim
            // rewatch the file and change event to 'change'
            if (e === 'rename' && !deleted) {
                that.unwatch(filepath);
                that.watch(filepath);
                e = 'change';
            }

            if (deleted) {
                that.unwatch(filepath);
                delete mtimes[filepath];
            } else {
                mtime = +fs.statSync(filepath).mtime;
                if (mtime === mtimes[filepath]) {
                    return;
                }
                mtimes[filepath] = mtime;
            }
            
            that.change(deleted ? 'delete' : e, filepath);
        });

        if (!changed[filepath]) {
            this.change('init', filepath);
        }
    },
    unwatch: function (filepath) {
        var watched = this.watched;

        if (watched[filepath]) {
            watched[filepath].close();
            delete watched[filepath];
        }
    },
    change: function (status, filepath) {
        var changed = this.changed;

        if (changed[filepath] === 'delete' && status === 'add') {
            status = 'change';
        }
        changed[filepath] = status;
        if (typeof this.handler === 'function') {
            this.handler.call(this, changed, this.done.bind(this));
        }
    },
    done: function () {
        var changed = this.changed;
        keys(changed).forEach(function (filepath) {
            switch (changed[filepath]) {
            case 'add':
                this.watch(filepath);
                break;
            case 'delete':
                this.unwatch(filepath);
                break;
            }
        }, this);
        this.changed = {};
    },
    stop: function () {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

module.exports = Watcher;