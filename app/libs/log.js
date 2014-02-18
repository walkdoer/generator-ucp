(function(win){
    var Log = function() {},
        socket = io.connect(location.href.replace(location.hash, '')),
        nativeConsole = win.nativeConsole || (win.nativeConsole = win.console);

    function toArray(obj) {
        return Array.prototype.slice.call(obj);
    }

    Log.prototype.log = function () {
        nativeConsole.log.apply(nativeConsole, arguments);
        arguments = toArray(arguments);
        arguments.unshift(0);
        this.send.apply(this, arguments);
    };

    Log.prototype.info = function () {
        nativeConsole.info.apply(nativeConsole, arguments);
        arguments = toArray(arguments);
        arguments.unshift(1);
        this.send.apply(this, arguments);
    };

    Log.prototype.warn = function () {
        nativeConsole.warn.apply(nativeConsole, arguments);
        arguments = toArray(arguments);
        arguments.unshift(2);
        this.send.apply(this, arguments);
    };

    Log.prototype.error = function () {
        nativeConsole.error.apply(nativeConsole, arguments);
        arguments = toArray(arguments);
        arguments.unshift(3);
        this.send.apply(this, arguments);
    };

    Log.prototype.send = function() {
        var level = arguments[0],
            args = toArray(arguments).slice(1),
            data = {level: level, args: args},
            message = JSON.stringify(data);
        socket.emit('Log message', message);
    };

    win.log = new Log();

    win.addEventListener('error', function (event) {
        log.info('client page error: ');
        log.error(event.message);
        log.error(event.filename + ' :' + event.lineno);
    }, false);
})(window);



