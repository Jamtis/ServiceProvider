import url from "url";
import querystring from "querystring";
export default async request => {
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
    let body_parameters = {};
    // console.log("analyzeRequest::parse", data);
    try {
        body_parameters = JSON.parse(data);
        // console.log("analyzeRequest::parse", body_parameters);
    } catch (error) {
        if (data != "") {
            console.error(error);
        } else {
            // console.log("ar:: empty request body");
        }
    }
    const accepted = !request.headers.accept || /(application\/(json|\*)|\*\/\*)/g.test(request.headers.accept);
    return {
        method: request.method,
        headers: request.headers,
        pathname: url_object.pathname,
        data,
        query_parameters,
        body_parameters,
        accepted
    }
};