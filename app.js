
var express = require ("express"),
    api = require ("./apiprocessor.js");

var app = express ();
app.set ("port", (process.env.PORT || 80));
app.use (express.static (__dirname + "/public"));

// handle all other requests
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", require ("ejs").renderFile);
app.get ("/", function (req, res) {

    res.render ("template.ejs");

});

app.get ("/api", function (req, res) {

    var auth = api.processor.authenticate (req);

    res.writeHead (200, {'Content-Type':"text/plain"});
    res.end('authenticated: ' + auth);

});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");