import url from "url";
import querystring from "querystring";

export default class ServiceProvider {
    constructor(service_manifest, options = {}) {
        Object.defineProperties(this, {
            service_manifest: {
                value: service_manifest,
                enumerable: true
            }
        });
        this.logging = options.logging;
    }
    async handleRequest(request, response) {
        try {
            // analyze request
            const request_data = await this.analyzeRequest(request);
            if (this.logging) {
                console.log("request analyzed", request_data);
            }
            // check validity
            if (this.checkRequest(request_data, response)) {
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
            // console.log("service_function", property);
            let service_function;
            try {
                service_function = this.service_manifest[property];
            } catch (error) {
                console.error(error);
            }
            if (typeof service_function === "function") {
                // console.log("\x1b[34m", "call", property, "with", parameters[property], "\x1b[0m");
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
            // console.log("isf::property", property);
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
    async analyzeRequest(request) {
        const url_object = url.parse(request.url);
        let data = "";
        request.on("data", chunk => {
            data += chunk.toString();
        });
        await new Promise((resolve, reject) => {
            request.on("end", error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        const query_parameters = querystring.parse(url_object.query);
        for (const parameter in query_parameters) {
            query_parameters[parameter] = decodeURIComponent(query_parameters[parameter]);
        }
        let body_parameters = {};
        // console.log("analyzeRequest::parse", data);
        try {
            body_parameters = JSON.parse(data);
            // console.log("analyzeRequest::parse", body_parameters);
        } catch (error) {
            if (data != "") {
                console.error(error);
            } else {
                // console.log("ar:: empty request body");
            }
        }
        const accepted = !request.headers.accept || /(application\/(json|\*)|\*\/\*)/g.test(request.headers.accept);
        return {
            method: request.method,
            headers: request.headers,
            pathname: url_object.pathname,
            data,
            query_parameters,
            body_parameters,
            accepted
        }
    }
    checkRequest(request_data, response) {
        switch (request_data.method) {
            case "POST":
                if (this.logging) {
                    console.log("\x1b[32m", "Check", request_data.method, "request", request_data.pathname, "\x1b[0m");
                }
                // console.log("request headers", request.headers);
                if (request_data.accepted) {
                    return true;
                }
                response.writeHead(406, {
                    Accept: ["application/json"]
                });
                break;
            case "OPTIONS":
                if (this.logging) {
                    console.log("\x1b[35m", "Detected", request_data.method, "request", "\x1b[0m");
                }
                response.writeHead(200, {
                    "Access-Control-Request-Methods": "OPTIONS",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                });
                break;
            default:
                response.writeHead(405, {
                    Allow: "OPTIONS,POST"
                });
        }
    }
    startServer(port, options) {
        const http2 = require("http2");
        if (!options.pfx && (!options.cert || !options.key)) {
            console.warn("insufficient security provided; not using https", options);
            const server = http2.createServer(options, this.handleRequest.bind(this));
            server.listen(port || 9600);
            return server;
        }
        const server = http2.createSecureServer(options, this.handleRequest.bind(this));
        server.listen(port || 9600);
        return server;
    }
};