
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
app.set ("dblocation", (process.env.DATABASE_URL || config.default_database));
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
    api.processor.authenticate (req, function (user_data) {

        // return response for unauthenticated accounts
        if (! user_data) {
            api.processor.sendResponse (res, api.processor.getErrorResponseData ("Not authenticated."));
            return;
        }

        // evaluate the method
        switch (req.params.method) {
            case "log":

                var error_data = {
                    user_id: user_data.user_id,
                    product: req.query.product,
                    environment: req.query.environment,
                    server: req.query.server,
                    message: req.query.message,
                    stack_trace: req.query.stack_trace
                };

                api.processor.logError (req, error_data, function (error_message) {
                    if (error_message) api.processor.sendResponse (res, api.processor.getErrorResponseData (error_message));
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