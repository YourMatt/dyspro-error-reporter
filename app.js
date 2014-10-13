
var express = require ("express"),
    skillmapsvg = require ("./errorreporter.js");

var app = express ();
app.set ("port", (process.env.PORT || 80));
app.use (express.static (__dirname + "/public"));

// handle all other requests
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", require ("ejs").renderFile);
app.get ("/", function (req, res) {

    res.render ("template.ejs");

});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");