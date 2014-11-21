
// include libraries
var express = require ("express"),
    session = require ("express-session"),
    busboy = require ("connect-busboy"),
    bodyParser = require ("body-parser"),
    sessionManager = require ("./sessionmanager.js"),
    api = require ("./apiprocessor.js"),
    database = require ("./databaseaccessor.js"),
    attachments = require ("./attachmentmanager.js"),
    mime = require ("mime"),
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

// load multipart form data
app.use (function (req, res, next) {
    req.files = [];

    // set body with query params if a get
    if (req.method == "GET") {
        next ();
        return;
    }

    // skip if anything already set for body
    if (Object.keys (req.body).length) {
        next ();
        return;
    }

    if (! req.busboy) {
        next ();
        return;
    }

    // reset request body and start load
    req.body = {};
    req.pipe (req.busboy);

    // load field values to request body
    req.busboy.on ("field", function (key, value, keyTruncated, valueTruncated) {
        req.body[key] = value;
    });

    // load file data to request files
    req.busboy.on ("file", function (field_name, file, file_name, encoding, mime_type) {
        var file_source = "";
        file.on ("data", function (data) {
            file_source += data;
        });
        file.on ("end", function () {
            var file_data = {
                file_name: file_name,
                file_type: api.processor.getFileType (file_name),
                source: file_source
            };
            req.files.push (file_data);
        });
    });

    // continue
    req.busboy.on("finish", function () {
        next ();
    });

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

// process attachment downloads
app.get ("/attachments/:error_occurrence_id/:file_name", function (req, res) {
    attachments.manager.loadFile (req.params.error_occurrence_id, req.params.file_name, function (file) {

        if (! file) { // TODO: Call standard 404 handler
            res.writeHead (404, {"Content-Type": "text/html"});
            res.end("not found");
            return;
        }

        /* // TODO: Add option to prompt download
        res.writeHead (200, {"Content-Disposition": "attachment filename=" + file.file_name + ";"});
        res.end (file.source);
        */

        // display the file
        res.writeHead (200, {"Content-Type": mime.lookup(file.file_type)});
        res.end (file.source);

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