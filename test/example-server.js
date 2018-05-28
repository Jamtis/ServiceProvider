"use strict";

var _assert = require("assert");

var _ServiceProvider = require("../build/ServiceProvider.js");

var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

var _service_manifest = require("./service_manifest.js");

var service_manifest = _interopRequireWildcard(_service_manifest);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _http = require("http2");

var _http2 = _interopRequireDefault(_http);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

const options = {
    key: _fs2.default.readFileSync("test/certificate/root-ca.key"),
    passphrase: "password",
    cert: _fs2.default.readFileSync("test/certificate/root-ca.crt"),
    allowHTTP1: true,
    enablePush: true
};
const test_port = 9600;
const service_provider = new _ServiceProvider2.default(service_manifest, {
    logging: false
});
// console.log("start server");
const server = service_provider.startServer(test_port, options);