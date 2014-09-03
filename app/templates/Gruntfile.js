// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
module.exports = function (grunt) {
    'use strict';
    function readOptionalJSON(filepath) {
        var data = {};
        try {
            data = grunt.file.readJSON(filepath);
        } catch (e) {

        }
        return data;
    }
    var srcHintOptions = readOptionalJSON('.jshintrc');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%%= pkg.name %> - v<%%= pkg.version %> - ' +
                '<%%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        bowercopy: {
            options: {
                clean: false
            },
            src: {
                files: {
                    <% if(needZepto) { %>'src/libs/zepto.min.js': 'zepto/zepto.min.js',<% } %>
                    <% if (needUnderscore) { %>'src/libs/underscore.js': 'underscore/underscore.js'<% } %>
                }
            },
            tests: {
                options: {
                    destPrefix: 'test/libs'
                },
                files: {
                    'qunit': 'qunit/qunit',
                    <% if(needZepto) { %>'zepto.min.js': 'zepto/zepto.min.js',<% } %>
                    <% if (needUnderscore) { %>'underscore.js': 'underscore/underscore.js' <% } %>
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['build']
            },
            tpl: {
                files: ['src/tpl/**/*.tpl'],
                tasks: ['tpl']
            }
        },
        tpl: {
            options: {
                base: 'src/tpl'
            },
            tpl: {
                src: ['src/tpl/*.tpl'],
                dest: 'src/js/tpl'
            }
        },
        <% if (needSeajs) {%>
        cmd: {
            options: {
                base: 'src/js/',
                shim: {
                    <% if (needZepto) { %> 'zepto': 'src/js/libs/zepto.min.js' <% } %>
                }
            },
            all: {
                src: [
                    'src/js/**/*.js'
                ],
                dest: 'compiled'
            }
        },
        pack: {
            css: {
                type: 'css',
                src: [
                    '<%%= meta.banner %>',
                    'src/css/**/*.css'
                ],
                dest: 'dist/style.min.<%%= pkg.version %>.css'
            },
            app: {
                type: 'js',
                options: {
                    base: 'compiled'
                },
                src: [
                    '<%%= meta.banner %>',
                    'compiled/*.js'
                ],
                ignore: [
                    /*这里输入需要排除的js文件*/
                ],
                dest: 'dist/app.min.<%%= pkg.version %>.js'
            }
        },
        <% } else { %>
        concat: {
            options: {
                //每个文件之间的分隔符
                separator: ';'
            },
            dist: {
                //需要拼接的文件，按照src数组的顺序进行拼接
                src: [
                    'src/js/libs/zepto.min.js',
                    <% if(needUnderscore) { %>'src/js/libs/underscore.js',<% } %>
                    'src/js/**/*.js'
                ],
                // 输出拼接之后的js
                dest: 'compiled/app.<%%= pkg.version %>.js'
            }
        },
        cssmin: {
          css:{
              src: 'compiled/app.<%= pkg.version %>.css',
              dest: 'dist/app.min.<%= pkg.version %>.css'
          }
        },
        uglify: {
            options: {
                banner: '<%%=meta.banner%>'
            },
            dist: {
                files: {
                      //concat.dist.dest为Concat任务的输出结果文件
                     'dist/app.min.<%%= pkg.version %>.js': ['<%%=concat.dist.dest%>']
                }
            }
        },
        <% } %> // -----
        //清除中间结果
        clean: {
            compiled: ['compiled']
        },
        jshint: {
            all: {
                src: [
                    'src/**/*.js'
                ],
                options: {
                    jshintrc: true
                }
            },
            //由于源码已经经过jshint，所以合并之后的文件则不进行检查
            //目前暂时取消
            // dist: {
            //     src: 'dist/com.js',
            //     options: srcHintOptions
            // }
        },
        server: {
            publicDir: './src',
            tplDir: './src/tpl',
            staticMapping: {
                '/public': './src'
            },
            // testPath: '/test',
            port: 5020
        },
        htmlbuild: {
            dist: {
                src: './src/tpl/index.html',
                dest: './dist/',
                options: {
                    //beautify: true,
                    //prefix: '//some-cdn',
                    //relative: true,
                    scripts: {
                        main: './dist/*.js'
                    },
                    styles: {
                        main: './dist/*.css'
                    }
                }
            }
        },
        commander: {
            /* 定义要执行的shell语句
               例如
            cmd1: {
                command: 'cp dist/example.js other/folder/example.js'
            },
            */
        },
    });
    grunt.loadTasks('build/tasks');

    //同步bower库的文件到需要的文件夹
    grunt.loadNpmTasks('grunt-bowercopy');
    //jsHint
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //监听文件
    grunt.loadNpmTasks('grunt-contrib-watch');
    //清除文件
    grunt.loadNpmTasks('grunt-contrib-clean');
    <% if (!needSeajs) { %>
    //连接文件
    grunt.loadNpmTasks('grunt-contrib-concat');
    //压缩js文件
    grunt.loadNpmTasks('grunt-contrib-uglify');
    //压缩css文件
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    <% } %>
    //构建html文件
    grunt.loadNpmTasks('grunt-html-build');
    //bower the denpendencies
    grunt.registerTask('bower', 'bowercopy');
    //build project
    <% if (needSeajs) {%>
    grunt.registerTask('build', ['clean', 'cmd', 'pack', 'htmlbuild']);
    <% } else { %>
    grunt.registerTask('build', ['clean', 'concat', 'cssmin', 'uglify', 'htmlbuild']);
    <% } %>
    //use this task when under developing
    grunt.registerTask('dev', ['watch', 'server']);
    //test
    grunt.registerTask('test', ['jshint']);
    //default task, when you run command 'grunt'
    grunt.registerTask('default', ['bower', 'build', 'dev', 'server']);
};
