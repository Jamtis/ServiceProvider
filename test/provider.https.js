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

describe("HTTPS provider setup", () => {
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
        it("HTTP1 supported", done => {
            const options = {
                hostname: "localhost",
                port: test_port,
                path: "/",
                method: "POST",
                ca: cert
            };
            const request = _https2.default.request(options, response => {
                _assert.strict.equal(response.statusCode, 200);
                let data = "";
                response.on("data", chunk => {
                    data += chunk;
                });
                response.on("end", () => {
                    // console.log("request end", data);
                    _assert.strict.doesNotThrow(JSON.parse.bind(JSON, data));
                    const value = JSON.parse(data);
                    _assert.strict.equal(value, _test_function_declaration2.default.result);
                    done();
                });
            });
            request.on("error", error => {
                _assert.strict.fail(error.message);
            });
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.name,
                arguments: _test_function_declaration2.default.arguments
            }));
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
                service_function: _test_function_declaration2.default.authorized_name,
                arguments: _test_function_declaration2.default.arguments
            }));
            request.end();
        });
        it("Unauthorized request returns 401", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 401);
                _assert.strict.equal(headers["www-authenticate"], "Basic " + _test_function_declaration2.default.authorized_name);
                done();
            });
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.authorized_name,
                arguments: _test_function_declaration2.default.arguments
            }));
            request.end();
        });
        it("Invalidly authorized request returns 403", done => {
            const request = client.request({
                ":method": "POST",
                "Authorization": "Basic " + Buffer.from(test_authorization_user + "+:+" + test_authorization_password).toString("base64")
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                _assert.strict.equal(headers[":status"], 403);
                done();
            });
            request.write(JSON.stringify({
                service_function: _test_function_declaration2.default.authorized_name,
                arguments: _test_function_declaration2.default.arguments
            }));
            request.end();
        });
    });
    after(() => {
        client.close();
        server.close();
    });
});