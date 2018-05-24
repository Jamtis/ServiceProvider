export default async (service_wrapper, request_data, response) => {
    const requests = new Map;
    const response_data = {};
    const parameters = request_data.body_parameters;
    for (const property in parameters) {
        console.log("hpusr::request", property);
        let service_function;
        let service_provider;
        try {
            service_provider = await service_wrapper;
            service_function = service_provider[property];
        } catch (error) {
            console.error(error);
        }
        if (typeof service_function === "function") {
            console.log("\x1b[34m", "call", property, "with", parameters[property], "\x1b[0m");
            try {
                requests.set(property, service_function.call(service_provider, parameters[property]));
            } catch (error) {
                console.error(error);
                if (e instanceof Error) {
                    response_data[property] = {
                        status: 500,
                        reason: "Service function failed"
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
    // console.log("hpusr::all service requests fired");
    for (const [property, request] of requests) {
        console.log("hpusr::property", property);
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
};