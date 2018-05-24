console.log("\n".repeat(1e2));
import http from "http";
import createServiceProvider from "./createServiceProvider.js";
const _service_provider = {
    test_function(argument) {
        console.log("test", argument);
        return "return " + argument;
    }
};
const service_provider = createServiceProvider({}, _service_provider);
http.createServer(service_provider.requestHandler).listen(3000);
console.log("Server listening on 3000");