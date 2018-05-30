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
describe("HTTPS setup", () => {
    const key = _fs2.default.readFileSync("test/certificate/root-ca.key");
    const cert = _fs2.default.readFileSync("test/certificate/root-ca.crt");
    const options = {
        key,
        passphrase: "password",
        cert,
        // ca: cert,
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9600;
    const test_authorization_user = "user!§$%&/()=?`*'ÄÖÜ_;@€";
    const test_authorization_password = "password!§$%&/()=?`*'ÄÖÜ_:;@€";
    const service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: false,
        isAuthorized(service_function_name, {
            user,
            password
        }) {
            if (service_function_name.match(/authorized/)) {
                if (user == test_authorization_user && password == test_authorization_password) {
                    return true;
                }
                return false;
            }
            return true;
        }
    });
    const server = service_provider.startServer(test_port, options);
    const client = _http2.default.connect("https://localhost:" + test_port, {
        ca: cert
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
    describe("Security", () => {
        it("Certificate required", done => {
            const unauthorized_client = _http2.default.connect("https://localhost:" + test_port, {});
            unauthorized_client.on("error", error => {
                _assert.strict.equal(error.message, "self signed certificate");
                _assert.strict.equal(error.code, "DEPTH_ZERO_SELF_SIGNED_CERT");
                done();
            });
        });
        it("Authorization supported", done => {
            const request = client.request({
                ":method": "POST",
                "Authorization": "Basic " + Buffer.from(test_authorization_user + ":" + test_authorization_password).toString("base64")
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
                        test_authorized_function
                    } = JSON.parse(data);
                    _assert.strict.equal(test_authorized_function.status, 200);
                    _assert.strict.equal(test_authorized_function.value, 42);
                    done();
                });
            }
            request.write(JSON.stringify({
                test_authorized_function: [3, 39]
            }));
            request.end();
        });
        it("Unauthorized request returns 401", done => {
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
                        test_authorized_function
                    } = JSON.parse(data);
                    _assert.strict.equal(test_authorized_function.status, 401);
                    _assert.strict.equal(test_authorized_function.value, undefined);
                    done();
                });
            }
            request.write(JSON.stringify({
                test_authorized_function: [3, 39]
            }));
            request.end();
        });
    });
    after(() => {
        client.close();
        server.close();
    });
});