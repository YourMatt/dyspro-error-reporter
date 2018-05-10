/***********************************************************************************************************************
 *
 * HANDLES ALL API REQUESTS
 *
 * This returns the following status codes:
 * 200 - OK
 * 201 - Success for all create or update requests
 * 400 - Missing or invalid input params
 * 401 - Invalid login
 * 403 - No record for the ID or user does not have access to the ID
 * 500 - System issue
 *
 **********************************************************************************************************************/
const models = require("./models/all"),
    queries = require("./queries/all"),
    utils = require("./utilities");
// following are set by init
let req = {},
    res = {},
    sessionManager = {};

exports.accountId = 0; // set after authenticated

exports.init = function (initReq, initRes, initSessionManager) {
    req = initReq;
    res = initRes;
    sessionManager = initSessionManager;
};

exports.authenticate = function (callback) {

    // load authentication data
    let header = req.headers["authorization"] || "",
        token = header.split(/\s+/).pop() || "",
        auth = new Buffer(token, "base64").toString(),
        parts = auth.split(/:/),
        userName = parts[0],
        apiKey = parts[1];

    // use auth token if provided
    if (userName && apiKey) {
        queries.accounts.getByApiKey(userName, apiKey, callback);
    }

    // use session if no auth token, and user logged into the session
    else if (sessionManager.data.user.accountId) {
        let account = new models.Account(); // skipping query from DB because account ID is only needed
        account.accountId = sessionManager.data.user.accountId;
        callback(account);
    }

    // return if not authenticated
    else apiUtils.sendResponse(401, "Could not authenticate. Check your API Key.");

};

