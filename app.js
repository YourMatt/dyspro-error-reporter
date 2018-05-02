
// load configuration values
require ("dotenv").config();

// include libraries
var express = require ("express")
,   session = require ("express-session")
,   busboy = require ("connect-busboy")
,   bodyParser = require ("body-parser")
,   ejs = require ("ejs")
,   compression = require ("compression")
,   moment = require ("moment")
,   sessionManager = require ("./sessionmanager.js")
,   api = require ("./apiprocessor.js")
,   database = require ("./databaseaccessor.js")
,   attachments = require ("./attachmentmanager.js")
,   mime = require ("mime");

// initialize express
var app = express ();
app.set ("port", (process.env.RUNTIME_PORT || 80));
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", ejs.renderFile);
app.use (bodyParser.urlencoded ({extended: false}));
app.use (compression({level: 1, threshold: 0})); // use fastest compression
app.use (express.static (__dirname + "/public"));
app.use (busboy ()); // allow file uploads
app.use (session ({secret: "dyspro-sess", resave: true, saveUninitialized: true}));

// initialize the library dependencies
api.init (database, sessionManager);

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
    req.busboy.on ("file", function (fieldName, file, fileName, encoding, mimeType) {
        var fileSource = "";
        file.on ("data", function (data) {
            fileSource += data;
        });
        file.on ("end", function () {
            var fileData = {
                fileName: fileName,
                fileType: api.processor.getFileType (fileName),
                source: fileSource
            };
            req.files.push (fileData);
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
            jsFiles: [],
            errorMessage: sessionManager.getOnce ("errorMessage"),
            successMessage: sessionManager.getOnce ("successMessage"),
            userId: sessionManager.data.userId
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
                jsFiles: ["errors.js", "dashboard.js"],
                errorMessage: sessionManager.getOnce ("errorMessage"),
                successMessage: sessionManager.getOnce ("successMessage"),
                userId: sessionManager.data.userId,
                environments: environments,
                selectedEnvironment: environments[0] // TODO: Pull value from settings if exists
            }
        );
    });
});

// error occurrence detail page
app.get ("/errors/:errorId/occurrence/:errorOccurrenceId", function (req, res) {
    if (! sessionManager.loggedIn ()) {
        res.redirect ("/");
        return;
    }

    // load the error occurrence data
    database.query.getErrorOccurrence (req.params.errorOccurrenceId, function (errorOccurrence) {
        if (! errorOccurrence) {
            sessionManager.set ("errorMessage", "Error occurrence not found.");
            res.redirect (req.headers.referer);
            return;
        }

        // load the attachments for the error occurrence
        database.query.getErrorAttachments (errorOccurrence.errorOccurrenceId, function (attachments) {
            errorOccurrence.attachments = attachments;

            try {
                var stackTraceJson = JSON.parse (errorOccurrence.stackTrace);
                errorOccurrence.stackTrace = JSON.stringify (stackTraceJson, null, 2);
            }
            catch (e) {}

            res.render ("error-occurrence-detail.ejs",
                {
                    page: "erroroccurrencedetail",
                    jsFiles: ["errors.js", "error-detail.js"],
                    errorMessage: sessionManager.getOnce ("errorMessage"),
                    successMessage: sessionManager.getOnce ("successMessage"),
                    userId: sessionManager.data.userId,
                    errorOccurrence: errorOccurrence,
                    error: errorOccurrence,
                    moment: moment
                }
            );
        });
    });
});

// error detail page
app.get ("/errors/:errorId", function (req, res) {
    if (! sessionManager.loggedIn ()) {
        res.redirect ("/");
        return;
    }

    // load the error data
    database.query.getError (req.params.errorId, function (error) {
        if (! error) {
            sessionManager.set ("errorMessage", "Error not found.");
            res.redirect (req.headers.referer);
            return;
        }

        res.render ("error-detail.ejs",
            {
                page: "errordetail",
                jsFiles: ["errors.js", "error-detail.js"],
                errorMessage: sessionManager.getOnce ("errorMessage"),
                successMessage: sessionManager.getOnce ("successMessage"),
                userId: sessionManager.data.userId,
                error: error
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
            jsFiles: [],
            errorMessage: sessionManager.getOnce ("errorMessage"),
            successMessage: sessionManager.getOnce ("successMessage"),
            userId: sessionManager.data.userId
        }
    );
});

// process login
app.post ("/login", function (req, res) {
    database.query.getUserByLogin (req.body.email, req.body.password, function (userData) {

        // user not authenticated
        if (! userData) {
            sessionManager.set ("errorMessage", "Incorrect email or password.");
            res.redirect (req.headers.referer);
            return;
        }

        // save user to session and forward to the dashboard
        sessionManager.set ("userId", userData.UserId);
        sessionManager.set ("accountId", userData.AccountId);
        res.redirect ("/dashboard");

    });
});

// process logout
app.get ("/logout", function (req, res) {
    sessionManager.set ("userId", "");
    sessionManager.set ("successMessage", "You have successfully logged out.");
    res.redirect ("/");
});

// process attachment downloads
app.get ("/attachments/:errorOccurrenceId/:fileName", function (req, res) {
    attachments.manager.loadFile (req.params.errorOccurrenceId, req.params.fileName, function (file) {

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
        res.writeHead (200, {"Content-Type": mime.lookup(file.fileType)});
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
app.all ("/api/:key/:method/:type/:id", function (req, res) {
    api.processor.handleRequest (req, res);
});

// start server
app.listen (app.get ("port"));
console.log ("Server started.");