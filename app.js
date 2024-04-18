const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const mustacheExpress = require("mustache-express");
var fs = require("fs");
const bodyParser = require("body-parser");
const service = require("./service/service.js");
const cookieParser = require("cookie-parser");
const validate = require("./middleware/validate.js");
const { error } = require("console");


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
    if (cookie.role === 'sitter') {
      res.redirect("sitter-admin")
    } else {
      res.render("index", {user : cookie, message: req.query.message})
    }
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

app.get("/sitters/:activity", async (req, res) => {
  let cookie = req.cookies.user;
  if( cookie !== undefined ) {
    let sitters = await service.getAllSitters();
    sitters = await service.filterByCity(sitters, cookie.city);
    if (sitters.length !== 0) {
      sitters = await service.appendWithNextAvailableSlot(sitters);
      res.render("sitters", {user : cookie, activity : req.params.activity, sitters : sitters});
    } else {
      sitters = await service.getAllSitters();
      sitters = await service.appendWithNextAvailableSlot(sitters);
      res.render("sitters", {user : cookie, sitters : sitters, activity : req.params.activity, message: "No sitters found in your area. Showing all sitters instead."})
    }
  } else {
    let sitters = await service.getAllSitters();
    sitters = await service.appendWithNextAvailableSlot(sitters);
    res.render("sitters", {activity : req.params.activity, sitters : sitters, message : "Please login to search for sitter in your city"});
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
    res.cookie('user' ,user, { maxAge:  20 * 60 * 1000, httpOnly: true });
    if(user.role === "sitter") {
      res.redirect("/sitter-admin");
    } else {
      res.redirect("/")
    }
  } else {
    res.render("login", { message: "Invalid email or password" })
  }
});

app.get("/sitter-admin", validate.Verify, async (req, res) => {
try {
    let cookie = req.cookies.user;
    if (cookie.role !== 'sitter') {
      throw new Error("You are not a sitter");
    } 
    let slots = await service.getSlotsBySitter(cookie.userId)

    let availableSlots = await service.filterFree(slots);
    availableSlots = await service.formatTime(availableSlots);

    let pendingSlots = await service.filterPending(slots);
    pendingSlots = await service.formatTime(pendingSlots);

    let confirmedSlots = await service.filterBooked(slots);
    confirmedSlots = await service.formatTime(confirmedSlots);

    res.render("sitter-admin", {user : cookie, pendingSlots : pendingSlots, confirmedSlots : confirmedSlots , availableSlots: availableSlots})
  } catch (error) {
    console.error(error);
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
      //req.body.cat_sitter || req.body.dog_sitter || req.body.pet_walker ? "sitter" : "owner",
      req.body.cat_sitter,
      req.body.dog_sitter,
      req.body.pet_walker,
      req.body.picture
    );
    let options = {
      maxAge: 20 * 60 * 1000, // would expire in 20minutes
      httpOnly: true, // The cookie is only accessible by the web server
      secure: true,
      sameSite: "None",
    };

    const token = service.generateAccessJWT(user); // generate jwt token for user
    res.cookie("Authorization", token, options); // set the token to response header, so that the client sends it back on each subsequent request
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

const validateCreateSlotReqBody = (req) => {
  let check = req.body.begDateime !== '' && req.body.endDateime !== '' ;
  return check;
}

app.post("/create_slot" , validate.Verify, async (req, res) => {
  try {
    let cookie = req.cookies.user;
    if (validateCreateSlotReqBody(req) === false) {
      throw new Error("Invalid req body");
    }
    let booked_slot = await service.createSlot(req.user.userId, req.body.begDateime, req.body.endDateTime);
    res.redirect("/sitter-admin")
  } catch (err) {
    res.render("sitter-admin", {alert: "There was an error when creating your slot" , createAlert : "true", user : req.cookies.user})
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

app.post("/accept_booking" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.acceptBooking(req.body.slotId);
    res.redirect("/sitter-admin");
  } catch (err) {
    res.redirect("/sitter-admin");
  }
})

app.post("/confirmation/accept_booking/accept_booking/:id" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.acceptBooking(req.params.id);
    res.redirect("/sitter-admin");
  } catch (err) {
    res.redirect("/sitter-admin")
  }
})

app.post("/confirmation/cancel_booking/cancel_booking/:id" , validate.Verify, async (req, res) => {
  try {
    let booked_slot = await service.cancelBooking(req.params.id);
    res.redirect("/sitter-admin");
  } catch (err) {
    res.redirect("/sitter-admin")
  }
})

app.post("/confirmation/delete_slot/delete_slot/:id" , validate.Verify, async (req, res) => {
  try {
    let deletedSlot = await service.deleteSlot(req.params.id);
    res.redirect("/sitter-admin");
  } catch (err) {
    res.redirect("/sitter-admin")
  }
})


app.post("/confirmation/book_slot/book_slot/:id" , validate.Verify, async (req, res) => {
  try {
    let user = req.cookies.user;
    let deletedSlot = await service.bookSlot(user.userId ,req.params.id);
    res.redirect("/");
  } catch (err) {
    res.redirect("/")
  }
})

app.post("/confirmation/:method/:id", async (req, res) => {
  try {
    let method = req.params.method;
    let id = req.params.id;
    if (method === 'accept_booking') {
      res.render("confirmation", {method: method, verb : "Confirm", message : "Would you like to confirm this booking request?", btn : "Accept", btnColor : "success", id : id})
      }

    if (method === 'cancel_booking') {
      res.render("confirmation", {method: method, verb : "Cancel", message : "Would you like to cancel this booking?", btn : "Cancel", btnColor : "error", id : id})
    }

    if (method === 'delete_slot') {
      res.render("confirmation", {method: method, verb : "Delete", message : "Would you like to delete this booking?", btn : "Delete", btnColor : "warning", id : id})
    }

    if (method === 'book_slot') {
      res.render("confirmation", {method: method, verb : "Confirm", message : "Would you like to book this slot?", btn : "Confirm", btnColor : "success", id : id})
    }
  } catch (error) {
    console.error(error);
  }
})

app.get("/get_sitter_slots" , validate.Verify, async (req, res) => {
  try {
    let cookie = req.cookies.user;
    let slots = await service.getSlotsBySitter(cookie.userId)
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
