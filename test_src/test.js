process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import ServiceProvider from "../build/ServiceProvider.js";
import * as service_manifest from "./service_manifest.js";
import fs from "fs";
import http2 from "http2";
const options = {
    key: fs.readFileSync("test/certificate/key.pem"),
    cert: fs.readFileSync("test/certificate/certificate.pem"),
    allowHTTP1: true,
    enablePush: true
};
const test_port = 9600;
describe("Server setup", () => {
    const service_provider = new ServiceProvider(service_manifest);
    console.log("start server");
    const server = service_provider.startServer(test_port, options);
    // TODO: create CA instead of TLS_REJECT_UNAUTHORIZED
    const client = http2.connect("https://localhost:" + test_port, {
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