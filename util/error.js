exports.throwError = (status, message, next) => {
    const error = new Error(message);
    error.status = status;
    return next(error);
}