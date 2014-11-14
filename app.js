
// include libraries
var express = require ("express"),
    busboy = require ("connect-busboy"),
    api = require ("./apiprocessor.js"),
    database = require ("./databaseaccessor.js"),
    pg = require ("pg"),
    config = require ("./config.js");

// initialize express
var app = express ();
app.set ("port", (process.env.PORT || 80));
app.set ("dblocation", (process.env.DATABASE_URL || config.defaultDatabase));
app.use (express.static (__dirname + "/public"));
app.use (busboy ()); // allow file uploads

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
// TODO: make this accessible for get and post - but make sure no error with no files for get
app.post ("/api/:method", function (req, res) {

    // authenticate all api requests
    api.processor.authenticate (req, function (userData) {

        // return response for unauthenticated accounts
        if (! userData) {
            api.processor.sendResponse (res, api.processor.getErrorResponseData ("Not authenticated."));
            return;
        }

        // evaluate the method
        switch (req.params.method) {
            case "log":

                var errorData = {
                    user_id: userData.user_id,
                    product: req.query.product,
                    environment: req.query.environment,
                    server: req.query.server,
                    message: req.query.message,
                    stack_trace: req.query.stack_trace
                }

                api.processor.logError (req, errorData, function (errorMessage) {
                    if (errorMessage) api.processor.sendResponse (res, api.processor.getErrorResponseData (errorMessage));
                    else api.processor.sendResponse (res, api.processor.getSuccessResponseData ());
                });

                break;
            default:
                api.processor.sendResponse (res, api.processor.getErrorResponseData ("Method not implemented."));
                break;
        }

    });

});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");