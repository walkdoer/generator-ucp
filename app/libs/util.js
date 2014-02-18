/**
 * Utility Module
 *
 * A set of useful functions
 */
'use strict';

var fs = require('fs'),
    path = require('path'),
    globSync = require('glob-whatev'),
    _ = require('./lang'),
    slice = Array.prototype.slice,
    isArray = Array.isArray;

var IMPORT_RE = /@import\s+(\S+)/,
    CMT_END_RE = /\*\//,
    RELATIVE_RE = /^\.{1,2}\//;

/**
    Expand minimatch path to files' realpath
    @param {Array} input - a list of files' minimatch pattern
    @param {Funciton} [filter] - output's filter
    @returns {Array} output
 */
function expandPath() {
    var args = slice.call(arguments),
        arg, input, filter,
        output = [];
    while (arg = args.shift()) {
        switch (typeof arg) {
        case 'object':
            if (isArray(arg)) {
                input = arg;
            } else {
                input = isArray(arg.src) ? arg.src :
                    typeof arg.src === 'string' ? [arg.src] :
                    [];
                filter = arg.filter || null;
            }
            break;
        case 'string':
            input = [arg];
            break;
        case 'function':
            filter = arg;
            break;
        }
    }
    input = isArray(input) ? input : [];

    input.forEach(function (pattern) {
        globSync.glob(pattern).map(function (file) {
            var realpath = fs.realpathSync(file);
            if (output.indexOf(realpath) === -1) {
                output.push(realpath);
            }
        });
    });

    if (filter) {
        output = output.filter(filter);
    }
    return output;
}

/**
    Get dependencies of a css/js file
    @example
    /**
     @import ./lang.js
     ...
    @param {String} file - filepath
    @returns {Array} depends
 */
function getDepends(file) {
    var data = fs.readFileSync(file, 'utf8').split('\n'),
        i, l, line, match,
        deps = [], dep;

    for (i=0, l=data.length; i<l; i++) {
        line = data[i];
        if (IMPORT_RE.test(line)) {
            dep = RegExp.$1;
            dep = RELATIVE_RE.test(dep) ? dep : './' + dep;
            deps.push(path.resolve(path.dirname(file), dep));
        }
        if (CMT_END_RE.test(line)) {
            break;
        }
    }
    return deps;
}

/**
    Calculate and return an array of input's depends
    in depth-first order
    @param {Array} input - input files' realpath
    @param {Function} [depsHandler] - be used to get depends
    @returns {Array} files
 */
function calcDepends(input, depsHandler) {
    var args = slice.call(arguments, 1),
        arg,
        files, cache;

    while (arg = args.shift()) {
        switch (_.type(arg)) {
        case 'function':
            depsHandler = arg;
            break;
        case 'array':
            files = arg;
            break;
        case 'object':
            cache = arg;
            break;
        }
    }
    depsHandler = depsHandler || getDepends;
    files = files || [];
    cache = cache || {};

    var file, deps,
        i, l = input.length;

    for (i=0; i<l; i++) {
        file = input[i];
        if (files.indexOf(file) === -1) {
            if (!fs.existsSync(file)) {
                console.warn('Warning: File ' + file + ' doesn\'t exist.');
                continue;
            }
            deps = cache[file];
            if (!deps) {
                deps = cache[file] = depsHandler(file);
            }
            if (deps && deps.length > 0) {
                calcDepends(deps, depsHandler, files, cache);
            }
            files.push(file);
        }
    }

    files = files.filter(function (file) {
        return input.indexOf(file) !== -1;
    });
    return files;
}

function mkdirp(dirPath, mode) {
    var dir = path.resolve(dirPath),
        parrent = path.dirname(dir);
    if (!fs.existsSync(dir)) {
        if (!fs.existsSync(parrent)) {
            mkdirp(parrent);
        }
        fs.mkdirSync(dir, mode);
    }
}

exports.expandPath = expandPath;
exports.getDepends = getDepends;
exports.calcDepends = calcDepends;
exports.mkdirp = mkdirp;