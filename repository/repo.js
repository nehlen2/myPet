const { DataTypes, Sequelize } = require("sequelize");
var fs = require("fs");
const bcrypt = require("bcrypt");

const sequelize = new Sequelize(
  "mypet_db",
  "avnadmin",
  "AVNS_llPMy7Mxu5CrHt_xHif",
  {
    host: "mehdi-benfredj-mysql-spring-security-test.b.aivencloud.com",
    dialect: "mysql",
    port: 22369,
    ssl: {
      ca: fs.readFileSync("./certificate/ca.pem"),
    },
  }
);

sequelize.sync();

const User = sequelize.define("user", {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Slot = sequelize.define("slot", {
  slotId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sitter: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  owner: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  beginDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.hasMany(Slot, {
  foreignKey: 'sitter',
});
Slot.belongsTo(User);

User.beforeCreate(async (user, options) => {
  if (user.changed("password")) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
  }
});

exports.findUserByEmail = async function (email) {
  let user = await User.findOne({
    where: { email: email },
	attributes: ["userId","name", "email", "city", "postalCode", "role","password"]
  });
  return user;
};

exports.createUser = async function (name, email, password, city, postalCode, role) {

    return await User.create({
      name: name,
      email: email,
      password: password,
      city: city,
      postalCode: postalCode,
      role: role
    });
 
};

exports.sequelize = sequelize;


exports.createSlot = async function (sitter, beginDateTime, endDateTime) {
  try {
    let slot = await Slot.create({
      sitter: sitter,
      beginDateTime: beginDateTime,
      endDateTime: endDateTime,
      status: "free"
    });
    return slot;
  } catch (error) {
    console.error(error);
  }
}

exports.bookSlot = async function (user, slotId) {
  try {
    return await Slot.update(
      { owner: user,
        status: "pending"
      }, 
      {
        where: {slotId : slotId}
      });
  } catch (error) {
    console.error(error);
  }
}

exports.acceptBookig = async function (slotId) {
  try {
    return await Slot.update(
      { 
        status: "booked"
      }, 
      {
        where: {slotId : slotId}
      });
  } catch (error) {
    console.error(error);
  }
}

exports.findAllUsers = async () =>  {
  try {
    return await User.findAll();
  } catch (error) {
    console.error(error);
  }
}

exports.findAllSitters = async () => {
    try {
      let sitters = await User.findAll({
        where: {role : "sitter"}
      });
      return sitters;
    } catch (error) {
      console.error(error);
    }
}

exports.findSlotsBySitter = async (sitterId) =>  {
  try {
    let bookings = await Slot.findAll(
      {
          where: {sitter : sitterId}
      }
    );
    return bookings;
  } catch (error) {
    console.error(error);
  }
}

exports.getUserById = async (userId) => {
  try {
    return await User.findOne({
      where: {userId : userId}
    });
  } catch (error) {
    console.error(error);
  }
}
