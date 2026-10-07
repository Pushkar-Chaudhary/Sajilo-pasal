function serverError(res, message, error, status = 500) {
  if (error) {
    console.error(`${message}:`, error.message);
  }

  return res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { error: error?.message })
  });
}

module.exports = { serverError };
