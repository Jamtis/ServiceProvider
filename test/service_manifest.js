"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const test_function = exports.test_function = ([a, b]) => {
    return a + b;
};
const test_authorized_function = exports.test_authorized_function = ([a, b]) => {
    return a + b;
};
const test_throwing_function = exports.test_throwing_function = ([a, b]) => {
    throw new Error("provoked error");
};