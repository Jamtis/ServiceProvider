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
        }), this.logging = t.logging, "function" == typeof t.isAuthorized && (this.isAuthorized = t.isAuthorized)
    }
    async handleRequest(e, t) {
        try {
            const r = await this.analyzeRequest(e);
            if (this.logging && console.log("request analyzed", r), this.checkRequest(r, t)) {
                let e;
                try {
                    e = this.service_manifest[r.service_function_name]
                } catch (e) {
                    console.error(e)
                }
                "function" == typeof e ? this.isAuthorized(r.service_function_name, r.authorization) ? await this.invokeServiceFunction(r, t) : t.writeHead(401) : t.writeHead(501)
            }
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
        let i = "{}";
        try {
            const s = await r.call(this.service_manifest, e.service_function_arguments);
            i = JSON.stringify(s)
        } catch (e) {
            console.error(e), t.writeHead(500)
        }
        t.writeHead(200), t.write(i)
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
        let s, n;
        try {
            const e = JSON.parse(r);
            s = e.service_function, n = e.arguments
        } catch (e) {
            "" != r && console.error(e)
        }
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
            service_function_name: s,
            service_function_arguments: n,
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
                if (this.logging && console.log("[32m", "Check", e.method, "request", e.pathname, "[0m"), e.accepted) return !0;
                t.writeHead(406, {
                    Accept: ["application/json"]
                });
                break;
            case "OPTIONS":
                this.logging && console.log("[35m", "Detected", e.method, "request", "[0m"), t.writeHead(200, {
                    "Access-Control-Request-Methods": "OPTIONS",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                });
                break;
            default:
                t.writeHead(405, {
                    Allow: "OPTIONS,POST"
                })
        }
    }
    isAuthorized(e, {
        user: t,
        password: r
    } = {}) {
        return !0
    }
    startServer(e, t) {
        const r = require("http2");
        if (!(t.pfx || t.cert && t.key)) {
            console.warn("insufficient security provided; not using https", t);
            const i = r.createServer(t, this.handleRequest.bind(this));
            return i.listen(e || 9600), i
        }
        const i = r.createSecureServer(t, this.handleRequest.bind(this));
        return i.listen(e || 9600), i
    }
}
exports.default = ServiceProvider;