const C = { GET: '\x1b[32m', POST: '\x1b[33m', PUT: '\x1b[34m', DELETE: '\x1b[31m', RESET: '\x1b[0m', DIM: '\x1b[2m' };

export function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const color = C[req.method] || '\x1b[37m';
    const statusColor = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${color}${req.method.padEnd(6)}${C.RESET} ${C.DIM}${req.path}${C.RESET} ${statusColor}${res.statusCode}${C.RESET} ${C.DIM}${Date.now() - start}ms${C.RESET}`);
  });
  next();
}
