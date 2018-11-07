"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
});
class ServiceClient {
    constructor(e, t) {
        this.url = e, this.options = t;
        const s = this;
        this.proxy = new Proxy({}, {
            get: (e, t) => s._makeRequest(t)
        })
    }
    async close() {
        return !!this.client && (await new Promise(e => {
            this.client.close(e)
        }), !0)
    }
    _makeRequest(e) {
        if ("function" == typeof fetch) this._makeRequest = this._makeRequestFetch;
        else if ("function" == typeof require) {
            const e = require("http2");
            if (!e) throw new Error("Neither fetch nor http2 available");
            global.http2 = e, this._makeRequest = this._makeRequestNode
        }
        return this._makeRequest(e)
    }
    _makeRequestFetch(e) {
        const t = this;
        return async (...s) => {
            const r = await fetch(t.url, Object.assign({
                method: "POST",
                body: JSON.stringify({
                    service_function: e,
                    arguments: s
                })
            }, t.options));
            switch (r.status) {
                case 200:
                    try {
                        return await r.json()
                    } catch (e) {
                        if ("" === await r.text()) return;
                        console.warn("Response is not parsable as JSON but server sent HTTP status 200"), console.error(e);
                        break
                    }
                case 400:
                case 405:
                case 406:
                    throw new Error("Internal protocol error: HTTP status " + r.status);
                case 502:
                    throw new Error(await r.text())
            }
            throw new Error("Unknown error: HTTP status " + r.status)
        }
    }
    _makeRequestNode(e) {
        const t = this;
        return (...s) => new Promise((r, n) => {
            try {
                if (!t.client) {
                    const e = http2.connect(t.url, t.options);
                    t.client = e
                }
                const {
                    client: o
                } = t;
                o.closed && n(), o.on("error", e => {
                    n(e)
                });
                const a = o.request({
                    ":method": "POST"
                });
                a.on("response", e => {
                    200 != e[":status"] && n(new Error("Response status " + e[":status"]))
                });
                let i = "";
                a.on("data", e => {
                    i += e
                }), a.on("end", () => {
                    try {
                        const e = "" == i ? void 0 : JSON.parse(i);
                        r(e)
                    } catch (e) {
                        console.warn("Response is not parsable as JSON"), n(new Error("Unknown error"))
                    }
                }), a.write(JSON.stringify({
                    service_function: e,
                    arguments: s
                })), a.end()
            } catch (e) {
                n(e)
            }
        })
    }
}
exports.default = ServiceClient;