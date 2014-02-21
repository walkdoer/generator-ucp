'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var ncp = require('ncp').ncp;

//复制层级限制
ncp.limit = 16;

var copyFile = function (src, dest, root) {
  fs.createReadStream(path.join(root, src)).pipe(fs.createWriteStream(path.join(root, dest)));
}, copyDirectory = function(src, dest, root) {
  ncp(path.join(root, src), path.join(root, dest), function (err) {
    if (err) {
      console.log('There is something wrong when copy file of bower, directory:' + src);
    }
  });
};

var UcpGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = yeoman.file.readJSON(path.join(__dirname, '../package.json'));
    this.on('end', function () {
      this.installDependencies({
        skipInstall: this.options['skip-install'],
        callback: this._injectDependencies.bind(this)
      });
      // if (!this.options['skip-install']) {
      //   this.npmInstall();
      // }
    });
  },
  _injectDependencies: function () {
    var destRoot = this.destinationRoot();
    console.log('目标根目录:' + destRoot);
    if (this.needZepto) {
      //同步vendor资源
      copyFile('vendor/zepto/zepto.min.js', 'src/js/libs/zepto.min.js', destRoot);
      copyFile('vendor/zepto/zepto.min.js', 'test/libs/zepto.min.js', destRoot);
    }
    if (this.needUnderscore) {
      copyFile('vendor/underscore/underscore.js', 'src/js/libs/underscore.js', destRoot);
      copyFile('vendor/underscore/underscore.js', 'test/libs/underscore.js', destRoot);
    }
    if (this.needQunit) {
      copyDirectory('vendor/qunit', 'test/libs/qunit', destRoot);
    }
  },
  askFor: function () {
    var done = this.async();

    // have Yeoman greet the user
    console.log(this.yeoman);

    // replace it with a short and sweet description of your generator
    console.log(chalk.magenta('You\'re using the fantastic Ucp generator.'));

    var prompts = [{
      name: 'projectName',
      message: 'what\'s the name of your project?'
    }, {
      name: 'version',
      message: 'version(0.0.0)',
      default: '0.0.0'
    }, {
      type: 'confirm',
      name: 'needQunit',
      message: 'need Qunit?',
      default: false
    }, {
      name: 'needUnderscore',
      message: 'need underscore?',
      type: 'confirm',
      default: false
    }, {
      name: 'needZepto',
      message: 'need Zepto?',
      type: 'confirm',
      default: true
    }, {
      name: 'needSeajs',
      message: 'need Seajs?',
      type: 'confirm',
      default: true
    }];

    this.prompt(prompts, function (props) {
      this.projectName = props.projectName;
      this.version = props.version;
      this.needZepto = props.needZepto;
      this.needQunit = props.needQunit;
      this.needUnderscore = props.needUnderscore;
      this.needSeajs = props.needSeajs;
      done();
    }.bind(this));
  },

  app: function () {
    this.mkdir('src');
    //put the file relate to build project
    this.mkdir('build');
    //product file
    this.mkdir('dist');
    //document
    this.mkdir('docs');
    //test
    this.mkdir('test');
    //html template
    this.mkdir('src/tpl');
    //grunt task
    this.mkdir('build/tasks');
    //
    this.copy('../server.js', 'build/server.js');
    this.directory('../libs', 'build/libs');
    this.directory('../tasks', 'build/tasks');
    this.template('_package.json', 'package.json');
    this.template('_bower.json', 'bower.json');
    this.template('Gruntfile.js', 'Gruntfile.js');
  },
  js: function () {
    this.mkdir('src/js/libs');
    if (this.needSeajs) {
      this.copy('../js/seajs/sea.js', 'src/js/libs/sea.js');
    }
    this.directory('../js/core', 'src/js/core');
  },
  css: function () {
    this.mkdir('src/css');
    this.template('../css/main.css', 'src/css/main.css');
  },
  test: function () {
    this.mkdir('test/libs');
  },
  runtime: function () {
    this.copy('bowerrc', '.bowerrc');
    this.copy('gitignore', '.gitignore');
  },
  projectfiles: function () {
    this.copy('editorconfig', '.editorconfig');
    this.copy('jshintrc', '.jshintrc');
  }
});
module.exports = UcpGenerator;
