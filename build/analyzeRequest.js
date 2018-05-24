"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _querystring = require("querystring");

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async request => {
    const url_object = _url2.default.parse(request.url);
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
    const query_parameters = _querystring2.default.parse(url_object.query);
    for (const parameter in query_parameters) {
        query_parameters[parameter] = decodeURIComponent(query_parameters[parameter]);
    }
    let body_parameters = {};
    // console.log("analyzeRequest::parse", data);
    try {
        body_parameters = JSON.parse(data);
        // console.log("analyzeRequest::parse", body_parameters);
    } catch (e) {
        if (data != "") {
            console.error(e);
        } else {
            // console.log("ar:: empty request body");
        }
    }
    const accepted = !request.headers.accept || request.headers.accept.match(/(application\/(json|\*)|\*\/\*)/g);
    return {
        method: request.method,
        headers: request.headers,
        pathname: url_object.pathname,
        data,
        query_parameters,
        body_parameters,
        accepted
    };
};