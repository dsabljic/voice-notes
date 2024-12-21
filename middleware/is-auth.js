const jwt = require("jsonwebtoken");
require("dotenv").config();

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
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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
