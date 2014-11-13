
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

// expose api methods
app.get ("/api/:method", function (req, res) {

    // authenticate all api requests
    var auth = api.processor.authenticate (req, function (userData) {
        var returnData;

        // return response for unauthenticated accounts
        if (! userData) {
            returnData = api.processor.getError ("Not authenticated.");
        }

        // evaluate the method
        else {
            switch (req.params.method) {
                case "log":
                    // TODO: Log the request
                    break;
                default:
                    returnData = api.processor.getError ("Method not implemented.");
                    break;
            }
        }

        res.writeHead (200, {"Content-Type": "application/json"});
        res.end (JSON.stringify (returnData));

    });

});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");