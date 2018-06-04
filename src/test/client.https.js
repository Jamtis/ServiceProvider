import {strict as assert} from "assert";
import ServiceProvider from "../build/ServiceProvider.js";
import ServiceClient from "../build/ServiceClient.js";
import * as service_manifest from "./service_manifest.js";
import fs from "fs";
import http2 from "http2";
import https from "https";
import http from "http";
import test_function from "./test_function_declaration.js";
describe("Client HTTPS setup", () => {
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
    const test_port = 9603;
    const service_provider = new ServiceProvider(service_manifest, {logging: false});
    const server = service_provider.startServer(test_port, options);
    server.on("error", error => {
        assert.fail(error.message);
    });
    const client = new ServiceClient("https://localhost:" + test_port, {
            ca: cert
        });
    it("Request succeeds (Node.js)", async () => {
        const result = await client.proxy[test_function.name](...test_function.arguments);
        assert.equal(result, test_function.result);
    });
    it("Request succeeds (fetch)", async () => {
        const agent = https.Agent({
            key,
            cert,
            ca: cert,
            passphrase: "password"
        });
        const client = new ServiceClient("https://localhost:" + test_port, {
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
        const result = await client.proxy[test_function.name](...test_function.arguments);
        assert.equal(result, test_function.result);
    });
    after(async () => {
        await client.close();
        server.close();
    });
});