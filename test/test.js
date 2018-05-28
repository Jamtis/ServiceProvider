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

var _http3 = require("http");

var _http4 = _interopRequireDefault(_http3);

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

describe("HTTP setup", () => {
    const options = {
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9601;
    const service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: false
    });
    // console.log("start server");
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
            request.setEncoding("utf8");
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
            request.setEncoding("utf8");
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
                    _assert.strict.equal(data, "{}");
                    done();
                });
            }
            request.end();
        });
        it("POST test function", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.setEncoding("utf8");
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
                    const {
                        test_function
                    } = JSON.parse(data);
                    _assert.strict.equal(test_function.status, 200);
                    _assert.strict.equal(test_function.value, 42);
                    done();
                });
            }
            request.write(JSON.stringify({
                test_function: [3, 39]
            }));
            request.end();
        });
    });
    describe("Compatibility", () => {
        it("HTTP1 supported", done => {
            const options = {
                hostname: "localhost",
                port: test_port,
                path: "/",
                method: "POST"
            };
            const request = _http4.default.get(options, response => {
                _assert.strict.equal(response.statusCode, 200);
                done();
            });
            request.on("error", error => {
                _assert.strict.fail(error.message);
            });
        });
    });
    after(() => {
        client.close();
        server.close();
    });
});
describe("HTTPS setup", () => {
    const options = {
        key: _fs2.default.readFileSync("test/certificate/root-ca.key"),
        passphrase: "password",
        cert: _fs2.default.readFileSync("test/certificate/root-ca.crt"),
        // ca: fs.readFileSync("test/certificate/root-ca.crt"),
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9600;
    const service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: false
    });
    // console.log("start server");
    const server = service_provider.startServer(test_port, options);
    const client = _http2.default.connect("https://localhost:" + test_port, {
        ca: _fs2.default.readFileSync("test/certificate/root-ca.crt")
    });
    client.on("error", error => {
        _assert.strict.fail(error.message);
    });
    describe("METHOD handling", () => {
        it("OPTIONS handling", done => {
            const request = client.request({
                ":method": "OPTIONS"
            });
            request.setEncoding("utf8");
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 200, "Status not OK");
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
            request.setEncoding("utf8");
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
                    _assert.strict.equal(data, "{}");
                    done();
                });
            }
            request.end();
        });
        it("POST test function", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.setEncoding("utf8");
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
                    const {
                        test_function
                    } = JSON.parse(data);
                    _assert.strict.equal(test_function.status, 200);
                    _assert.strict.equal(test_function.value, 42);
                    done();
                });
            }
            request.write(JSON.stringify({
                test_function: [3, 39]
            }));
            request.end();
        });
    });
    describe("Security", () => {
        it("Certificate required", done => {
            const unauthorized_client = _http2.default.connect("https://localhost:" + test_port, {});
            unauthorized_client.on("error", error => {;
                _assert.strict.equal(error.message, "self signed certificate");
                _assert.strict.equal(error.code, "DEPTH_ZERO_SELF_SIGNED_CERT");
                done();
            });
        });
    });
    describe("Compatibility", () => {
        it("HTTP1 supported", done => {
            const options = {
                hostname: "localhost",
                port: test_port,
                path: "/",
                method: "POST",
                ca: _fs2.default.readFileSync("test/certificate/root-ca.crt")
            };
            const request = _https2.default.request(options, response => {
                _assert.strict.equal(response.statusCode, 200);
                let data = "";
                response.on("data", chunk => {
                    data += chunk;
                });
                response.on("end", () => {
                    // console.log("request end", data);
                    _assert.strict.equal(data, "{}");
                    done();
                });
            });
            request.on("error", error => {
                _assert.strict.fail(error.message);
            });
            request.write("{}");
            request.end();
        });
    });
    after(() => {
        client.close();
        server.close();
    });
});