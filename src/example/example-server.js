import ServiceProvider from "../ServiceProvider.js";
import * as service_manifest from "../../test/service_manifest.js";
import fs from "fs";
const options = {
    // key: fs.readFileSync("test/certificate/root-ca.key"),
    // passphrase: "password",
    // cert: fs.readFileSync("test/certificate/root-ca.crt"),
    allowHTTP1: true,
    enablePush: true
};
const test_port = 3000;
const service_provider = new ServiceProvider(service_manifest, {logging: true});
const server = service_provider.startServer(test_port, options);
server.on("stream", (stream, headers) => {
    console.log("here", headers);
});
import http2 from "http2";
const unauthorized_client = http2.connect("http://localhost:" + test_port, {
    // ca: fs.readFileSync("test/certificate/root-ca.crt")
});
unauthorized_client.on("error", error => {
    console.error(error);
});
const request = unauthorized_client.request({
    ":method": "POST"
});
request.on("end", response => {
    console.timeEnd("ping");
});
request.write(JSON.stringify({
    test_function: [3, 39]
}));
console.time("ping");
request.end();