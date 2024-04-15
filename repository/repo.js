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

User.beforeCreate(async (user, options) => {
  if (user.changed("password")) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
  }
});

sequelize.sync();

exports.findUserByEmail = async function (email) {
  let user = await User.findOne({
    where: { email: email },
	attributes: ["name", "email", "role", "password"]
  });
  return user;
};

exports.createUser = async function (name, email, password, role) {

    return await User.create({
      name: name,
      email: email,
      password: password,
      role: role,
    });
 
};

exports.sequelize = sequelize;
exports.User = User;


exports.createSlot = async function (sitter, beginDateTime, endDateTime) {
  console.log(beginDateTime)
  console.log(endDateTime)
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