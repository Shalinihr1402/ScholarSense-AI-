export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  res.status(status).json({
    message: error.message || "Something went wrong on the server."
  });
}
