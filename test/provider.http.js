"use strict";

var _assert = require("assert");

var _ServiceProvider = require("../build/ServiceProvider.js");

var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

var _service_manifest = require("./service_manifest.js");

var service_manifest = _interopRequireWildcard(_service_manifest);

var _http = require("http2");

var _http2 = _interopRequireDefault(_http);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _http3 = require("http");

var _http4 = _interopRequireDefault(_http3);

var _test_function_declaration = require("./test_function_declaration.js");

var _test_function_declaration2 = _interopRequireDefault(_test_function_declaration);

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

describe("HTTP provider setup", () => {
    const options = {
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9601;
    const service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: false
    });
    const server = service_provider.startServer(test_port, options);
    server.on("error", error => {
        _assert.strict.fail(error.message);
    });
    const client = _http2.default.connect("http://localhost:" + test_port, {});
    client.on("error", error => {
        _assert.strict.fail(error.message);
    });
    describe("METHOD handling", () => {
        it("OPTIONS handling", done => {
            const request = client.request({
                ":method": "OPTIONS"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 200);
                _assert.strict.equal(headers["access-control-allow-methods"], "POST,OPTIONS");
                // done();
            });
            let data = "";
            request.on("data", chunk => {
                data += chunk;
            });
            request.on("end", () => {
                // console.log("request end", data);
                done();
            });
            request.end();
        });
        it("POST handling", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 200);
            }); {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    _assert.strict.doesNotThrow(JSON.parse.bind(JSON, data));
                    const value = JSON.parse(data);
                    _assert.strict.equal(value, _test_function_declaration2.default.result);
                    done();
                });
            }
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.name,
                arguments: _test_function_declaration2.default.arguments
            }));
            request.end();
        });
        it("GET not allowed", done => {
            const request = client.request({
                ":method": "GET"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 405);
                _assert.strict.equal(headers["allow"], "OPTIONS,POST");
                done();
            });
            request.end();
        });
        it("DELETE not allowed", done => {
            const request = client.request({
                ":method": "DELETE"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 405);
                _assert.strict.equal(headers["allow"], "OPTIONS,POST");
                done();
            });
            request.end();
        });
        it("PUT not allowed", done => {
            const request = client.request({
                ":method": "PUT"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 405);
                _assert.strict.equal(headers["allow"], "OPTIONS,POST");
                done();
            });
            request.end();
        });
        it("POST unimplemented function returns 501", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 501);
                done();
            });
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.unimplemented_name
            }));
            request.end();
        });
        it("POST throwing function returns 502", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 502);
                done();
            });
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.throwing_name
            }));
            request.end();
        });
    });
    describe("Compatibility", () => {
        it("HTTP1 not supported", done => {
            const options = {
                hostname: "localhost",
                port: test_port,
                path: "/",
                method: "POST"
            };
            const request = _http4.default.get(options, response => {
                _assert.strict.fail("HTTP1 succeeded");
            });
            request.on("error", error => {
                done();
            });
        });
    });
    after(() => {
        client.close();
        server.close();
    });
});