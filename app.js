
var express = require ("express"),
    skillmapsvg = require ("./errorreporter.js");

var app = express ();
app.use (express.static (__dirname + "/public"));

// handle all other requests
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", require ("ejs").renderFile);
app.get ("/*", function (req, res) {

    res.render ("template.ejs");

});

// start server
app.listen (80);
console.log ("Server started.");