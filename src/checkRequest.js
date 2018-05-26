// this function checks the validity of a request
export default (request_data, response) => {
    switch (request_data.method) {
        case "POST":
            console.log("\x1b[32m", "Check", request_data.method, "request", request_data.pathname, "\x1b[0m");
            // console.log("request headers", request.headers);
            if (request_data.accepted) {
                console.log("return true");
                return true;
            }
            response.writeHead(406, {
                Accept: ["application/json"]
            });
            break;
        case "OPTIONS":
            console.log("\x1b[35m", "Detected", request_data.method, "request", "\x1b[0m");
            response.writeHead(200, {
                "Access-Control-Request-Methods": "OPTIONS",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            });
            break;
        default:
            response.writeHead(405, {
                Allow: "OPTIONS,POST"
            });
    }
};