
// include libraries
var express = require ("express"),
    api = require ("./apiprocessor.js"),
    database = require ("./databaseaccessor.js"),
    pg = require ("pg"),
    config = require ("./config.js");

// initialize express
var app = express ();
app.set ("port", (process.env.PORT || 80));
app.set ("dblocation", (process.env.DATABASE_URL || config.defaultDatabase));
app.use (express.static (__dirname + "/public"));

// initialize the library dependencies
database.init (app.get ("dblocation"), pg);
api.init (database);

// handle all other requests
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", require ("ejs").renderFile);
app.get ("/", function (req, res) {

    res.render ("template.ejs");

});

app.get ("/api", function (req, res) {

    var auth = api.processor.authenticate (req, function (userData) {
        res.writeHead (200, {"Content-Type": "text/plain"});
        console.log (userData);
        res.end("Name = " + userData.username);
    });

});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");