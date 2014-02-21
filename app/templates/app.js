'use strict';
var path = require('path');

module.exports = function (config) {
    return {
        '/': {
            template: 'index.html',
            get: function (req, res) {
            }
        },
        '/get': {
            get: function (req, res) {
                return {
                    msg: 'This is get request'
                };
            }
        }
    };
};
