const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const mustacheExpress = require("mustache-express");
var fs = require("fs");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const userService = require("./service/userService.js");
const cookieParser = require("cookie-parser");
const validate = require("./middleware/validate.js");
const repo = require("./repository/repo.js");

// configure mustache as template engine
app.engine("html", mustacheExpress());
app.set("view engine", "html");
app.set("views", __dirname + "/views");

// set up static files
app.use(express.static("public"));

// define middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(
  cookieSession({
    secret: "mot-de-passe-du-cookie",
  })
);

app.use(function (req, res, next) {
  if (req.session && req.session.email !== undefined) {
    res.locals.authenticated = true;
    res.locals.email = req.session.email;
  }
  return next();
});

// define routes
app.get("/", async (req, res) => {
  console.log(req.session.email);
  res.render("index", {
    user: req.session.email,
    status: res.locals.authenticated,
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/cat-sitters", (req, res) => {
  res.render("cat-sitters");
});

app.get("/sitter", (req, res) => {
  res.render("sitter");
});

app.get("/booking-form", (req, res) => {
  res.render("booking-form");
});

app.get("/test", validate.Verify, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the your Dashboard!",
  });
});

app.post("/login", async (req, res) => {
  let user = await userService.login(req.body.email, req.body.password);
  if (user !== undefined && user !== null) {
    let options = {
      maxAge: 20 * 60 * 1000, // would expire in 20minutes
      httpOnly: true, // The cookie is only accessible by the web server
      secure: true,
      sameSite: "None",
    };
    const token = userService.generateAccessJWT(user.dataValues); // generate session token for user
    res.cookie("Authorization", token, options); // set the token to response header, so that the client sends it back on each subsequent request
    req.session.email = user.dataValues.email;
    res.status(200).json({
      status: "success",
      data: [],
      message: "Welcome to our API homepage!",
    });
    //res.render("index", { user: user.dataValues });
  } else {
    res.status(401).json({
      status: "error",
      message: "Incorrect username or password",
    });
    //res.render("login", { message: "Invalid email or password" })
  }
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  let registred = await userService.register(
    req.body.name,
    req.body.email,
    req.body.password,
    req.body.role
  );

  if (registred !== undefined) {
    res.status(200).json({
      status: "success",
      data: registred.dataValues,
      message: "Welcome to our API homepage!",
    });
  } else {
    res.status(400).json({
      status: "failed",
      message: "could not register",
    });
  }
});

//start the server
app.listen(PORT, () => {
  console.log("Server is running on port localhost:3000");
});

exports.app = app;
