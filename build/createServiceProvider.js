"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _distributeRequest = require("./distributeRequest.js");

var _distributeRequest2 = _interopRequireDefault(_distributeRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (configuration, service_provider) => {
    const service_wrapper = (async () => Object.assign({}, (await service_provider)))();
    return {
        serviceProviderPromise: service_wrapper,
        requestHandler: _distributeRequest2.default.bind(null, configuration, service_wrapper)
    };
};