import {strict as assert} from "assert";
import ServiceProvider from "../build/ServiceProvider.js";
import * as service_manifest from "./service_manifest.js";
import fs from "fs";
import http2 from "http2";
import https from "https";
import http from "http";
describe("HTTP setup", () => {
    const options = {
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9601;
    const service_provider = new ServiceProvider(service_manifest, {logging: false});
    const server = service_provider.startServer(test_port, options);
    server.on("error", error => {
        assert.fail(error.message);
    });
    const client = http2.connect("http://localhost:" + test_port, {});
    client.on("error", error => {
        assert.fail(error.message);
    });
    describe("METHOD handling", () => {
        it("OPTIONS handling", done => {
            const request = client.request({
                ":method": "OPTIONS"
            });
            request.setEncoding("utf8");
            request.on("response", headers => {
                // console.log("server response headers", headers);
                assert.equal(headers[":status"], 200);
                assert.equal(headers["access-control-allow-methods"], "POST,OPTIONS");
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.equal(data, "{}");
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.doesNotThrow(JSON.parse.bind(JSON, data));
                    const {test_function} = JSON.parse(data);
                    assert.equal(test_function.status, 200);
                    assert.equal(test_function.value, 42);
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
            const request = http.get(options, response => {
                assert.fail("HTTP1 succeeded");
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
    const key = fs.readFileSync("test/certificate/root-ca.key");
    const cert = fs.readFileSync("test/certificate/root-ca.crt");
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
    const service_provider = new ServiceProvider(service_manifest, {
        logging: false,
        isAuthorized(service_function_name, {user, password}) {
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
    const client = http2.connect("https://localhost:" + test_port, {
        ca: cert
    });
    client.on("error", error => {
        assert.fail(error.message);
    });
    describe("METHOD handling", () => {
        it("OPTIONS handling", done => {
            const request = client.request({
                ":method": "OPTIONS"
            });
            request.setEncoding("utf8");
            request.on("response", headers => {
                // console.log("server response headers", headers);
                assert.equal(headers[":status"], 200, "Status not OK");
                assert.equal(headers["access-control-allow-methods"], "POST,OPTIONS");
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.equal(data, "{}");
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.doesNotThrow(JSON.parse.bind(JSON, data));
                    const {test_function} = JSON.parse(data);
                    assert.equal(test_function.status, 200);
                    assert.equal(test_function.value, 42);
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
                ca: fs.readFileSync("test/certificate/root-ca.crt")
            };
            const request = https.request(options, response => {
                assert.equal(response.statusCode, 200);
                let data = "";
                response.on("data", chunk => {
                    data += chunk;
                });
                response.on("end", () => {
                    // console.log("request end", data);
                    assert.equal(data, "{}");
                    done();
                });
            });
            request.on("error", error => {
                assert.fail(error.message);
            });
            request.write("{}");
            request.end();
        });
    });
    describe("Security", () => {
        it("Certificate required", done => {
            const unauthorized_client = http2.connect("https://localhost:" + test_port, {});
            unauthorized_client.on("error", error => {
                assert.equal(error.message, "self signed certificate");
                assert.equal(error.code, "DEPTH_ZERO_SELF_SIGNED_CERT");
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.doesNotThrow(JSON.parse.bind(JSON, data));
                    const {test_authorized_function} = JSON.parse(data);
                    assert.equal(test_authorized_function.status, 200);
                    assert.equal(test_authorized_function.value, 42);
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
                assert.equal(headers[":status"], 200);
            });
            {
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    // console.log("request end", data);
                    assert.doesNotThrow(JSON.parse.bind(JSON, data));
                    const {test_authorized_function} = JSON.parse(data);
                    assert.equal(test_authorized_function.status, 401);
                    assert.equal(test_authorized_function.value, undefined);
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