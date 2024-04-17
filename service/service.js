const { findUserByEmail, createUser, createSlot, bookSlot, acceptBookig, findAllUsers, findSlotsBySitter, findAllSitters, getUserById } = require("../repository/repo");
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

exports.register = async function (name, email, password, city, postalCode, role) {
  let userFound = await findUserByEmail(email);
  if (userFound !== null) {
    throw new Error("User already registred");
  } else {
    let created = await createUser(name, email, password, city, postalCode, role);
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

  exports.getAllSitters = async () => {
    try {
      let sitters = await findAllSitters();
      sitters = JSON.stringify(sitters);
      sitters = JSON.parse(sitters); 
      return sitters;
    } catch (error) {
      console.error("Service could not get sitters" + error)
    }
  }

  exports.appendWithNextAvailableSlot = async (sitters) => {
    try {
      for (let i = 0; i < sitters.length; i++) {
        let slots = await findSlotsBySitter(sitters[i].userId);
        slots = filterFree(slots);
        if (slots.length === 0) {
            sitters[i].slots = [];
            continue;
        }
        slots.sort((a, b) => a.beginDateTime - b.beginDateTime);
        slots = slots[0];
        // format date time to human readable

        slots.dataValues.beg = slots.beginDateTime.toLocaleDateString('en-fr', { weekday:"long", hour:"numeric", minute:"numeric"})
        slots.dataValues.end = slots.endDateTime.toLocaleDateString('en-fr', { weekday:"long", hour:"numeric", minute:"numeric"})

        slots = JSON.stringify(slots);
        slots = JSON.parse(slots);
        sitters[i].slots = slots;
      }
      return sitters;
    } catch(error) {
      console.error("Service could not append slots" + error)
    }
  }

  exports.appendWithNextAvailableSlots = async (sitter) => {
    try {
      
        let slots = await findSlotsBySitter(sitter.userId);
        slots = filterFree(slots);
        if (slots.length === 0) {
            sitter.slots = [];
            return sitter;
        }
        slots.sort((a, b) => a.beginDateTime - b.beginDateTime);
        // format date time to human readable
        slots.forEach(slot => {
          slot.dataValues.beg = slot.beginDateTime.toLocaleDateString('en-fr', { weekday:"long", hour:"numeric", minute:"numeric"})
          slot.dataValues.end = slot.endDateTime.toLocaleDateString('en-fr', { weekday:"long", hour:"numeric", minute:"numeric"})
        });
        slots = JSON.stringify(slots);
        slots = JSON.parse(slots);
        sitter.slots = slots;
      
      return sitter;
    } catch(error) {
      console.error("Service could not append slots" + error)
    }
  }

  const filterFree = (slots) => {
    result = [];
    for(let i = 0; i < slots.length; i++) {
      if (slots[i].status === "free") {
        result.push(slots[i]);
      }
    }
    return result;
  }



  exports.filterByCity = async (users, city) => {
    try {
      let result = [];
      for (let i = 0; i < users.length; i++) {
        if (users[i].city.toLowerCase() === city.toLowerCase()) {
          result.push(users[i]);
        }
      }
      return result;
    } catch(error) {
      console.error("Service could not filter users")
    }
  }

  exports.filterByPostalCode = async (users, postalCode) => {
    try {
      let result = [];
      for (let i = 0; i < users.length; i++) {
        if (users[i].postalCode === postalCode) {
          result.push(users[i]);
        }
      }
      return result;
    } catch(error) {
      console.error("Service could not filter users")
    }
  }

  exports.getSittersInPostalCode = async (postalCode) => {
    try {
      let users = await findAllUsers();
      let sitters = users.filter(user => user.role === "sitter" && user.postalCode === postalCode);
      sitters = JSON.stringify(sitters);
      sitters = JSON.parse(sitters);  
      return sitters;
    } catch(error) {
      console.error("Service could not get users")
    }
  }

  exports.getSittersInCity = async (city) => {
    try {
      let users = await findAllUsers();
      
      let sitters = users.filter(user => user.role === "sitter" && user.city === city);
      sitters = JSON.stringify(sitters);
      sitters = JSON.parse(sitters);
      return sitters;
    } catch(error) {
      console.error("Service could not get users")
    }
  }

  exports.getSitterById = async (sitterId) => {
    try {
      let sitter = await getUserById(sitterId);
      sitter = JSON.stringify(sitter);
      sitter = JSON.parse(sitter);
      return sitter;
    } catch(error) {
      console.error("Service could not get sitter")
    }
  }