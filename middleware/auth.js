const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  console.log("--------");
  const token = req.cookies.token;

  if (!token) {
    console.log(token);
    console.log("--------");
    return res.status(403).send("A token is not required for authentication");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.id = decoded.id;
    // Check if the token is expired

    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).send("Token has expired");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send("Invalid Token ");
  }
  return next();
};

module.exports = verifyToken;
