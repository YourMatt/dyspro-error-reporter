var database = require ("./databaseaccessor")
,   models = require("./models/all")
,   utils = require("./utilities")
// following are set by init
,   req = {}
,   res = {}
,   sessionManager = {};

exports.init = function (initReq, initRes, initSessionManager) {
    req = initReq;
    res = initRes;
    sessionManager = initSessionManager;
};

exports.processor = {

    handleRequestOLD: function (req, res, sessionManager) {
        var that = this;



        // authenticate all api requests
        this.authenticate (userName, password, sessionManager, function (accountData) {

            // return response for unauthenticated accounts
            if (! accountData) {
                that.sendResponse (res, that.getErrorResponseData ("Not authenticated."));
                return;
            }

            // evaluate the method
            switch (req.params.method) {
                case "log":

                    // load values - need to either use req.query or req.body depending which is available - scenarios
                    // allow for both depending on post and whether files are attached or not
                    var queryValues = (req.body.product) ? req.body : req.query;
                    var errorData = {
                        accountId: accountData.accountId,
                        product: queryValues.product,
                        environment: queryValues.environment,
                        server: queryValues.server,
                        message: queryValues.message,
                        userName: queryValues.userName,
                        stackTrace: queryValues.stackTrace
                    };

                    // TODO: Add validation at this point
                    if (! errorData.product) {
                        that.sendResponse (res, that.getErrorResponseData ("No product."));
                        return;
                    }

                    // save the error to the database
                    database.query.logError (
                        errorData,
                        req.files,
                        function (errorMessage) {
                            if (errorMessage) that.sendResponse (res, that.getErrorResponseData(errorMessage));
                            else that.sendResponse (res, that.getSuccessResponseData());
                        }
                    );

                    break;
                case "errors":

                    // pull all errors associated to a specific error ID if provided
                    if ( req.params.id ) {
                        database.query.getErrorOccurrencesByErrorId (accountData.accountId, req.params.type, req.params.id, function (results) {
                            that.sendResponse (res, that.getSuccessResponseData (results));
                        });
                    }

                    // show a list of the latest errors if no ID provided
                    else {
                        that.getLatestErrors(accountData.accountId, req.params.type, 20, function (results, errorMessage) {
                            if (errorMessage) that.sendResponse(res, that.getErrorResponseData(errorMessage));
                            else that.sendResponse (res, that.getSuccessResponseData (results));
                        });
                    }

                    break;
                default:
                    that.sendResponse (res, that.getErrorResponseData ("Method not implemented."));
                    break;
            }

        });

    },

    handleRequest: {

        monitor: {

            getSingle: function () {

                if (utils.toInt(req.params.accountId) === 0 || utils.toInt(req.params.monitorId) === 0)
                    return exports.processor.sendResponse(400, exports.processor.getErrorResponseData("Missing account ID or monitor ID."));

                database.query.monitors.get(req.params.monitorId, function(monitor) {

                    exports.processor.sendResponse(200, monitor);

                });

            },

            getAllByAccountId: function () {

                if (utils.toInt(req.params.accountId) === 0)
                    return exports.processor.sendResponse(400, exports.processor.getErrorResponseData("Missing account ID."));

                database.query.monitors.getAllByAccountId(req.params.accountId, function(monitors) {

                    exports.processor.sendResponse(200, monitors);

                });

            },

            create: function () {

                var monitor = new models.Monitor(
                    req.body.accountId,
                    req.body.product,
                    req.body.environment,
                    req.body.endpointUri,
                    req.body.intervalSeconds
                );

                if (!monitor.isValid()) {
                    return exports.processor.sendResponse(400, exports.processor.getErrorResponseData(monitor.errorMessage));
                }

                database.query.monitors.create(monitor, function(monitorId) {

                    if (!monitorId) return exports.processor.sendResponse(500, exports.processor.getErrorResponseData("Error saving monitor to database."));

                    exports.processor.sendResponse(201, {monitorId: monitorId});

                });

            },

            update: function () {

                if (utils.toInt(req.params.monitorId) === 0) return exports.processor.sendResponse(400, exports.processor.getErrorResponseData("Missing monitor ID."));

                var monitor = new models.Monitor(
                    req.body.accountId,
                    req.body.product,
                    req.body.environment,
                    req.body.endpointUri,
                    req.body.intervalSeconds,
                    req.params.monitorId
                );

                if (!monitor.isValid()) {
                    return exports.processor.sendResponse(400, exports.processor.getErrorResponseData(monitor.errorMessage));
                }

                database.query.monitors.update(monitor, function(numUpdated) {

                    if (!numUpdated) return exports.processor.sendResponse(500, exports.processor.getErrorResponseData("Error saving monitor to database."));

                    exports.processor.sendResponse(201);

                });

            },

            delete: function () {

                if (utils.toInt(req.params.monitorId) === 0) return exports.processor.sendResponse(400, exports.processor.getErrorResponseData("Missing monitor ID."));

                database.query.monitors.delete(req.params.monitorId, function(numUpdated) {

                    if (!numUpdated) return exports.processor.sendResponse(500, exports.processor.getErrorResponseData("Error deleting from database."));

                    exports.processor.sendResponse(200);

                });

            }

        }

    },

    authenticate: function (callback) {

        // load authentication data
        var header = req.headers["authorization"] || ""
        ,   token = header.split(/\s+/).pop() || ""
        ,   auth = new Buffer(token, "base64").toString()
        ,   parts = auth.split(/:/)
        ,   userName = parts[0]
        ,   apiKey = parts[1];

        // use auth token if provided
        if (userName && apiKey) {
            database.query.getAccountByApiKey(userName, apiKey, callback);
        }

        // use session if no auth token, and user logged into the session
        else if (sessionManager.data.user.accountId) {
            var account = new models.Account(); // skipping query from DB because account ID is only needed
            account.accountId = sessionManager.data.user.accountId;
            callback(account);
        }

        // return if not authenticated
        else callback();

    },

    getFileType: function (fileName) {

        var fileNameParts = fileName.split (".");
        return fileNameParts[fileNameParts.length - 1].toLowerCase ();

    },

    getLatestErrors: function (accountId, environment, numErrors, callback) {

        database.query.getLatestErrorOccurrences (accountId, environment, numErrors, function (results) {

            // return error if no results
            if (! results.length) {
                callback ({}, "No errors found.");
                return;
            }

            callback (results);

            /* // no longer including attachments on listings, so removing - leaving code in place in case proves useful enough to add back in
            // load attachments if errors found
            var resultCounter = 0;
            results.rows.forEach (function (result) {
                database.query.getErrorAttachments (result.error_occurrence_id, function (attachment_results) {

                    result.attachments = [];
                    if (attachment_results.rows.length) {
                        for (var i = 0; i < results.rows.length; i++) {
                            if (results.rows[i].error_occurrence_id == attachment_results.rows[0].error_occurrence_id) {
                                results.rows[i].attachments = attachment_results.rows;
                                break;
                            }
                        }
                    }

                    resultCounter++;
                    if (resultCounter == results.rows.length) {
                        callback (results.rows);
                    }

                });
            });
            /* */

        });

    },

    getErrorResponseData: function (errorMessage) {

        var error = {
            error: errorMessage
        };

        return error;

    },

    getSuccessResponseData: function (data) {

        var success = {
            status: "success",
            data: data
        };

        return success;

    },

    sendResponse: function (statusCode, returnData) {

        res.writeHead (statusCode, {"Content-Type": "application/json"});
        res.end ((returnData) ? JSON.stringify (returnData) : "");

    }

};
