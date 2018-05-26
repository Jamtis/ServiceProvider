"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const test_function = exports.test_function = ([a, b]) => {
    console.log("server log test_function");
    return a + b;
};