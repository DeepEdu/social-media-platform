const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  const exp = Date.parse(new Date(req.cookies.expires));
  // check if token is provided or not
  if (!token) {
    const error = new Error("A token is required for authentication");
    error.status = 403;
    return next(error);
  }
  // Check if the token is expired
  if (exp < Date.now()) {
    const error = new Error("Token has expired");
    error.status = 401;
    return next(error);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.id = decoded.id;
  } catch (err) {
    console.log(err);
    const error = new Error("Invalid Token");
    error.status = 401;
    return next(error);
  }
  return next();
};

module.exports = verifyToken;
