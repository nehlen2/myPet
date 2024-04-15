const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { findUserByEmail } = require("../repository/repo.js");


const Validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let error = {};
    errors.array().map((err) => (error[err.param] = err.msg));
    return res.status(422).json({ error });
  }
  next();
};
exports.Validate;

const SECRET_ACCESS_TOKEN = "secret"
exports.Verify = function (req, res, next) {
  try {
    const authHeader = req.headers["cookie"]; // get the session cookie from request header

    if (!authHeader) return res.sendStatus(401); // if there is no cookie from request header, send an unauthorized response.
    const cookie = authHeader.split("=")[1].split(";")[0]; // If there is, split the cookie string to get the actual jwt
    // Verify using jwt to see if token has been tampered with or if it has expired.
    // that's like checking the integrity of the cookie
    jwt.verify(cookie, SECRET_ACCESS_TOKEN, async (err, decoded) => {
      if (err) {
        // if token has been altered or has expired, return an unauthorized error
        return res
          .status(401)
          .json({ message: err });
      }

      const { user } = decoded; // get user id from the decoded token
      const foundUSer = await findUserByEmail(user.email)// find user by that `id`
      const { password, ...data } = foundUSer.dataValues; // return user object without the password
      req.user = data; // put the data object into req.user
      next();
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      code: 500,
      data: [],
      message: "Internal Server Error",
    });
  }
};
