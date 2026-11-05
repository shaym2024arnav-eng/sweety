/** An error that should be sent to the client with a specific HTTP status. */
class AppError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

const badRequest = (message, field) => new AppError(400, message, field);
const conflict = (message, field) => new AppError(409, message, field);
const notFound = (message = 'Not found.') => new AppError(404, message);
const unauthorized = (message = 'Please log in to continue.') => new AppError(401, message);

module.exports = { AppError, badRequest, conflict, notFound, unauthorized };
