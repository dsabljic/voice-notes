const multer = require("multer");

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(413).json({ error: "File size too large" });
      default:
        return res.status(400).json({ error: "File upload error" });
    }
  }

  if (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "An error occurred" });
  }

  next();
};
