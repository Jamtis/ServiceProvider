# ServiceProvider

### Idea
Specify functions in a manifest file (or just an object) and make it available via a Node.js server.

```const ServiceProvider = require("node_modules/servingjs/build/ServiceProvider.js").default;
const manifest = {
    // specify your functionality here
    example_function(a, b) {
        console.log("called with", a, b);
        return a + b;
    }
};
const service_provider = new ServiceProvider(manifest, {logging: true});
const server = service_provider.startServer(8000);
```

Now `service_function` is available in the entire network.
You can simply invoke it by making a request to the server.

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
    console.log("result of service_function", data);
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

[View the documentation.](https://github.com/jamtis/serviceprovider/blob/master/docs/index.html)

### LICENSE

ISC License