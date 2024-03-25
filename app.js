const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const mustacheExpress = require("mustache-express");

// configure mustache as template engine
app.engine("html", mustacheExpress());
app.set("view engine", "html");
app.set('views', __dirname + '/views');

// set up static files
app.use(express.static('public'));

// define middleware
app.use(express.json())

// define routes
app.get('/', (req, res) => {
    res.render('index', {message : 'Hello Nounou!'});
})

app.get('/michou', (req, res) => {
    res.render('navbar')
})



//start the server 
app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}');
})



