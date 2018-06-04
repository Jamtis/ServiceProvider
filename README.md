# ServiceProvider

### RPC provider on Node.js
Specify functions in a manifest file (or just an object) and make it available via a Node.js server.

```
import ServiceProvider = "node_modules/servingjs/build/ServiceProvider.js";
// declare the manifest
const manifest = {
    // specify your functionality here
    example_function(a, b) {
        console.log("called with", a, b);
        return a + b;
    }
};
// construct the provider
const service_provider = new ServiceProvider(manifest, {logging: true});
// create and start server
const server = service_provider.startServer(8000);
```

Now `service_function` is available in the entire network.
You can simply invoke it by making a request to the server.

```
import ServiceClient from "node_modules/servingjs/build/ServiceClient.js";
// construct the client
const service_client = new ServiceClient("http:localhost:8000");
// request the example_function
const result = await service_client.proxy.example_function(3, 39);
// reap the results
console.log("result of example_function", result);
// close the client's connection (only necessary on Node.js)
service_client.close();
```
or build the request yourself
```
const http2 = require("http2");
// connect
const client = http2.connect("http://localhost:8000");
// create a request
const request = client.request({
    ":method": "POST"
});
// collect the response data
let data = "";
request.on("data", chunk => {
    data += chunk;
});
request.on("end", () => {
    // reap the results
    console.log("result of example_function", data);
});
// specify the requested function
request.write(JSON.stringify({
    service_function: "example_function",
    arguments: [3, 39]
}));
// send the request
request.end();
```

Easy as that.

### Installation

`npm i servingjs`

### Features

+ http2 (experimental by nodejs)
+ server certificates
+ POST request are encrypted when using HTTPS
+ CORS (working on it)

### Docs

[View the documentation.](https://rawgit.com/Jamtis/ServiceProvider/master/docs/index.html)

### LICENSE

ISC License