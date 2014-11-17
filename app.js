
// include libraries
var express = require ("express"),
    session = require ("express-session"),
    busboy = require ("connect-busboy"),
    bodyParser = require ("body-parser"),
    sessionManager = require ("./sessionmanager.js"),
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
app.use (bodyParser.urlencoded ({extended: false}));
app.use (session ({secret: "dyspro-sess", resave: true, saveUninitialized: true}));

// initialize the library dependencies
database.init (app.get ("dblocation"), pg);
api.init (database);

// set template engine
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", require ("ejs").renderFile);

// load the session
app.use (function (req, res, next) {
    sessionManager.init (req);
    next ();
});

// HANDLE PAGES

// home page
app.get ("/", function (req, res) {
    res.render ("home.ejs",
        {
            error_message: sessionManager.getOnce ("error_message"),
            success_message: sessionManager.getOnce ("success_message"),
            user_id: sessionManager.data.user_id
        }
    );
});

// dashboard page
app.get ("/dashboard", function (req, res) {
    if (! sessionManager.loggedIn ()) {
        res.redirect ("/");
        return;
    }
    res.render ("dashboard.ejs",
        {
            error_message: sessionManager.getOnce ("error_message"),
            success_message: sessionManager.getOnce ("success_message"),
            user_id: sessionManager.data.user_id
        }
    );
});

// process login
app.post ("/login", function (req, res) {
    database.query.getUserByLogin (req.body.username, req.body.password, function (user_data) {

        // user not authenticated
        if (! user_data) {
            sessionManager.set ("error_message", "Incorrect username or password.");
            res.redirect (req.headers.referer);
            return;
        }

        // save user to session and forward to the dashboard
        sessionManager.set ("user_id", user_data.user_id);
        res.redirect ("/dashboard");

    });
});

// process logout
app.get ("/logout", function (req, res) {
    sessionManager.set ("user_id", "");
    sessionManager.set ("success_message", "You have successfully logged out.");
    res.redirect ("/");
});

// sample endpoints
// TODO: Convert this to real method for loading attachments
app.get ("/filetest", function (req, res) {

    database.query.getErrorAttachment (16, "npm.png", function (file) {

        if (file) {

            /* // test download
            res.writeHead (200, {"Content-Disposition": "attachment filename=" + file.file_name + ";"});
            res.end (file.source);
            */

            // test inline
            res.writeHead (200, {"Content-Type": "image/png"});
            res.end (file.source);

        }

        else {
            res.writeHead (200, {"Content-Type": "application/json"});
            res.end("file not found");
        }

    });

});

// expose api methods
app.all ("/api/:method", function (req, res) {

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