/**
 * @name ServiceClient
 * @example
 * import ServiceClient from "node_modules/servingjs/build/ServiceClient.js";
 * const service_provider = new ServiceClient("http://localhost:8000");
 * const result = await service_client.proxy.example_function(3, 39);
 * // client.close(); // (Node.js only)
 * @access public
 * */
export default class ServiceClient {
    /**
     * Constructs the ServiceClient.
     * @param {string} url - service provider location
     * @param {object} options - passed to http2.connect|fetch
     * */
    constructor(url, options) {
        /**
         * Specifies the service provider's location.
         * @type {string}
         * @access protected
         * */
        this.url = url;
        /**
         * Specifies the service provider's location.
         * @type {object}
         * @access protected
         * */
        this.options = options;
        const service_client = this;
        /**
         * Provides a proxy to adress service functions like object properties.
         * @type {Proxy}
         * @access public
         * */
        this.proxy = new Proxy({}, {
            get(target, property_name) {
                return service_client._makeRequest(property_name);
            }
        });
    }
    /**
     * This method closes the http2 client on Node.js.
     * In a browser context this method does nothing.
     * @return {boolean} true - on Node.js
     * @access public
     * */
    async close() {
        if (this.client) {
            await new Promise(resolve => {
                this.client.close(resolve);
            });
            return true;
        } else {
            return false;
        }
    }
    /**
     * This method replaces itself a the first invocation with either the `_makeRequestFetch` or the `_makeRequestNode` method according to the context.
     * Subsequently calls the replacing method.
     * @param {string} service_function_name - name of the requested service function
     * @return {*} response_value - response from the requested service function
     * @access protected
     * */
    _makeRequest(service_function_name) {
        // overwrite this method at the first invocation
        if (typeof fetch == "function") {
            this._makeRequest = this._makeRequestFetch;
        } else if (typeof require == "function") {
            const http2 = require("http2");
            if (http2) {
                global.http2 = http2;
                this._makeRequest = this._makeRequestNode;
            } else {
                throw new Error("Neither fetch nor http2 available");
            }
        }
        return this._makeRequest(service_function_name);
    }
    /**
     * This method make the network request when `fetch` is available.
     * @param {string} service_function_name - name of the requested service function
     * @return {*} response_value - response from the requested service function
     * @access protected
     * */
    _makeRequestFetch(service_function_name) {
        const service_client = this;
        return async (..._arguments) => {
            const response = await fetch(service_client.url, Object.assign({
                method: "POST",
                body: JSON.stringify({
                    service_function: service_function_name,
                    arguments: _arguments
                })
            }, service_client.options));
            if (response.status == 200) {
                try {
                    return await response.json();
                } catch (error) {
                    if (await response.text() === "") {
                        return undefined;
                    } else {
                        console.warn("Response is not parsable as JSON but server sent HTTP status 200");
                        console.error(error);
                    }
                }
            } else {
                switch (response.status) {
                    case 400:
                    case 405:
                    case 406:
                        throw new Error("Internal protocol error: HTTP status " + response.status);
                    case 502:
                        throw new Error(await response.text());
                }
            }
            throw new Error("Unknown error: HTTP status " + response.status);
        };
    }
    /**
     * This method make the network request when `http2` is available (on Node.js).
     * @param {string} service_function_name - name of the requested service function
     * @return {*} response_value - response from the requested service function
     * @access protected
     * */
    _makeRequestNode(service_function_name) {
        const service_client = this;
        return (..._arguments) => new Promise((resolve, reject) => {
            try {
                if (!service_client.client) {
                    const client = http2.connect(service_client.url, service_client.options);
                    service_client.client = client;
                }
                const {client} = service_client;
                if (client.closed) {
                    reject();
                }
                client.on("error", error => {
                    reject(error);
                });
                const request = client.request({
                    ":method": "POST"
                });
                request.on("response", headers => {
                    if (headers[":status"] != 200) {
                        reject(new Error("Response status " + headers[":status"]));
                    }
                });
                let data = "";
                request.on("data", chunk => {
                    data += chunk;
                });
                request.on("end", () => {
                    try {
                        const value = JSON.parse(data);
                        resolve(value);
                    } catch (error) {
                        console.warn("Response is not parsable as JSON");
                        reject(new Error("Unknown error"));
                    }
                });
                request.write(JSON.stringify({
                    service_function: service_function_name,
                    arguments: _arguments
                }));
                request.end();
            } catch (error) {
                reject(error);
            }
        });
    };
}