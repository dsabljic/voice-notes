const jwt = require("jsonwebtoken");

const { throwError } = require("../util/error");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    console.error("No authorization header");
    return throwError(401, "Unauthorized", next);
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "jtJP5RzWFqtFvEVsCm9lFtDzxO1vu0");
  } catch (err) {
    console.error("Invalid token:", err);
    return throwError(401, "Invalid token", next);
  }
  if (!decodedToken) {
    console.error("Invalid token");
    return throwError(401, "Invalid token", next);
  }
  req.userId = decodedToken.userId;
  next();
};
