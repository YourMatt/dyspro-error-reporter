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
    uriMonitor = require("./urimonitor"),
    utils = require("./utilities");

// Processes authentication requests.
exports.authenticate = function (req, res, callback) {

    // load authentication data
    let header = req.headers["authorization"] || "",
        token = header.split(/\s+/).pop() || "",
        auth = new Buffer(token, "base64").toString(),
        parts = auth.split(/:/),
        userName = parts[0],
        apiKey = parts[1];

    // use auth token if provided
    if (userName && apiKey) {
        queries.accounts.getByApiKey(req.db, userName, apiKey, callback);
    }

    // use session if no auth token, and user logged into the session
    else if (req.session.data.user.accountId) {
        let account = new models.Account(); // skipping query from DB because account ID is only needed
        account.accountId = req.session.data.user.accountId;
        callback(account);
    }

    // return if not authenticated
    else apiUtils.sendResponse(res, 401, "Could not authenticate. Check your API Key.");

};

// Processes error requests.
exports.error = {

    getSingle: function (req, res) {

        const errorId = utils.toInt(req.params.errorId);

        if (!errorId) return apiUtils.sendResponse(res, 400, "Missing error ID.");

        queries.errors.get(req.db, errorId, function (error) {
            if (error.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error does not exist.");

            apiUtils.sendResponse(res, 200, error);

        });

    },

    getLatestForEnvironment: function (req, res) {

        let sinceDate = req.params.sinceDate;
        if (!sinceDate) sinceDate = "2018-01-01T00:00:00.000Z"; // default to beginning of time if no date set

        apiUtils.loadEnvironmentId(req, res, req.params.environment, function(environmentId) {

            queries.errorOccurrences.getLatestByAccountAndEnvironment(
                req.db,
                req.accountId,
                environmentId,
                sinceDate,
                function (errors) {
                    apiUtils.sendResponse(res, 200, errors);
                }
            )

        });

    },

    create: function (req, res) {

        apiUtils.loadProductAndEnvironmentIds(req, res, req.body.product, req.body.environment, function (productId, environmentId) {

            let error = new models.Error(
                req.accountId,
                productId, "",
                req.body.stackTrace
            );

            if (!error.isValid()) return apiUtils.sendResponse(res, 400, error.errorMessage);

            queries.errors.create(req.db, error, function (errorId) {
                if (!errorId) return apiUtils.sendResponse(res, 500, "Error saving the error to the database.");

                let errorOccurrence = new models.ErrorOccurrence(
                    errorId,
                    environmentId, "",
                    req.body.message,
                    req.body.server,
                    req.body.userName
                );

                if (!errorOccurrence.isValid()) return apiUtils.sendResponse(res, 400, error.errorMessage);

                queries.errorOccurrences.create(req.db, errorOccurrence, function (errorOccurrenceId) {
                    if (!errorOccurrenceId) return apiUtils.sendResponse(res, 500, "Error saving error occurrence to database. The error definition was saved.");

                    // return if no files to attach to the error occurrence
                    if (!req.files.length) {
                        return apiUtils.sendResponse(res, 201, {
                            errorId: errorId,
                            errorOccurrenceId: errorOccurrenceId
                        });
                    }

                    let numAttachmentsSaved = 0;
                    for (let i = 0; i < req.files.length; i++) {
                        queries.errorAttachments.create(
                            req.db,
                            errorOccurrenceId,
                            req.files[i],
                            function (success) {
                                // TODO: Handle attachment save error - currently success is always true

                                numAttachmentsSaved++;
                                if (numAttachmentsSaved === req.files.length) {
                                    return apiUtils.sendResponse(res, 201, {
                                        errorId: errorId,
                                        errorOccurrenceId: errorOccurrenceId
                                    });
                                }

                            }
                        )
                    }

                });

            });

        });

    }

};

// Processes error note requests.
exports.errorNotes = {

    getSingle: function (req, res) {

        const errorNoteId = utils.toInt(req.params.errorNoteId);

        if (!errorNoteId) return apiUtils.sendResponse(res, 400, "Missing error note ID.");

        queries.errorNotes.get(req.db, errorNoteId, function (errorNote) {
            if (errorNote.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error note does not exist.");

            apiUtils.sendResponse(res, 200, errorNote);

        });

    },

    getAllForError: function (req, res) {

        const errorId = utils.toInt(req.params.errorId);

        if (!errorId) return apiUtils.sendResponse(res, 400, "Missing error ID.");

        queries.errors.get(
            req.db,
            errorId,
            function (error) {
                if (error.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error does not exist.");

                queries.errorNotes.getAllByErrorId(req.db, error.errorId, function (errorNote) {
                    apiUtils.sendResponse(res, 200, errorNote);
                });

            }
        );

    },

    create: function (req, res) {

        const errorId = utils.toInt(req.body.errorId),
            userId = utils.toInt(req.body.userId);

        if (!errorId) return apiUtils.sendResponse(res, 400, "Missing error ID.");
        if (!userId) return apiUtils.sendResponse(res, 400, "Missing user ID.");

        queries.errors.get(req.db, errorId, function(error) {
            if (error.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error does not exist.");

            queries.users.get(req.db, userId, function(user) {
                if (user.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "User does not exist.");

                let errorNote = new models.ErrorNote(
                    req.accountId,
                    errorId,
                    req.body.message,
                    userId
                );

                if (!errorNote.isValid()) return apiUtils.sendResponse(res, 400, errorNote.errorMessage);

                queries.errorNotes.create(req.db, errorNote, function(errorNoteId) {
                    if (!errorNoteId) return apiUtils.sendResponse(res, 500, "Error saving error note to database.");

                    apiUtils.sendResponse(res, 201, {errorNoteId: errorNoteId});

                });

            });
        });

    },

    update: function (req, res) {

        const errorNoteId = utils.toInt(req.params.errorNoteId),
            userId = utils.toInt(req.body.userId);

        if (!errorNoteId) return apiUtils.sendResponse(res, 400, "Missing error note ID.");
        if (!userId) return apiUtils.sendResponse(res, 400, "Missing user ID.");

        queries.errorNotes.get(req.db, errorNoteId, function (errorNote) {
            if (errorNote.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error note does not exist.");

            queries.users.get(req.db, userId, function(user) {
                if (user.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "User does not exist.");

                errorNote.message = req.body.message;
                errorNote.userId = userId;

                if (!errorNote.isValid()) return apiUtils.sendResponse(res, 400, errorNote.errorMessage);

                queries.errorNotes.update(req.db, errorNote, function (numUpdated) {
                    if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error saving error note to database.");

                    apiUtils.sendResponse(res, 201);

                });

            });
        });

    },

    delete: function (req, res) {

        const errorNoteId = utils.toInt(req.params.errorNoteId);

        if (!errorNoteId) return apiUtils.sendResponse(res, 400, "Missing error note ID.");

        queries.errorNotes.get(req.db, errorNoteId, function (errorNote) {
            if (errorNote.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Error note does not exist.");

            queries.errorNotes.delete(req.db, req.params.errorNoteId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error deleting from database.");

                apiUtils.sendResponse(res, 200);

            });

        });

    }

};

// Processes user requests.
exports.user = {

    getSingle: function (req, res) {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(res, 400, "Missing user ID.");

        queries.users.get(req.db, userId, function(user) {
            if (user.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "User does not exist.");

            apiUtils.sendResponse(res, 200, user);

        });

    },

    getAllInAccount: function (req, res) {

        queries.users.getAllByAccountId(req.db, req.accountId, function(users) {
            apiUtils.sendResponse(res, 200, users);
        });

    },

    authenticate: function (req, res) {

        const email = req.body.email,
            password = req.body.password;

        if (!email) return apiUtils.sendResponse(res, 400, "Missing email.");
        if (!password) return apiUtils.sendResponse(res, 400, "Missing password.");

        queries.users.getByLogin(
            req.db,
            req.body.email,
            req.body.password,
            function(user) {
                if (!user.userId) return apiUtils.sendResponse(res, 401, "Invalid email or password.");

                apiUtils.sendResponse(res, 200);

            }
        );

    },

    create: function (req, res) {

        let user = new models.User(
            req.accountId,
            req.body.name,
            req.body.email,
            req.body.phone,
            req.body.password
        );

        if (!user.isValid()) return apiUtils.sendResponse(res, 400, user.errorMessage);

        queries.users.create(req.db, user, function(userId) {
            if (!userId) return apiUtils.sendResponse(res, 500, "Error saving user to database.");

            apiUtils.sendResponse(res, 201, {userId: userId});

        });

    },

    update: function (req, res) {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(res, 400, "Missing user ID.");

        queries.users.get(req.db, userId, function(user) {
            if (user.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "User does not exist.");

            user.name = req.body.name;
            user.email = req.body.email;
            user.phone = req.body.phone;
            user.password = req.body.password;

            if (!user.isValid()) return apiUtils.sendResponse(res, 400, user.errorMessage);

            queries.users.update(req.db, user, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error saving user to database.");

                apiUtils.sendResponse(res, 201);

            });

        });

    },

    delete: function (req, res) {

        const userId = utils.toInt(req.params.userId);

        if (!userId) return apiUtils.sendResponse(res, 400, "Missing user ID.");

        queries.users.get(req.db, userId, function(user) {
            if (user.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "User does not exist.");

            queries.users.delete(req.db, user.userId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error deleting from database.");

                apiUtils.sendResponse(res, 200);

            });

        });

    }

};

// Processes monitor requests.
exports.monitor = {

    getSingle: function (req, res) {

        const monitorId = utils.toInt(req.params.monitorId);

        if (!monitorId) return apiUtils.sendResponse(res, 400, "Missing monitor ID.");

        queries.monitors.get(req.db, monitorId, function(monitor) {
            if (monitor.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Monitor does not exist.");

            apiUtils.sendResponse(res, 200, monitor);

        });

    },

    getAllInAccount: function (req, res) {

        queries.monitors.getAllByAccountId(req.db, req.accountId, function(monitors) {
            apiUtils.sendResponse(res, 200, monitors);
        });

    },

    getAllForEnvironment: function (req, res) {

        queries.monitors.getAllForEnvironment(req.db, req.accountId, req.params.environment, function(monitors) {
            apiUtils.sendResponse(res, 200, monitors);
        });

    },

    create: function (req, res) {

        apiUtils.loadProductAndEnvironmentIds(req, res, req.body.product, req.body.environment, function(productId, environmentId) {

            let monitor = new models.Monitor(
                req.accountId,
                productId, "",
                environmentId, "",
                req.body.endpointUri,
                req.body.intervalSeconds
            );

            if (!monitor.isValid()) return apiUtils.sendResponse(res, 400, monitor.errorMessage);

            queries.monitors.create(req.db, monitor, function (monitorId) {
                if (!monitorId) return apiUtils.sendResponse(res, 500, "Error saving monitor to database.");

                apiUtils.sendResponse(res, 201, {monitorId: monitorId});

            });

        });

    },

    update: function (req, res) {

        const monitorId = utils.toInt(req.params.monitorId);
        if (!monitorId) return apiUtils.sendResponse(res, 400, "Missing monitor ID.");

        queries.monitors.get(req.db, monitorId, function (monitor) {
            if (monitor.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Monitor does not exist.");

            apiUtils.loadProductAndEnvironmentIds(req, res, req.body.product, req.body.environment, function(productId, environmentId) {

                monitor.productId = productId;
                monitor.environmentId = environmentId;
                monitor.endpointUri = req.body.endpointUri;
                monitor.intervalSeconds = utils.toInt(req.body.intervalSeconds);

                if (!monitor.isValid()) return apiUtils.sendResponse(res, 400, monitor.errorMessage);

                queries.monitors.update(req.db, monitor, function (numUpdated) {
                    if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error saving monitor to database.");

                    apiUtils.sendResponse(res, 201);

                });

            });

        });

    },

    delete: function (req, res) {

        const monitorId = utils.toInt(req.params.monitorId);

        if (!monitorId) return apiUtils.sendResponse(res, 400, "Missing monitor ID.");

        queries.monitors.get(req.db, monitorId, function(monitor) {
            if (monitor.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Monitor does not exist.");

            queries.monitors.delete(req.db, req.params.monitorId, function (numUpdated) {
                if (!numUpdated) return apiUtils.sendResponse(res, 500, "Error deleting from database.");

                apiUtils.sendResponse(res, 200);

            });

        });

    },

    testUri: function (req, res) {

        uriMonitor.getResponse(req.params.uri, (monitorResponse) => {
            apiUtils.sendResponse(res, 200, monitorResponse);
        });

    },

    getStats: function (req, res) {

        const monitorId = utils.toInt(req.params.monitorId),
            period = req.params.period;

        if (!monitorId) return apiUtils.sendResponse(res, 400, "Missing monitor ID.");

        // validate that the time period is an accepted type
        const validPeriods = ["day", "week", "month", "year"];
        if (validPeriods.indexOf(period) < 0) return apiUtils.sendResponse(res, 400, "Invalid time period.");

        // load the monitor
        queries.monitors.get(req.db, monitorId, function(monitor) {
            if (monitor.accountId !== req.accountId) return apiUtils.sendResponse(res, 403, "Monitor does not exist.");

            if (period === "day") {
                queries.monitorResults.loadStatsForDay(req.db, monitorId, monitor.intervalSeconds, function (stats) {

                    apiUtils.sendResponse(res, 200, stats);

                });
            }

            // TODO: Add functionality for other time periods
            else {
                apiUtils.sendResponse(res, 400, "Time period not yet supported.");
            }

        });

    },

};

// Processes Product requests.
exports.product = {

    getAllInAccount: function (req, res) {

        queries.products.getAllByAccountId(req.db, req.accountId, function(products) {
            apiUtils.sendResponse(res, 200, products);
        });

    }

};

// Processes Environment requests.
exports.environment = {

    getAllInAccount: function (req, res) {

        queries.environments.getAllByAccountId(req.db, req.accountId, function(environments) {
            apiUtils.sendResponse(res, 200, environments);
        });

    }

};

// Common methods to this module.
const apiUtils = {

    sendResponse: function (res, statusCode, returnData) {

        res.writeHead (statusCode, {"Content-Type": "application/json"});

        // return if no data to send
        if (!returnData) res.end("{}");

        // if return data is a string, assume an error message
        else if (typeof returnData === "string") res.end(JSON.stringify({error: returnData}));

        // for all others, return the provided object, stripping out any unwanted parameters
        else res.end(JSON.stringify(apiUtils.stripReturnObjectProperties(returnData)));

    },

    // Removes object properties that should never be available in API responses.
    stripReturnObjectProperties: function(object) {

        if (!object) return object;

        if (Array.isArray(object)) {
            for (let i = 0; i < object.length; i++) {
                delete object[i].accountId;
                delete object[i].errorMessage;
            }
        }
        else {
            delete object.accountId;
            delete object.errorMessage;
        }

        return object;

    },

    // Finds the IDs for product and environment.
    // callback(int: Product ID, int: Environment ID)
    loadProductAndEnvironmentIds: function(req, res, productName, environmentName, callback) {

        apiUtils.loadProductId(req, res, productName, function(productId) {
            apiUtils.loadEnvironmentId(req, res, environmentName, function(environmentId) {
                callback(productId, environmentId);
            });
        });

    },

    // Finds the ID for product name.
    // callback(int: Product ID)
    loadProductId: function(req, res, name, callback) {

        queries.products.getByName(
            req.db,
            req.accountId,
            name,
            function(product) {

                // return if found a product
                if (product.productId) return callback(product.productId);

                // create the product if does not already exist
                product.accountId = req.accountId;
                product.name = name;

                if (!product.isValid()) return apiUtils.sendResponse(res, 400, product.errorMessage);

                queries.products.create(
                    req.db,
                    product,
                    function (productId) {
                        if (!productId) return apiUtils.sendResponse(res, 500, "Error saving product to database.");

                        callback(productId);

                    }
                );

            }
        );

    },

    // Finds the ID for environment name.
    // callback(int: Environment ID)
    loadEnvironmentId: function(req, res, name, callback) {

        queries.environments.getByName(req.db, req.accountId, name, function(environment) {

            // return if found an environment
            if (environment.environmentId) return callback(environment.environmentId);

            // create the environment if does not already exist
            environment.accountId = req.accountId;
            environment.name = name;

            if (!environment.isValid()) return apiUtils.sendResponse(res, 400, environment.errorMessage);

            queries.environments.create(
                req.db,
                environment,
                function (environmentId) {
                    if (!environmentId) return apiUtils.sendResponse(res, 500, "Error saving environment to database.");

                    callback(environmentId);

                }
            );

        });

    }

};
