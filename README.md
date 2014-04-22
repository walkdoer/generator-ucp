# generator-ucp [![Build Status](https://secure.travis-ci.org/zhangmhao/generator-ucp.png?branch=master)](https://travis-ci.org/zhangmhao/generator-ucp)

> [Yeoman](http://yeoman.io) generator


## Getting Started

### What is Yeoman?

Trick question. It's not a thing. It's this guy:

![](http://i.imgur.com/JHaAlBJ.png)

Basically, he wears a top hat, lives in your computer, and waits for you to tell him what kind of application you wish to create.

Not every new computer comes with a Yeoman pre-installed. He lives in the [npm](https://npmjs.org) package repository. You only have to ask for him once, then he packs up and moves into your hard drive. *Make sure you clean up, he likes new and shiny things.*

```
$ npm install -g yo
```

### Yeoman Generators

Yeoman travels light. He didn't pack any generators when he moved in. You can think of a generator like a plug-in. You get to choose what type of application you wish to create, such as a Backbone application or even a Chrome extension.

To install generator-ucp from npm, run:

```
$ npm install -g generator-ucp
```

Finally, initiate the generator:

```
$ yo ucp
```

### Getting To Know Yeoman

Yeoman has a heart of gold. He's a person with feelings and opinions, but he's very easy to work with. If you think he's too opinionated, he can be easily convinced.

If you'd like to get to know Yeoman better and meet some of his friends, [Grunt](http://gruntjs.com) and [Bower](http://bower.io), check out the complete [Getting Started Guide](https://github.com/yeoman/yeoman/wiki/Getting-Started).


## Release History

* 2014-04-22 v0.1.6 修复app.js模板错误，优化index.html模板,增加zepto shim
* 2014-04-21 v0.1.5 修复html-build依赖缺失，修复Gruntfile.js错误
* 2014-04-21 v0.1.4 修复路径引用错误
* 2014-02-27 v0.1.3 添加JS入口文件，修复部分问题，提供非seajs项目的打包功能
* 2014-02-24 v0.1.2 修复Server的问题
* 2014-02-20 v0.1.1 增加seajs，sever
* 2014-02-19 v0.1.0 搭建出基本的项目

## License

MIT
