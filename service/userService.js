const { findUserByEmail, createUser } = require("../repository/repo");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');



exports.login = async function (email, password) {
  const user = await findUserByEmail(email);
  if (user !== undefined && user !== null) {
    const isPasswordValid = await bcrypt.compare(password,user.password);
    console.log(isPasswordValid);
    return isPasswordValid ? user : null;
  } else {
    console.error("User not found");
  }
};

exports.register = async function (name, email, password, role) {
  let userFound = await findUserByEmail(email);

  if (userFound !== null) {
    console.error("User already registred");
  } else {
    let created = await createUser(name, email, password, role);
    return created;
  }
};

const SECRET_ACCESS_TOKEN = "secret"
exports.generateAccessJWT = function (user) {
    let payload = {
      user: user,
    };
    return jwt.sign(payload, SECRET_ACCESS_TOKEN, {
      expiresIn: '20m',
    });
  };