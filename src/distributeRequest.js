import handleRequest from "./handleRequest.js";
import analyzeRequest from "./analyzeRequest.js";
export default async ({allowedOrigin = "*"}, service_wrapper, request, response) => {
    try {
        response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        const request_data = await analyzeRequest(request);
        console.log("receive raw request", request_data);
        if (!request_data.accepted) {
            response.writeHead(406, {
                Accept: ["application/json"]
            });
            return;
        }
        switch (request.method) {
            case "OPTIONS":
                console.log("\x1b[35m", "Distribute", request.method, "request", "\x1b[0m");
                response.writeHead(200, {
                    "Access-Control-Request-Methods": "OPTIONS",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                });
                response.end();
                break;
            case "POST":
                console.log("\x1b[32m", "Distribute", request.method, "request", request_data.pathname, "\x1b[0m");
                // console.log("request headers", request.headers);
                await handleRequest(service_wrapper, request_data, response);
                break;
            default:
                response.writeHead(405, {
                    Allow: "OPTIONS,POST"
                });
                response.end();
        }
    } catch (e) {
        console.error(e);
        response.writeHead(500, {
            reason: e.message
        });
        response.write('{"status":"Service failed unexpectedly"}');
        response.end();
    }
};