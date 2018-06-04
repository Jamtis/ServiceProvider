"use strict";
var _ServiceProvider = require("../ServiceProvider.js"),
    _ServiceProvider2 = _interopRequireDefault(_ServiceProvider),
    _service_manifest = require("../../test/service_manifest.js"),
    service_manifest = _interopRequireWildcard(_service_manifest),
    _fs = require("fs"),
    _fs2 = _interopRequireDefault(_fs),
    _http = require("http2"),
    _http2 = _interopRequireDefault(_http);

function _interopRequireWildcard(e) {
    if (e && e.__esModule) return e;
    var r = {};
    if (null != e)
        for (var t in e) Object.prototype.hasOwnProperty.call(e, t) && (r[t] = e[t]);
    return r.default = e, r
}

function _interopRequireDefault(e) {
    return e && e.__esModule ? e : {
        default: e
    }
}
const options = {
        allowHTTP1: !0,
        enablePush: !0
    },
    test_port = 9600,
    service_provider = new _ServiceProvider2.default(service_manifest, {
        logging: !0
    }),
    server = service_provider.startServer(9600, options);
server.on("stream", (e, r) => {
    console.log("here", r)
});
const unauthorized_client = _http2.default.connect("http://localhost:9600", {});
unauthorized_client.on("error", e => {
    console.error(e)
});
const request = unauthorized_client.request({
    ":method": "POST"
});
request.on("end", e => {
    console.timeEnd("ping")
}), request.write(JSON.stringify({
    test_function: [3, 39]
})), console.time("ping"), request.end();