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
        if (typeof options.isAuthorized == "function") {
            this.isAuthorized = options.isAuthorized;
        }
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
                let service_function;
                try {
                    service_function = this.service_manifest[request_data.service_function_name];
                } catch (error) {
                    console.error(error);
                }
                if (typeof service_function === "function") {
                    if (this.isAuthorized(request_data.service_function_name, request_data.authorization)) {
                        // call service functions
                        await this.invokeServiceFunction(request_data, response);
                    } else {
                        response.writeHead(401);
                    }
                } else {
                    response.writeHead(501);
                }
            } else {
                // checkRequest already assigned the HTTP status
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
    async invokeServiceFunction(request_data, response) {
        const service_function = this.service_manifest[request_data.service_function_name];
        // console.log("\x1b[34m", "call", property, "with", parameters[property], "\x1b[0m");
        let response_string = "{}";
        try {
            const response_value = await service_function.call(this.service_manifest, request_data.service_function_arguments);
            response_string = JSON.stringify(response_value);
        } catch (error) {
            console.error(error);
            response.writeHead(500);
        }
        response.writeHead(200);
        response.write(response_string);
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
        let service_function_name, service_function_arguments;
        // console.log("analyzeRequest::parse", data);
        try {
            const body = JSON.parse(data);
            service_function_name = body.service_function;
            service_function_arguments = body.arguments;
            // console.log("analyzeRequest::parse", body_parameters);
        } catch (error) {
            if (data != "") {
                console.error(error);
            } else {
                // console.log("ar:: empty request body");
            }
        }
        const accepted = !request.headers.accept || /(application\/(json|\*)|\*\/\*)/g.test(request.headers.accept);
        const {authorization} = request.headers;
        let user, password;
        if (authorization) {
            const decoded_authorization = Buffer.from(authorization.match(/Basic\ (.+)/)[1], "base64").toString();
            [, user, password] = decoded_authorization.match(/^([^:]+?):(.*)$/);
        }
        return {
            method: request.method,
            headers: request.headers,
            pathname: url_object.pathname,
            data,
            query_parameters,
            service_function_name,
            service_function_arguments,
            accepted,
            authorization: {
                user,
                password
            }
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
    isAuthorized(service_function_name, {user, password} = {}) {
        // no authorization required by default
        return true;
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