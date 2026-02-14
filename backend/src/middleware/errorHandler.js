module.exports = (err, req, res, next) => {
  // Log full stack when available for easier debugging
  if (err && err.stack) console.error("❌ ERROR:", err.stack);
  else console.error("❌ ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
