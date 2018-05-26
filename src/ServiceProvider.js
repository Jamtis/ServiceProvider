import analyzeRequest from "./analyzeRequest.js";
import checkRequest from "./checkRequest.js";
export default class ServiceProvider {
    constructor(service_manifest) {
        Object.defineProperties(this, {
            service_manifest: {
                value: service_manifest,
                enumerable: true
            }
        });
    }
    async handleRequest(request, response) {
        try {
            // analyze request
            const request_data = await analyzeRequest(request);
            console.log("request analyzed", request_data);
            // check validity
            if (checkRequest(request_data, response)) {
                // console.log("going to invoke sf");
                // call service functions
                await this.invokeServiceFunctions(request_data, response);
            } else {
                // console.log("not going to invoke sf");
                // return HTTP status
            }
        } catch (error) {
            console.error(error);
        } finally {
            try {
                response.end();
            } catch (error) {
                console.error(error);
            }
        }
    }
    async invokeServiceFunctions(request_data, response) {
        const requests = new Map;
        const response_data = {};
        const parameters = request_data.body_parameters;
        // check if service functions exists and execute
        for (const property in parameters) {
            console.log("service_function", property);
            let service_function;
            try {
                service_function = this.service_manifest[property];
            } catch (error) {
                console.error(error);
            }
            if (typeof service_function === "function") {
                console.log("\x1b[34m", "call", property, "with", parameters[property], "\x1b[0m");
                try {
                    requests.set(property, service_function.call(this.service_manifest, parameters[property]));
                } catch (error) {
                    console.error(error);
                    if (error instanceof Error) {
                        response_data[property] = {
                            status: 500,
                            reason: "Service function encountered an error"
                        };
                    } else {
                        response_data[property] = error;
                    }
                }
            } else {
                response_data[property] = {
                    status: 501,
                    reason: "Service not implemented"
                }
            }
        }
        // console.log("isf", "all service requests fired");
        // await results parallely
        for (const [property, request] of requests) {
            console.log("isf::property", property);
            try {
                response_data[property] = {
                    status: 200,
                    value: await request
                };
            } catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    response_data[property] = {
                        status: 500,
                        reason: "unknown"
                    };
                } else {
                    response_data[property] = error;
                }
            }
        }
        // console.log("hpusr::all service requests resolved");
        response.writeHead(200, {});
        response.write(JSON.stringify(response_data));
        response.end();
    }
    startServer(port, options) {
        const http2 = require("http2");
        if (!options.pfx && (!options.cert || !options.key)) {
            console.warn("insufficient security provided; not using https");
            const server = http2.createServer(options, this.handleRequest.bind(this));
            server.listen(port || 9600);
            return server;
        }
        const server = http2.createSecureServer(options, this.handleRequest.bind(this));
        server.listen(port || 9600);
        return server;
    }
};