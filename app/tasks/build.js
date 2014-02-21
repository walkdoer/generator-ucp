/**
 * 对源码文件进行特殊的处理
 * 连接AMD模块，取出AMD defined
 * 感谢Jquery的启发
 */

module.exports = function (grunt) {
    'use strict';
    var version = grunt.config('pkg.version'),
        requirejs = require('requirejs'),
        log = grunt.log,
        EMPTY_STR = '',
        PROJECT_NAME = 'com',
        R_AMD_DEFINE_START = /define\([^{]*?{/,
        R_AMD_DEFINE_END = /\}\);[^}\w]*$/,
        R_AMD_RETURN = /\s*return\s+[^\}]+(\}\);[^\w\}]*)$/,
        R_AMD_EXPORT = /\s*exports\.\w+\s*=\s*\w+;/g,
        R_IS_VAR_MODULE = /.\/var\//,
        config = {
            baseUrl: 'src',
            name: 'com',
            out: 'dist/com.js',
            //不需要优化, 需要执行几个优化步骤
            optimize: 'none',
            //通过require加载的依赖
            findNestedDependencies: true,
            skipSemiColonInsertion: true,
            //包装代码
            wrap: {
                startFile: 'src/intro.js',
                endFile: 'src/outro.js'
            },
            rawText: {},
            //对每一个AMD模块的内容进行处理
            onBuildWrite: convert,
            //不需要打包的文件
            excludeShallow: ['libs/zepto', 'libs/underscore'],
            include: []
        };
    /**
     * 去除AMD 模块的定义 define
     */
    function convert(moduleName, path, contents) {
        console.log(moduleName.green, path.blue);
        // 转化var模块 转化为
        // var moduleA = {
        //     ...
        //     obj content
        //     ...
        // };
        if (R_IS_VAR_MODULE.test(path)) {
            contents = contents
                .replace( /define\([\w\W]*?return/, 'var ' + (/var\/([\w-]+)/.exec(moduleName)[1]) + ' =')
                .replace( R_AMD_DEFINE_END, EMPTY_STR);
        } else {
            //去除多余的return 语句，保证只有一个出口，这个出口在Com中
            if (moduleName !== PROJECT_NAME) {
                contents = contents
                    .replace(R_AMD_RETURN, '$1')
                    // Multiple exports
                    .replace(R_AMD_EXPORT, EMPTY_STR);
            }
            //去除AMD Define
            contents = contents
                .replace(R_AMD_DEFINE_START, EMPTY_STR)
                .replace(R_AMD_DEFINE_END, EMPTY_STR);
        }
        return contents;
    }


    grunt.registerMultiTask(
        //Task name
        'build',
        //Task Description
        'Concatenate source, remove sub AMD definitions',
    function () {
        var name = this.data.dest,
            done = this.async();
        log.writeln('concat file to file:' + name);
        //处理编译好的文件
        config.out = function (compiled) {
            compiled = compiled
                // 打上Version
                .replace(/@VERSION/g, version)
                // 打上Date [yyyy-mm-ddThh:mmZ]
                .replace(/@DATE/g, (new Date()).toISOString().replace(/:\d+\.\d+Z$/, 'Z'));
            log.writeln('file name:' + name);
            grunt.file.write(name, compiled);
        };

        requirejs.optimize(config, function (response) {
            log.ok( 'File \'' + name + '\' created.');
            done();
        }, function (err) {
            log.error(err);
            done(err);
        });
    });
};