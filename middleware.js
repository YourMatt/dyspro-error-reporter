/***********************************************************************************************************************
 *
 * HANDLES ALL MIDDLEWARE INJECTIONS
 *
 **********************************************************************************************************************/
const db = require("./databaseaccessor"),
    sessionManager = require("./sessionmanager"),
    api = require("./apiprocessor");

// Adds all middleware.
exports.addAll = function (app) {

    // load the session
    app.use (function (req, res, next) {
        db.init(function(success) {
            if (!success) return res.end("Error connecting to database.");

            sessionManager.init (req);
            next ();

        });
    });

    // initialize the api processor if an api page
    app.use (function (req, res, next) {
        if (req.url.indexOf("/api/") === 0) {
            api.init(req, res, sessionManager);
            api.authenticate(function (accountData) {

                api.accountId = accountData.accountId;
                next();

            });
        }
        else next();
    });

    // load multipart form data
    app.use (function (req, res, next) {
        req.files = [];

        // set body with query params if a get
        if (req.method === "GET") {
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
            let fileSource = Buffer("", "binary");
            file.on ("data", function (data) {
                fileSource = Buffer.concat([fileSource, Buffer.from(data, "binary")]);
            });
            file.on ("end", function () {

                let fileNameParts = fileName.split (".");
                let fileType = fileNameParts[fileNameParts.length - 1].toLowerCase ();

                let fileData = {
                    fileName: fileName,
                    fileType: fileType,
                    source: fileSource
                };
                req.files.push(fileData);
            });
        });

        // continue
        req.busboy.on("finish", function () {
            next ();
        });

    });

    // set handler for final cleanup before ending script
    app.use (function (req, res, next) {

        res.on("finish", function () {
            db.close();
        });

        next();

    });

};
