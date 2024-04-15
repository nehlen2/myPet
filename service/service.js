const { findUserByEmail, createUser, createSlot, bookSlot, acceptBookig, findAllUsers, findSlotsBySitter } = require("../repository/repo");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');



exports.login = async function (email, password) {
  const user = await findUserByEmail(email);
  if (user !== undefined && user !== null) {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    delete user.dataValues.password;
    return isPasswordValid ? user.dataValues : null;
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
    delete created.dataValues.password;
    return created.dataValues;
  }
};

const SECRET_ACCESS_TOKEN = "secret"
exports.generateAccessJWT = function (user) {
    let payload = {
      user: user,
    };
    return jwt.sign(payload, SECRET_ACCESS_TOKEN);
  }

  exports.createSlot = async function (sitter, beginDateTime, endDateTime) {
    try {
      return await createSlot(sitter, beginDateTime, endDateTime);
    } catch (error) {
      console.error("service could not create slot")
    }
  }
  exports.bookSlot = async function (user, slotId) {
    try {
      return await bookSlot(user, slotId);
    } catch (error) {
      console.error("Service could not book slot")
    }
  }

  exports.acceptBooking = async function (slotId) {
    try {
      return await acceptBookig(slotId);
    } catch (error) {
      console.error("Service could not book slot")
    }
  }

  exports.getAllUsers = async () => {
    try {
      let users = await findAllUsers();
      return users;
    } catch(error) {
      console.error("Service could not get users")
    }
  }

  exports.getSlotsBySitter = async (sitterId) => {
    try {
      let bookings = await findSlotsBySitter(sitterId);
      return bookings;
    } catch(error) {
      console.error("Service could not get users")
    }
  }