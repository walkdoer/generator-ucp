/**
    CMD Toolkit Module
    @module lib/cmd
 */
'use strict';

var path = require('path'),
    fs = require('fs'),
    ast = require('cmd-util').ast,
    uglify = require('uglify-js');

var BACKLASH_RE = /\\/g,
    JS_EXT_RE = /\.js$/,
    RELATIVE_RE = /^\.{1,2}\//,
    CODE_RE = /[,;]/;

/**
    Convert filepath to toplevel module id
    @param {String} file - filepath to convert
    @param {String} base - basepath of seajs
    @param {String} [rel] - relative path of file
    @returns {String} id
 */
function pathToId(file, base, rel) {
    var id = rel ? path.resolve(rel, '..', file) : file;
    id = path.relative(base, id);
    // replace \ with / in windows' path and remove extname in path
    id = id.replace(BACKLASH_RE, '/').replace(JS_EXT_RE, '');
    return id;
}

/**
    Convert toplevel module id to filepath
    @private
 */
function idToPath(id, config) {
    var alias = config.alias || {};
    return alias.hasOwnProperty(id) ?
        path.resolve(alias[id]) :
        path.resolve(config.base, id) + '.js';
}

/**
    Get dependencies of a *compiled* cmd module
    @param {String} file - filepath of a compiled cmd module
    @param {String} base - basepath of seajs
    @returns {Array} depends - the first module's depends list
 */
function getDepends(file, config) {
    var code = fs.readFileSync(file, 'utf8'),
        // only process the first module in file
        meta = ast.parse(code)[0],
        deps = ((meta || {}).dependencies || []).map(function (dep) {
            return idToPath(dep, config);
        });
    return deps;
}

/**
    Compress code and reserve cmd keywords
 */
function compress(code) {
    var toplevel = uglify.parse(code),
        compressor = uglify.Compressor();
    toplevel.figure_out_scope()

    var ast = toplevel.transform(compressor);
    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names({except: ['require']});

    var stream = uglify.OutputStream();
    ast.print(stream);
    return stream.toString();
}

/**
    Convert text to cmd module
 */
function text2cmd(text) {
    return 'define(function (require, exports, module) {\n' +
        '    module.exports=' + JSON.stringify(text) + ';\n' +
        '});';
}

exports.pathToId = pathToId;
exports.getDepends = getDepends;
exports.compress = compress;
exports.text2cmd = text2cmd;