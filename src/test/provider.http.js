import {strict as assert} from "assert";
import ServiceProvider from "../build/ServiceProvider.js";
import * as service_manifest from "./service_manifest.js";
import http2 from "http2";
import https from "https";
import http from "http";
import test_function from "./test_function_declaration.js";
describe("HTTP provider setup", () => {
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
                    const value = JSON.parse(data);
                    assert.equal(value, test_function.result);
                    done();
                });
            }
            request.write(JSON.stringify({
                service_function: test_function.name,
                arguments: test_function.arguments
            }));
            request.end();
        });
        it("GET not allowed", done => {
            const request = client.request({
                ":method": "GET"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                assert.equal(headers[":status"], 405);
                assert.equal(headers["allow"], "OPTIONS,POST");
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
                assert.equal(headers[":status"], 405);
                assert.equal(headers["allow"], "OPTIONS,POST");
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
                assert.equal(headers[":status"], 405);
                assert.equal(headers["allow"], "OPTIONS,POST");
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
                assert.equal(headers[":status"], 501);
                done();
            });
            request.write(JSON.stringify({
                service_function: test_function.unimplemented_name
            }));
            request.end();
        });
        it("POST throwing function returns 502", done => {
            const request = client.request({
                ":method": "POST"
            });
            request.on("response", headers => {
                // console.log("server response headers", headers);
                assert.equal(headers[":status"], 502);
                done();
            });
            request.write(JSON.stringify({
                service_function: test_function.throwing_name
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