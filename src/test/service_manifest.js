export const test_function = ([a, b]) => {
    return a + b;
};
export const test_authorized_function = ([a, b]) => {
    return a + b;
};
export const test_throwing_function = ([a, b]) => {
    throw new Error("provoked error");
};