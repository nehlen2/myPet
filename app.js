const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const mustacheExpress = require("mustache-express");
var fs = require("fs");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const service = require("./service/service.js");
const cookieParser = require("cookie-parser");
const validate = require("./middleware/validate.js");


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
  cookieParser()
);

/*
app.use(function (req, res, next) {
  if (req.session && req.session.email !== undefined) {
    res.locals.authenticated = true;
    res.locals.email = req.session.email;
  }
  return next();
});
*/

// global var 


// define routes
app.get("/", async (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("index", {user : cookie})
  } else {
    res.render("index");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/contact", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("contact", {user : cookie})
  } else {
    res.render("contact");
  }
});

app.get("/sitters", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("sitters", {user : cookie})
  } else {
    res.render("sitters");
  }
});

app.get("/sitter", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("sitter", {user : cookie})
  } else {
    res.render("sitter");
  }
});

app.get("/register", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("register", {user : cookie})
  } else {
    res.render("register");
  }
});

app.get("/booking-form", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("booking-form", {user : cookie})
  } else {
    res.render("booking-form");
  }
});

app.get("/test", validate.Verify, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the your Dashboard!",
  });
});

app.post("/login", async (req, res) => {
  let user = await service.login(req.body.email, req.body.password);
  if (user !== undefined && user !== null) {
    let options = {
      maxAge: 20 * 60 * 1000, // would expire in 20minutes
      httpOnly: true, // The cookie is only accessible by the web server
      secure: true,
      sameSite: "None",
    };
    const token = service.generateAccessJWT(user); // generate jwt token for user
    res.cookie("Authorization", token, options); // set the token to response header, so that the client sends it back on each subsequent request
    authenticated = "true";
    res.cookie('user',user, { maxAge: 900000, httpOnly: true });
    res.redirect("/")
    //res.render("index", { user: user.dataValues });
  } else {
    res.render("login", { message: "Invalid email or password" })
  }
});


app.post("/register", async (req, res) => {
  let registred = await service.register(
    req.body.name,
    req.body.email,
    req.body.password,
    req.body.role
  );

  if (registred !== undefined) {
    res.status(200).json({
      status: "success",
      data: registred,
      message: "Welcome to our API homepage!",
    });
  } else {
    res.status(500).json({
      status: "failed",
      message: "could not register",
    });
  }
});

app.post("/create_slot" , validate.Verify, async (req, res) => {
  try {
    console.log(req.body, req.body.beginDateTime, req.body.endDateTime)
    let booked_slot = await service.createSlot(req.body.sitter, req.body.begDateime, req.body.endDateTime);
    res.status(200).json({
      status: "success",
      data: booked_slot.dataValues,
    });
  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: "could not create slot",
    });
  }
})

app.put("/book_slot" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.bookSlot(req.user.userId, req.body.slotId);
    res.status(200).json({
      status: "success",
      data: booked_slot,
    });
  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: "could not book slot",
    });
  }
})

app.put("/accept_booking" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.acceptBooking(req.body.slotId);
    res.status(200).json({
      status: "success",
      data: booked_slot,
    });
  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: "could not accept slot",
    });
  }
})

app.get("/get_sitter_slots" , validate.Verify, async (req, res) => {
  try {
    let slots = await service.getSlotsBySitter(req.body.sitterId)
    res.status(200).json({
      status: "success",
      data: slots,
    });
  } catch(error) {
    res.status(500).json({
      status: "failed",
      message: "could not book slot",
    });
  }
})

app.get("/logout" , async (req, res) => {
  try {
    res.clearCookie("Authorization");
    res.clearCookie("user");
    res.redirect("/")
  } catch(error) {
      console.error(error)
  }
})

//start the server
app.listen(PORT, () => {
  console.log("Server is running on port localhost:3000");
});

exports.app = app;
