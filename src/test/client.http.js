import {strict as assert} from "assert";
import ServiceProvider from "../build/ServiceProvider.js";
import ServiceClient from "../build/ServiceClient.js";
import * as service_manifest from "./service_manifest.js";
import http2 from "http2";
import https from "https";
import http from "http";
import test_function from "./test_function_declaration.js";
describe("Client HTTP setup", () => {
    const options = {
        allowHTTP1: true,
        enablePush: true
    };
    const test_port = 9602;
    const service_provider = new ServiceProvider(service_manifest, {logging: false});
    const server = service_provider.startServer(test_port, options);
    server.on("error", error => {
        assert.fail(error.message);
    });
    const client = new ServiceClient("http://localhost:" + test_port);
    it("Request succeeds (Node.js)", async () => {
        const result = await client.proxy[test_function.name](...test_function.arguments);
        assert.equal(result, test_function.result);
    });
    it("Request fails (fetch)", () => {
        const client = new ServiceClient("http://localhost:" + test_port);
        // rebuild client._makeRequestFetch because fetch is not available in its context
        let function_string = client._makeRequestFetch.toString();
        if (!/^(.*?)\((.*)\)\s(?:=>\s)/.test(function_string) && !function_string.startsWith("function")) {
            function_string = "function " + function_string;
        }
        // console.log("function_string", function_string);
        const fetch = require("node-fetch");
        client._makeRequest = new Function("fetch", "return " + function_string)(fetch);
        // console.log("_makeRequest", client._makeRequest);
        assert.rejects(client.proxy[test_function.name](...test_function.arguments));
    });
    after(() => {
        client.close();
        server.close();
    });
});