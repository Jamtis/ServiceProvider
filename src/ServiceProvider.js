import url from "url";
import querystring from "querystring";

/**
 * @name ServiceProvider
 * @example
 * import ServiceProvider = "node_modules/servingjs/build/ServiceProvider.js";
 * const manifest = {
 *     example_function(a,b) {
 *         return a + b;
 *     }
 * };
 * const options = {
 *     logging: false,
 *     isAuthorized() {
 *         return true; 
 *     }
 * };
 * const service_provider = new ServiceProvider(manifest, options);
 * const server = service_provider.startServer(8000);
 * // server.close();
 * @access public
 * */
export default class ServiceProvider {
    /**
     * Constructs the ServiceProvider.
     * @param {object} service_manifest - provides the service functions available via the server
     * @param {{logging: boolean, isAuthorized: function}} options - logging to console, authorization check function
     * */
    constructor(service_manifest, options = {}) {
        Object.defineProperties(this, {
            service_manifest: {
                value: service_manifest,
                enumerable: true
            }
        });
        /**
         * Determines whether the server should log to the console.
         * @type {boolean}
         * @access public
         * */
        this.logging = options.logging;
        if (typeof options.isAuthorized == "function") {
            this.isAuthorized = options.isAuthorized;
        }
    }
    /**
     * This method handles requests made to the server.
     * It analyzes the incoming request and responds with the appropriate HTTP status.
     * It is meant to be the direct callback of 'createServer'.
     * @param {http.IncomingMessage} request - given by the 'request'-event of the server
     * @param {http.ServerResponse} response - given by the 'request'-event of the server
     * @access public
     * */
    async handleRequest(request, response) {
        try {
            // analyze request
            const request_data = await this.analyzeRequest(request);
            if (this.logging) {
                console.log("request analyzed", request_data);
            }
            // check if request is accepted
            if (this.checkRequest(request_data, response)) {
                // check if requested service function is present
                if (this.hasServiceFunction(request_data)) {
                    // check if request is authorized
                    if (this.isAuthorized(request_data.service_function_name, request_data.authorization)) {
                        // call service functions
                        await this.invokeServiceFunction(request_data, response);
                    } else {
                        if (request_data.authorization.user) {
                            // invalid authorization provided
                            response.writeHead(403);
                        } else {
                            // no authorization provided but required
                            response.writeHead(401, {
                                "WWW-Authenticate": "Basic " + request_data.service_function_name
                            });
                        }
                    }
                } else {
                    response.writeHead(501);
                }
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
    /**
     * This method is called when a request is valid and authorized and the requested service function exists.
     * It invokes the requested service function and writes the result to the response body.
     * @param {Object} request_data - analyzed representation of the request
     * @param {http.ServerResponse} response - given by the 'request'-event of the server
     * @access protected
     * */
    async invokeServiceFunction(request_data, response) {
        const service_function = this.service_manifest[request_data.service_function_name];
        if (this.logging) {
            console.log("\x1b[34m", "call", request_data.service_function_name, "with", ...request_data.service_function_arguments, "\x1b[0m");
        }
        let response_string = "{}";
        try {
            const response_value = await service_function.apply(this.service_manifest, request_data.service_function_arguments);
            response_string = JSON.stringify(response_value) || "";
            response.writeHead(200);
            if (this.logging) {
                console.log("response_string", response_string);
            }
            response.write(response_string);
        } catch (error) {
            try {
                response.writeHead(502);
                response.write(error.message);
            } catch (error) {
                console.error(error);
            }
        }
    }
    /**
     * This method analyzes requests made to the server.
     * It preprocesses the request to extract essential information.
     * @param {http.IncomingMessage} request - given by the 'request'-event of the server
     * @access protected
     * @return {Object} - a representation of the  essential request properties
     * */
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
        } catch (error) {}
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
    /**
     * This method is called when a request is analyzed.
     * It handles the HTTP negotiations.
     * @param {Object} request_data - analyzed representation of the request
     * @param {http.ServerResponse} response - given by the 'request'-event of the server
     * @access protected
     * @return {boolean} true - if and only if a POST request is accepted and well-formed
     * */
    checkRequest(request_data, response) {
        switch (request_data.method) {
            case "POST":
                if (this.logging) {
                    console.log("\x1b[32m", "Check", request_data.method, "request", request_data.pathname, "\x1b[0m");
                }
                if (request_data.service_function_name === undefined
                    || request_data.service_function_arguments != undefined
                    && !Array.isArray(request_data.service_function_arguments)) {
                    response.writeHead(400);
                    break;
                }
                // console.log("request headers", request.headers);
                if (request_data.accepted) {
                    return true;
                } else {
                    response.writeHead(406, {
                        Accept: ["application/json"]
                    });
                }
                break;
            case "OPTIONS":
                if (this.logging) {
                    console.log("\x1b[35m", "Detected", request_data.method, "request", "\x1b[0m");
                }
                response.writeHead(200, {
                    "Access-Control-Request-Methods": "OPTIONS",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization"
                });
                break;
            default:
                response.writeHead(405, {
                    Allow: "OPTIONS,POST"
                });
        }
        return false;
    }
    /**
     * This method is called to determine whether a request shall be authorized.
     * This is the default setting which authorizes all request.
     * It is meant o be overwritten when necessary either by class extension or by the constructor 'options'
     * @param {string} service_function_name - name or the requested service function
     * @param {{user: string, password: string}} credentials - credentials to authorize request
     * @access protected
     * @return {boolean} true - if and only if the request is authorized
     * */
    isAuthorized(service_function_name, {user, password} = {}) {
        // no authorization required by default
        return true;
    }
    /**
     * This method is called to determine whether a service function exists.
     * It checks if the manifest has a property which matches the service function's name and if it's a function.
     * @param {Object} request_data - analyzed representation of the request
     * @access protected
     * @return {boolean} true - if and only if the requested service function exists (and is a function)
     * */
    hasServiceFunction(request_data) {
        let service_function;
        try {
            service_function = this.service_manifest[request_data.service_function_name];
        } catch (error) {
            console.error(error);
        }
        return typeof service_function == "function";
    }
    /**
     * This method provides a convenient way to start a server which uses this 'ServiceProvider'.
     * If a certificate is provided then the server uses HTTPS otherwise HTTP.
     * @param {number} port - the servers port
     * @param {Object} options - passed to the http 'createServer' function
     * @access public
     * @return {http.Http2Server|http.Http2SecureServer} server - the started server instance
     * */
    startServer(port, options = {}) {
        const http2 = require("http2");
        if (!options.pfx && (!options.cert || !options.key)) {
            console.warn("insufficient security provided; not using https");
            const server = http2.createServer(options, this.handleRequest.bind(this));
            server.listen(port);
            return server;
        }
        const server = http2.createSecureServer(options, this.handleRequest.bind(this));
        server.listen(port);
        return server;
    }
};