"use strict";

var _assert = require("assert");

var _ServiceProvider = require("../build/ServiceProvider.js");

var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

var _ServiceClient = require("../build/ServiceClient.js");

var _ServiceClient2 = _interopRequireDefault(_ServiceClient);

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

describe("Client HTTPS setup", () => {
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
    const test_port = 9603;
    const service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: false
    });
    const server = service_provider.startServer(test_port, options);
    server.on("error", error => {
        _assert.strict.fail(error.message);
    });
    const client = new _ServiceClient2.default("https://localhost:" + test_port, {
        ca: cert
    });
    it("Request succeeds (Node.js)", async () => {
        const result = await client.proxy[_test_function_declaration2.default.name](..._test_function_declaration2.default.arguments);
        _assert.strict.equal(result, _test_function_declaration2.default.result);
    });
    it("Request succeeds (fetch)", async () => {
        const agent = _https2.default.Agent({
            key,
            cert,
            ca: cert,
            passphrase: "password"
        });
        const client = new _ServiceClient2.default("https://localhost:" + test_port, {
            agent
        });
        // rebuild client._makeRequestFetch because fetch is not available in its context
        let function_string = client._makeRequestFetch.toString();
        if (!/^(.*?)\((.*)\)\s(?:=>\s)/.test(function_string) && !function_string.startsWith("function")) {
            function_string = "function " + function_string;
        }
        // console.log("function_string", function_string);
        const fetch = require("node-fetch");
        client._makeRequest = new Function("fetch", "return " + function_string)(fetch);
        // console.log("_makeRequest", client._makeRequest);
        const result = await client.proxy[_test_function_declaration2.default.name](..._test_function_declaration2.default.arguments);
        _assert.strict.equal(result, _test_function_declaration2.default.result);
    });
    after(async () => {
        await client.close();
        server.close();
    });
});