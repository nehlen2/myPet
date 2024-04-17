const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const mustacheExpress = require("mustache-express");
var fs = require("fs");
const bodyParser = require("body-parser");
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

// global var 


// define routes
app.get("/", async (req, res) => {
  // check authenticated user
  let cookie = req.cookies.user;
  if( cookie !== undefined) {
    res.render("index", {user : cookie, message: req.query.message})
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

app.get("/sitters/:animal", async (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    let sitters = await service.getAllSitters();
    sitters = await service.filterByCity(sitters, cookie.city);
    if (sitters.length !== 0) {
      sitters = await service.appendWithNextAvailableSlot(sitters);
      res.render("sitters", {user : cookie, animal : req.params.animal, sitters : sitters});
    } else {
      sitters = await service.getAllSitters();
      sitters = await service.appendWithNextAvailableSlot(sitters);
      res.render("sitters", {user : cookie, sitters : sitters, animal : req.params.animal, message: "No sitters found in your area. Showing all sitters instead."})
    }
  } else {
    let sitters = await service.getAllSitters();
    sitters = await service.appendWithNextAvailableSlot(sitters);
    res.render("sitters", {animal : req.params.animal, sitters : sitters, message : "Please login to search for sitter in your city"});
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
    res.render("register");
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
    res.cookie('user' ,user, { maxAge:  20 * 60 * 1000, httpOnly: true });
    if(user.role === "sitter") {
      res.redirect("/sitter-admin")
    } else {
      res.redirect("/")
    }
  } else {
    res.render("login", { message: "Invalid email or password" })
  }
});

app.get("/sitter-admin", validate.Verify, async (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined && cookie.role === "sitter") {
    res.render("sitter-admin", {user : cookie})
  } else {
    res.render("login");
  }
});


app.post("/register", async (req, res) => {
  try {
    let user = await service.register(
      req.body.name,
      req.body.email,
      req.body.password,
      req.body.city,
      req.body.postalCode,
      req.body.sitter ? "sitter" : "owner"
    );
    let options = {
      maxAge: 20 * 60 * 1000, // would expire in 20minutes
      httpOnly: true, // The cookie is only accessible by the web server
      secure: true,
      sameSite: "None",
    };

    const token = service.generateAccessJWT(user); // generate jwt token for user
    res.cookie("Authorization", token, options); // set the token to response header, so that the client sends it back on each subsequent request
    authenticated = "true";
    res.cookie('user', user, { maxAge: 900000, httpOnly: true });
    if(user.role === "sitter") {
      res.redirect("/sitter-admin")
    } else {
      res.redirect("/")
    }
  } catch(error) {
    res.render("register", { message: "User already registered" })
  }
});

app.post("/create_slot" , validate.Verify, async (req, res) => {
  try {
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

app.post("/book_slot/:slotId" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.bookSlot(req.user.userId, req.params.slotId);
    res.render("index", {message: "Slot booked successfully"})
  } catch (err) {
    res.render("sitters", {message: "could not book slot"})
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

app.get("/profile", (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    res.render("profile", {user : cookie})
  } else {
    res.render("profile");
  }
});

app.get("/sitters/sitter/:sitterId", async (req, res) => {
  console.log(req.params.sitterId)
  let cookie = req.cookies.user;
  let sitter = await service.getSitterById(req.params.sitterId);
  sitter = await service.appendWithNextAvailableSlots(sitter);
  if( cookie !== undefined ) {
    res.render("sitter", {user : cookie, sitter : sitter})
  } else {
    res.render("sitter", {sitter : sitter});
  }
});

//start the server
app.listen(PORT, () => {
  console.log("Server is running on port localhost:3000");
});

exports.app = app;
