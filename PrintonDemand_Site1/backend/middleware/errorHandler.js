export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  console.error(`\x1b[31m[ERROR ${status}]\x1b[0m ${req.method} ${req.path} — ${err.message}`);
  if (err.printifyError) console.error('  Printify:', JSON.stringify(err.printifyError));
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
