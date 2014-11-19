
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
api.init (database, sessionManager);

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
            page: "home",
            js_files: [],
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
    database.query.getAccountEnvironments (sessionManager.data.account_id, function (environments) {
        res.render ("dashboard.ejs",
            {
                page: "dashboard",
                js_files: ["dashboard.js"],
                error_message: sessionManager.getOnce ("error_message"),
                success_message: sessionManager.getOnce ("success_message"),
                user_id: sessionManager.data.user_id,
                environments: environments,
                selected_environment: environments[0] // TODO: Pull value from settings if exists
            }
        );
    });
});

// settings page
app.get ("/settings", function (req, res) {
    if (! sessionManager.loggedIn ()) {
        res.redirect ("/");
        return;
    }
    res.render ("settings.ejs",
        {
            page: "settings",
            js_files: [],
            error_message: sessionManager.getOnce ("error_message"),
            success_message: sessionManager.getOnce ("success_message"),
            user_id: sessionManager.data.user_id
        }
    );
});

// process login
app.post ("/login", function (req, res) {
    database.query.getUserByLogin (req.body.email, req.body.password, function (user_data) {

        // user not authenticated
        if (! user_data) {
            sessionManager.set ("error_message", "Incorrect email or password.");
            res.redirect (req.headers.referer);
            return;
        }

        // save user to session and forward to the dashboard
        sessionManager.set ("user_id", user_data.user_id);
        sessionManager.set ("account_id", user_data.account_id);
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
app.all ("/api/:key/:method", function (req, res) {
    api.processor.handleRequest (req, res);
});
app.all ("/api/:key/:method/:type", function (req, res) {
    api.processor.handleRequest (req, res);
});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");