const database = require ("./databaseaccessor"),
    models = require("./models/all"),
    queries = require("./queries/all"),
    utils = require("./utilities")
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

        queries.errors.get(
            req.params.errorId,
            function (error) {
                apiUtils.sendResponse(200, error);
            }
        );

    },

    getLatestForEnvironment: function () {

        queries.errorOccurrences.getLatestByAccountAndEnvironment(
            exports.accountId,
            req.params.environment,
            utils.toInt(req.params.count),
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

        if (!error.isValid()) {
            return apiUtils.sendResponse(400, error.errorMessage);
        }

        queries.errors.create(
            error,
            function (errorId) {
                if (!errorId) return apiUtils.sendResponse(500, "Error saving the error to the database.");

                let errorOccurrence = new models.ErrorOccurrence(
                    errorId,
                    req.body.environment,
                    req.body.message,
                    req.body.server,
                    req.body.userName
                );

                if (!errorOccurrence.isValid()) {
                    return apiUtils.sendResponse(400, error.errorMessage);
                }

                queries.errorOccurrences.create(
                    errorOccurrence,
                    function (errorOccurrenceId) {
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
                                        apiUtils.sendResponse(201, {
                                            errorId: errorId,
                                            errorOccurrenceId: errorOccurrenceId
                                        });
                                    }

                                }
                            )
                        }

                    }
                );

            }
        );

    }

};

exports.user = {

    getSingle: function () {

        if (utils.toInt(req.params.userId) === 0)
            return apiUtils.sendResponse(400, "Missing user ID.");

        queries.users.get(req.params.userId, function(user) {
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

        if (!user.isValid()) {
            return apiUtils.sendResponse(400, user.errorMessage);
        }

        queries.users.create(user, function(userId) {
            if (!userId) return apiUtils.sendResponse(500, "Error saving user to database.");

            apiUtils.sendResponse(201, {userId: userId});

        });

    },

    update: function () {

        if (utils.toInt(req.params.userId) === 0) return apiUtils.sendResponse(400, "Missing user ID.");

        let user = new models.User(
            exports.accountId,
            req.body.name,
            req.body.email,
            req.body.phone,
            req.body.password,
            0,
            req.params.userId
        );

        if (!user.isValid()) {
            return apiUtils.sendResponse(400, user.errorMessage);
        }

        queries.users.update(user, function(numUpdated) {
            if (!numUpdated) return apiUtils.sendResponse(500, "Error saving user to database.");

            apiUtils.sendResponse(201);

        });

    },

    delete: function () {

        if (utils.toInt(req.params.userId) === 0) return apiUtils.sendResponse(400, "Missing user ID.");

        queries.users.delete(req.params.userId, function(numUpdated) {
            if (!numUpdated) return apiUtils.sendResponse(500, "Error deleting from database.");

            apiUtils.sendResponse(200);

        });

    }

};

exports.monitor = {

    getSingle: function () {

        if (utils.toInt(req.params.monitorId) === 0)
            return apiUtils.sendResponse(400, "Missing monitor ID.");

        queries.monitors.get(req.params.monitorId, function(monitor) {
            apiUtils.sendResponse(200, monitor);
        });

    },

    getAllInAccount: function () {

        queries.monitors.getAllByAccountId(exports.accountId, function(monitors) {
            apiUtils.sendResponse(200, monitors);
        });

    },

    create: function () {

        var monitor = new models.Monitor(
            exports.accountId,
            req.body.product,
            req.body.environment,
            req.body.endpointUri,
            req.body.intervalSeconds
        );

        if (!monitor.isValid()) {
            return apiUtils.sendResponse(400, monitor.errorMessage);
        }

        queries.monitors.create(monitor, function(monitorId) {
            if (!monitorId) return apiUtils.sendResponse(500, "Error saving monitor to database.");

            apiUtils.sendResponse(201, {monitorId: monitorId});

        });

    },

    update: function () {

        if (utils.toInt(req.params.monitorId) === 0) return apiUtils.sendResponse(400, "Missing monitor ID.");

        var monitor = new models.Monitor(
            exports.accountId,
            req.body.product,
            req.body.environment,
            req.body.endpointUri,
            req.body.intervalSeconds,
            req.params.monitorId
        );

        if (!monitor.isValid()) {
            return apiUtils.sendResponse(400, monitor.errorMessage);
        }

        queries.monitors.update(monitor, function(numUpdated) {
            if (!numUpdated) return apiUtils.sendResponse(500, "Error saving monitor to database.");

            apiUtils.sendResponse(201);

        });

    },

    delete: function () {

        if (utils.toInt(req.params.monitorId) === 0) return apiUtils.sendResponse(400, "Missing monitor ID.");

        queries.monitors.delete(req.params.monitorId, function(numUpdated) {
            if (!numUpdated) return apiUtils.sendResponse(500, "Error deleting from database.");

            apiUtils.sendResponse(200);

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
