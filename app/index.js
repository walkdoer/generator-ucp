'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var copyFile = function (src, dest, root) {
  fs.createReadStream(path.join(root, src)).pipe(fs.createWriteStream(path.join(root, dest)));
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
    if (this.needZepto) {
      console.log('目标根目录:' + this.destinationRoot());
      copyFile('vendor/zepto/zepto.min.js', 'src/libs/zepto.min.js', this.destinationRoot());
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
    }];

    this.prompt(prompts, function (props) {
      this.projectName = props.projectName;
      this.version = props.version;
      this.needZepto = props.needZepto;
      this.needQunit = props.needQunit;
      this.needUnderscore = props.needUnderscore;
      done();
    }.bind(this));
  },

  app: function () {
    this.mkdir('src');
    this.mkdir('build');
    this.mkdir('dist');
    this.mkdir('docs');
    this.mkdir('test');

    this.template('_package.json', 'package.json');
    this.template('_bower.json', 'bower.json');
    this.template('Gruntfile.js', 'Gruntfile.js');
  },
  js: function () {
    this.mkdir('src/libs');
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