exports.error = {

    getSingle: function () {

        const errorId = utils.toInt(req.params.errorId);

        if (!errorId) return apiUtils.sendResponse(400, "Missing error ID.");

        queries.errors.get(errorId, function (error) {
            if (error.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error does not exist.");

            apiUtils.sendResponse(200, error);

        });

    },

    getLatestForEnvironment: function () {

        let numErrors = utils.toInt(req.params.count);
        if (!numErrors) numErrors = 20;

        queries.errorOccurrences.getLatestByAccountAndEnvironment(
            exports.accountId,
            req.params.environment,
            numErrors,
            function (errors) {
                apiUtils.sendResponse(200, errors);
            }
        )

    },

    create: function () {

        let error = new models.Error(
            exports.accountId,
            req.body.product,
            req.body.stackTrace
        );

        if (!error.isValid()) return apiUtils.sendResponse(400, error.errorMessage);

        queries.errors.create(error, function (errorId) {
            if (!errorId) return apiUtils.sendResponse(500, "Error saving the error to the database.");

            let errorOccurrence = new models.ErrorOccurrence(
                errorId,
                req.body.environment,
                req.body.message,
                req.body.server,
                req.body.userName
            );

            if (!errorOccurrence.isValid()) return apiUtils.sendResponse(400, error.errorMessage);

            queries.errorOccurrences.create(errorOccurrence, function (errorOccurrenceId) {
                if (!errorOccurrenceId) return apiUtils.sendResponse(500, "Error saving error occurrence to database. The error definition was saved.");

                // return if no files to attach to the error occurrence
                if (!req.files.length) {
                    return apiUtils.sendResponse(201, {
                        errorId: errorId,
                        errorOccurrenceId: errorOccurrenceId
                    });
                }

                let numAttachmentsSaved = 0;
                for (let i = 0; i < req.files.length; i++) {
                    queries.errorAttachments.create(
                        errorOccurrenceId,
                        req.files[i],
                        function (success) {
                            // TODO: Handle attachment save error - currently success is always true

                            numAttachmentsSaved++;
                            if (numAttachmentsSaved === req.files.length) {
                                return apiUtils.sendResponse(201, {
                                    errorId: errorId,
                                    errorOccurrenceId: errorOccurrenceId
                                });
                            }

                        }
                    )
                }

            });

        });

    }

};

exports.errorNotes = {

    getSingle: function () {

        const errorNoteId = utils.toInt(req.params.errorNoteId);

        if (!errorNoteId) return apiUtils.sendResponse(400, "Missing error note ID.");

        queries.errorNotes.get(errorNoteId, function (errorNote) {
            if (errorNote.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error note does not exist.");

            apiUtils.sendResponse(200, errorNote);

        });

    },

    getAllForError: function () {

        const errorId = utils.toInt(req.params.errorId);

        if (!errorId) return apiUtils.sendResponse(400, "Missing error ID.");

        queries.errors.get(errorId, function (error) {
            if (error.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error does not exist.");

            queries.errorNotes.getAllByErrorId(error.errorId, function (errorNote) {
                apiUtils.sendResponse(200, errorNote);
            });

        });

    },

    create: function () {

        const errorId = utils.toInt(req.body.errorId),
            userId = utils.toInt(req.body.userId);

        if (!errorId) return apiUtils.sendResponse(400, "Missing error ID.");
        if (!userId) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.errors.get(errorId, function(error) {
            if (error.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error does not exist.");

            queries.users.get(userId, function(user) {
                if (user.accountId !== exports.accountId) return apiUtils.sendResponse(403, "User does not exist.");

                let errorNote = new models.ErrorNote(
                    exports.accountId,
                    errorId,
                    req.body.message,
                    userId
                );

                if (!errorNote.isValid()) return apiUtils.sendResponse(400, errorNote.errorMessage);

                queries.errorNotes.create(errorNote, function(errorNoteId) {
                    if (!errorNoteId) return apiUtils.sendResponse(500, "Error saving error note to database.");

                    apiUtils.sendResponse(201, {errorNoteId: errorNoteId});

                });

            });
        });

    },

    update: function () {

        const errorNoteId = utils.toInt(req.params.errorNoteId),
            userId = utils.toInt(req.body.userId);

        if (!errorNoteId) return apiUtils.sendResponse(400, "Missing error note ID.");
        if (!userId) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.errorNotes.get(errorNoteId, function (errorNote) {
            if (errorNote.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error note does not exist.");

            queries.users.get(userId, function(user) {
                if (user.accountId !== exports.accountId) return apiUtils.sendResponse(403, "User does not exist.");

                errorNote.message = req.body.message;
                errorNote.userId = userId;

                if (!errorNote.isValid()) return apiUtils.sendResponse(400, errorNote.errorMessage);

                queries.errorNotes.update(errorNote, function (numUpdated) {
                    if (!numUpdated) return apiUtils.sendResponse(500, "Error saving error note to database.");

                    apiUtils.sendResponse(201);

                });

            });
        });

    },

    delete: function () {

        const errorNoteId = utils.toInt(req.params.errorNoteId);

        if (!errorNoteId) return apiUtils.sendResponse(400, "Missing error note ID.");

        queries.errorNotes.get(errorNoteId, function (errorNote) {
            if (errorNote.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Error note does not exist.");

            queries.errorNotes.delete(req.params.errorNoteId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(500, "Error deleting from database.");

                apiUtils.sendResponse(200);

            });

        });

    }

};

exports.user = {

    getSingle: function () {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.users.get(userId, function(user) {
            if (user.accountId !== exports.accountId) return apiUtils.sendResponse(403, "User does not exist.");

            apiUtils.sendResponse(200, user);

        });

    },

    getAllInAccount: function () {

        queries.users.getAllByAccountId(exports.accountId, function(users) {
            apiUtils.sendResponse(200, users);
        });

    },

    create: function () {

        let user = new models.User(
            exports.accountId,
            req.body.name,
            req.body.email,
            req.body.phone,
            req.body.password
        );

        if (!user.isValid()) return apiUtils.sendResponse(400, user.errorMessage);

        queries.users.create(user, function(userId) {
            if (!userId) return apiUtils.sendResponse(500, "Error saving user to database.");

            apiUtils.sendResponse(201, {userId: userId});

        });

    },

    update: function () {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.users.get(userId, function(user) {
            if (user.accountId !== exports.accountId) return apiUtils.sendResponse(403, "User does not exist.");

            user.name = req.body.name;
            user.email = req.body.email;
            user.phone = req.body.phone;
            user.password = req.body.password;

            if (!user.isValid()) return apiUtils.sendResponse(400, user.errorMessage);

            queries.users.update(user, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(500, "Error saving user to database.");

                apiUtils.sendResponse(201);

            });

        });

    },

    delete: function () {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.users.get(userId, function(user) {
            if (user.accountId !== exports.accountId) return apiUtils.sendResponse(403, "User does not exist.");

            queries.users.delete(user.userId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(500, "Error deleting from database.");

                apiUtils.sendResponse(200);

            });

        });

    }

};

exports.monitor = {

    getSingle: function () {

        const monitorId = utils.toInt(req.params.monitorId);

        if (!monitorId) return apiUtils.sendResponse(400, "Missing monitor ID.");

        queries.monitors.get(monitorId, function(monitor) {
            if (monitor.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Monitor does not exist.");

            apiUtils.sendResponse(200, monitor);

        });

    },

    getAllInAccount: function () {

        queries.monitors.getAllByAccountId(exports.accountId, function(monitors) {
            apiUtils.sendResponse(200, monitors);
        });

    },

    create: function () {

        let monitor = new models.Monitor(
            exports.accountId,
            req.body.product,
            req.body.environment,
            req.body.endpointUri,
            req.body.intervalSeconds
        );

        if (!monitor.isValid()) return apiUtils.sendResponse(400, monitor.errorMessage);

        queries.monitors.create(monitor, function(monitorId) {
            if (!monitorId) return apiUtils.sendResponse(500, "Error saving monitor to database.");

            apiUtils.sendResponse(201, {monitorId: monitorId});

        });

    },

    update: function () {

        const monitorId = utils.toInt(req.params.monitorId);

        if (!monitorId) return apiUtils.sendResponse(400, "Missing monitor ID.");

        queries.monitors.get(monitorId, function(monitor) {
            if (monitor.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Monitor does not exist.");

            monitor.product = req.body.product;
            monitor.environment = req.body.environment;
            monitor.endpointUri = req.body.endpointUri;
            monitor.intervalSeconds = utils.toInt(req.body.intervalSeconds);

            if (!monitor.isValid()) return apiUtils.sendResponse(400, monitor.errorMessage);

            queries.monitors.update(monitor, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(500, "Error saving monitor to database.");

                apiUtils.sendResponse(201);

            });
        });

    },

    delete: function () {

        const monitorId = utils.toInt(req.params.monitorId);

        if (!monitorId) return apiUtils.sendResponse(400, "Missing monitor ID.");

        queries.monitors.get(monitorId, function(monitor) {
            if (monitor.accountId !== exports.accountId) return apiUtils.sendResponse(403, "Monitor does not exist.");

            queries.monitors.delete(req.params.monitorId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(500, "Error deleting from database.");

                apiUtils.sendResponse(200);

            });

        });

    }

};

const apiUtils = {

    sendResponse: function (statusCode, returnData) {

        res.writeHead (statusCode, {"Content-Type": "application/json"});

        // return if no data to send
        if (!returnData) res.end();

        // if return data is a string, assume an error message
        else if (typeof returnData === "string") res.end(JSON.stringify({error: returnData}));

        // for all others, return the provided object, stripping out any unwanted parameters
        else res.end(JSON.stringify(apiUtils.stripReturnObjectProperties(returnData)));

    },

    // Removes object properties that should never be available in API responses.
    stripReturnObjectProperties: function(object) {

        if (!object) return object;

        if (Array.isArray(object)) {
            for (var i = 0; i < object.length; i++) {
                delete object[i].accountId;
                delete object[i].errorMessage;
            }
        }
        else {
            delete object.accountId;
            delete object.errorMessage;
        }

        return object;

    }

};
