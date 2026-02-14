let requests = {};

module.exports = (req, res, next) => {
  const ip = req.ip;
  requests[ip] = (requests[ip] || 0) + 1;

  if (requests[ip] > 100) {
    return res.status(429).json({ message: "Too many requests" });
  }

  setTimeout(() => {
    requests[ip] = 0;
  }, 60000);

  next();
};
