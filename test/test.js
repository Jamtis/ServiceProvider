"use strict";

var _ServiceProvider = require("../build/ServiceProvider.js");

var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

var _service_manifest = require("./service_manifest.js");

var service_manifest = _interopRequireWildcard(_service_manifest);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _http = require("http2");

var _http2 = _interopRequireDefault(_http);

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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const options = {
    key: _fs2.default.readFileSync("test/certificate/key.pem"),
    cert: _fs2.default.readFileSync("test/certificate/certificate.pem"),
    allowHTTP1: true,
    enablePush: true
};
const test_port = 9600;
describe("Server setup", () => {
    const service_provider = new _ServiceProvider2.default(service_manifest);
    console.log("start server");
    const server = service_provider.startServer(test_port, options);
    // TODO: create CA instead of TLS_REJECT_UNAUTHORIZED
    const client = _http2.default.connect("https://localhost:" + test_port, {
        // ca: fs.readFileSync('certificate/cert.pem')
    });
    client.on("error", error => console.error(error));
    describe("METHOD handling", () => {
        it("OPTIONS handling", done => {
            const request = client.request({
                ":method": "OPTIONS"
            });
            request.setEncoding("utf8");
            request.on("response", (headers, flags) => {
                console.log("server response headers", headers);
                // console.log("flags", flags);
            });
            let data = "";
            request.on("data", chunk => {
                data += chunk;
            });
            request.on("end", () => {
                console.log("response body:", data);
                done();
            });
            request.end();
        });
        it("POST handling", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.setEncoding("utf8");
            request.on("response", (headers, flags) => {
                console.log("server response headers", headers);
                // console.log("flags", flags);
            });
            let data = "";
            request.on("data", chunk => {
                data += chunk;
            });
            request.on("end", () => {
                console.log("response body:", data);
                done();
            });
            console.log("write body");
            request.write(JSON.stringify({
                test_function: [3, 39]
            }));
            request.end();
        });
    });
    after(() => {
        client.close();
    });
});