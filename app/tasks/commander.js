/**
 * Commander
 * 执行shell脚本
*/

module.exports = function (grunt) {
    'use strict';
    var log = grunt.log,
        exec = require('child_process').exec;

    grunt.registerMultiTask(
        //Task name
        'commander',
        //Task Description
        'excute shell',
        function () {
            var processConfig = this.data.command;
            log.writeln('command about to excute: ' + processConfig);
            exec(processConfig, function (error, stdout, stderr) {
                // console.log(typeof stdout);
                if (error) {
                    throw error;
                }
            });
        });
};
