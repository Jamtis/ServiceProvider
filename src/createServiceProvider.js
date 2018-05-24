import distributeRequest from "./distributeRequest.js";
export default (configuration, service_provider) => {
    const service_wrapper = (async () => Object.assign({}, await service_provider))();
    return {
        serviceProviderPromise: service_wrapper,
        requestHandler: distributeRequest.bind(null, configuration, service_wrapper)
    };
};