"use strict";
var _assert = require("assert"),
    _ServiceProvider = require("../build/ServiceProvider.js"),
    _ServiceProvider2 = _interopRequireDefault(_ServiceProvider),
    _service_manifest = require("./service_manifest.js"),
    service_manifest = _interopRequireWildcard(_service_manifest),
    _fs = require("fs"),
    _fs2 = _interopRequireDefault(_fs),
    _http = require("http2"),
    _http2 = _interopRequireDefault(_http),
    _https = require("https"),
    _https2 = _interopRequireDefault(_https),
    _http3 = require("http"),
    _http4 = _interopRequireDefault(_http3);

function _interopRequireWildcard(t) {
    if (t && t.__esModule) return t;
    var e = {};
    if (null != t)
        for (var s in t) Object.prototype.hasOwnProperty.call(t, s) && (e[s] = t[s]);
    return e.default = t, e
}

function _interopRequireDefault(t) {
    return t && t.__esModule ? t : {
        default: t
    }
}
console.clear(), describe("HTTP setup", () => {
    const t = new _ServiceProvider2.default(service_manifest, {
        logging: !1
    }).startServer(9601, {
        allowHTTP1: !0,
        enablePush: !0
    });
    t.on("error", t => {
        _assert.strict.fail(t.message)
    });
    const e = _http2.default.connect("http://localhost:9601", {});
    e.on("error", t => {
        _assert.strict.fail(t.message)
    }), describe("METHOD handling", () => {
        it("OPTIONS handling", t => {
            const s = e.request({
                ":method": "OPTIONS"
            });
            s.setEncoding("utf8"), s.on("response", t => {
                _assert.strict.equal(t[":status"], 200), _assert.strict.equal(t["access-control-allow-methods"], "POST,OPTIONS")
            });
            let r = "";
            s.on("data", t => {
                r += t
            }), s.on("end", () => {
                t()
            }), s.end()
        }), it("POST test function", t => {
            const s = e.request({
                ":method": "POST"
            });
            s.setEncoding("utf8"), s.on("response", t => {
                _assert.strict.equal(t[":status"], 200)
            }); {
                let e = "";
                s.on("data", t => {
                    e += t
                }), s.on("end", () => {
                    _assert.strict.doesNotThrow(JSON.parse.bind(JSON, e));
                    const s = JSON.parse(e);
                    _assert.strict.equal(s, 42), t()
                })
            }
            s.write(JSON.stringify({
                service_function: "test_function",
                arguments: [3, 39]
            })), s.end()
        })
    }), describe("Compatibility", () => {
        it("HTTP1 not supported", t => {
            const e = {
                hostname: "localhost",
                port: 9601,
                path: "/",
                method: "POST"
            };
            _http4.default.get(e, t => {
                _assert.strict.fail("HTTP1 succeeded")
            }).on("error", e => {
                t()
            })
        })
    }), after(() => {
        e.close(), t.close()
    })
}), describe("HTTPS setup", () => {
    const t = _fs2.default.readFileSync("test/certificate/root-ca.key"),
        e = _fs2.default.readFileSync("test/certificate/root-ca.crt"),
        s = {
            key: t,
            passphrase: "password",
            cert: e,
            allowHTTP1: !0,
            enablePush: !0
        },
        r = new _ServiceProvider2.default(service_manifest, {
            logging: !1,
            isAuthorized: (t, {
                user: e,
                password: s
            }) => !t.match(/authorized/) || "user!§$%&/()=?`*'ÄÖÜ_;@€" == e && "password!§$%&/()=?`*'ÄÖÜ_:;@€" == s
        }).startServer(9600, s),
        i = _http2.default.connect("https://localhost:9600", {
            ca: e
        });
    i.on("error", t => {
        _assert.strict.fail(t.message)
    }), describe("METHOD handling", () => {
        it("OPTIONS handling", t => {
            const e = i.request({
                ":method": "OPTIONS"
            });
            e.setEncoding("utf8"), e.on("response", t => {
                _assert.strict.equal(t[":status"], 200, "Status not OK"), _assert.strict.equal(t["access-control-allow-methods"], "POST,OPTIONS")
            });
            let s = "";
            e.on("data", t => {
                s += t
            }), e.on("end", () => {
                t()
            }), e.end()
        }), it("POST test function", t => {
            const e = i.request({
                ":method": "POST"
            });
            e.setEncoding("utf8"), e.on("response", t => {
                _assert.strict.equal(t[":status"], 200)
            }); {
                let s = "";
                e.on("data", t => {
                    s += t
                }), e.on("end", () => {
                    _assert.strict.doesNotThrow(JSON.parse.bind(JSON, s));
                    const e = JSON.parse(s);
                    _assert.strict.equal(e, 42), t()
                })
            }
            e.write(JSON.stringify({
                service_function: "test_function",
                arguments: [3, 39]
            })), e.end()
        })
    }), describe("Compatibility", () => {
        it("HTTP1 supported", t => {
            const s = {
                    hostname: "localhost",
                    port: 9600,
                    path: "/",
                    method: "POST",
                    ca: e
                },
                r = _https2.default.request(s, e => {
                    _assert.strict.equal(e.statusCode, 200);
                    let s = "";
                    e.on("data", t => {
                        s += t
                    }), e.on("end", () => {
                        _assert.strict.doesNotThrow(JSON.parse.bind(JSON, s));
                        const e = JSON.parse(s);
                        _assert.strict.equal(e, 42), t()
                    })
                });
            r.on("error", t => {
                _assert.strict.fail(t.message)
            }), r.write(JSON.stringify({
                service_function: "test_function",
                arguments: [3, 39]
            })), r.end()
        })
    }), describe("Security", () => {
        it("Certificate required", t => {
            _http2.default.connect("https://localhost:9600", {}).on("error", e => {
                _assert.strict.equal(e.message, "self signed certificate"), _assert.strict.equal(e.code, "DEPTH_ZERO_SELF_SIGNED_CERT"), t()
            })
        }), it("Authorization supported", t => {
            const e = i.request({
                ":method": "POST",
                Authorization: "Basic " + Buffer.from("user!§$%&/()=?`*'ÄÖÜ_;@€:password!§$%&/()=?`*'ÄÖÜ_:;@€").toString("base64")
            });
            e.setEncoding("utf8"), e.on("response", t => {
                _assert.strict.equal(t[":status"], 200)
            }); {
                let s = "";
                e.on("data", t => {
                    s += t
                }), e.on("end", () => {
                    _assert.strict.doesNotThrow(JSON.parse.bind(JSON, s));
                    const e = JSON.parse(s);
                    _assert.strict.equal(e, 42), t()
                })
            }
            e.write(JSON.stringify({
                service_function: "test_authorized_function",
                arguments: [3, 39]
            })), e.end()
        }), it("Unauthorized request returns 401", t => {
            const e = i.request({
                ":method": "POST"
            });
            e.setEncoding("utf8"), e.on("response", e => {
                _assert.strict.equal(e[":status"], 401), t()
            }), e.write(JSON.stringify({
                service_function: "test_authorized_function",
                arguments: [3, 39]
            })), e.end()
        })
    }), after(() => {
        i.close(), r.close()
    })
});