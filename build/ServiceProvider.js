"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
});
var _url = require("url"),
    _url2 = _interopRequireDefault(_url),
    _querystring = require("querystring"),
    _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(e) {
    return e && e.__esModule ? e : {
        default: e
    }
}
class ServiceProvider {
    constructor(e, t = {}) {
        Object.defineProperties(this, {
            service_manifest: {
                value: e,
                enumerable: !0
            }
        }), this.logging = t.logging, this.http2 = t.http2, "function" == typeof t.isAuthorized && (this.isAuthorized = t.isAuthorized)
    }
    async handleRequest(e, t) {
        try {
            const r = await this.analyzeRequest(e);
            this.logging && console.log("request analyzed", r), this.checkRequest(r, t) && (this.hasServiceFunction(r) ? this.isAuthorized(r.service_function_name, r.authorization) ? await this.invokeServiceFunction(r, t) : r.authorization.user ? t.writeHead(403) : t.writeHead(401, {
                "WWW-Authenticate": "Basic " + r.service_function_name
            }) : t.writeHead(501))
        } catch (e) {
            console.error(e)
        } finally {
            try {
                t.end()
            } catch (e) {
                console.error(e)
            }
        }
    }
    async invokeServiceFunction(e, t) {
        const r = this.service_manifest[e.service_function_name];
        this.logging && console.log("[34m", "call", e.service_function_name, "with", ...e.service_function_arguments, "[0m");
        let i = "{}";
        try {
            const n = await r.apply(this.service_manifest, e.service_function_arguments);
            i = JSON.stringify(n) || "", t.writeHead(200), this.logging && console.log("response_string", i), t.write(i)
        } catch (e) {
            try {
                t.writeHead(502), t.write(e.message)
            } catch (e) {
                console.error(e)
            }
        }
    }
    async analyzeRequest(e) {
        const t = _url2.default.parse(e.url);
        let r = "";
        e.on("data", e => {
            r += e.toString()
        }), await new Promise((t, r) => {
            e.on("end", e => {
                e ? r(e) : t()
            })
        });
        const i = _querystring2.default.parse(t.query);
        for (const e in i) i[e] = decodeURIComponent(i[e]);
        let n, s;
        try {
            const e = JSON.parse(r);
            n = e.service_function, s = e.arguments
        } catch (e) {}
        const o = !e.headers.accept || /(application\/(json|\*)|\*\/\*)/g.test(e.headers.accept),
            {
                authorization: a
            } = e.headers;
        let c, u;
        if (a) {
            const e = Buffer.from(a.match(/Basic\ (.+)/)[1], "base64").toString();
            [, c, u] = e.match(/^([^:]+?):(.*)$/)
        }
        return {
            method: e.method,
            headers: e.headers,
            pathname: t.pathname,
            data: r,
            query_parameters: i,
            service_function_name: n,
            service_function_arguments: s,
            accepted: o,
            authorization: {
                user: c,
                password: u
            }
        }
    }
    checkRequest(e, t) {
        switch (e.method) {
            case "POST":
                if (this.logging && console.log("[32m", "Check", e.method, "request", e.pathname, "[0m"), void 0 === e.service_function_name || null != e.service_function_arguments && !Array.isArray(e.service_function_arguments)) {
                    t.writeHead(400);
                    break
                }
                if (e.accepted) return !0;
                t.writeHead(406, {
                    Accept: ["application/json"]
                });
                break;
            case "OPTIONS":
                this.logging && console.log("[35m", "Detected", e.method, "request", "[0m"), t.writeHead(200, {
                    "Access-Control-Request-Methods": "OPTIONS",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization"
                });
                break;
            default:
                t.writeHead(405, {
                    Allow: "OPTIONS,POST"
                })
        }
        return !1
    }
    isAuthorized(e, {
        user: t,
        password: r
    } = {}) {
        return !0
    }
    hasServiceFunction(e) {
        let t;
        try {
            t = this.service_manifest[e.service_function_name]
        } catch (e) {
            console.error(e)
        }
        return "function" == typeof t
    }
    startServer(e, t = {}) {
        const r = require(!1 === this.http2 ? "http" : "http2");
        if (!(t.pfx || t.cert && t.key)) {
            console.warn("insufficient security provided; not using https");
            const i = r.createServer(t, this.handleRequest.bind(this));
            return i.listen(e), i
        }
        const i = r.createSecureServer(t, this.handleRequest.bind(this));
        return i.listen(e), i
    }
}
exports.default = ServiceProvider;