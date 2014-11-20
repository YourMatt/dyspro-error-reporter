var database;
var sessionManager;
var files = [];

exports.init = function (init_database, init_session_manager) {
    database = init_database;
    sessionManager = init_session_manager;
};

exports.processor = {

    handleRequest: function (req, res) {
        var that = this;

        // authenticate all api requests
        this.authenticate (req.params.key, function (account_data) {

            // return response for unauthenticated accounts
            if (! account_data) {
                that.sendResponse (res, that.getErrorResponseData ("Not authenticated."));
                return;
            }

            // evaluate the method
            switch (req.params.method) {
                case "log":

                    // load values - need to either use req.query or req.body depending which is available - scenarios
                    // allow for both depending on post and whether files are attached or not
                    var queryValues = (req.query.stack_trace) ? req.query : req.body;
                    var error_data = {
                        account_id: account_data.account_id,
                        product: queryValues.product,
                        environment: queryValues.environment,
                        server: queryValues.server,
                        message: queryValues.message,
                        user_name: queryValues.user_name,
                        stack_trace: queryValues.stack_trace
                    };

                    that.logError (req, error_data, function (error_message) {
                        if (error_message) that.sendResponse (res, that.getErrorResponseData (error_message));
                        else that.sendResponse (res, that.getSuccessResponseData ());
                    });

                    break;
                case "errors":

                    that.getLatestErrors (account_data.account_id, req.params.type, 20, function (results, error_message) {
                        if (error_message) that.sendResponse (res, that.getErrorResponseData (error_message));
                        else that.sendResponse (res, that.getSuccessResponseData (results));
                    });

                    break;
                default:
                    that.sendResponse (res, that.getErrorResponseData ("Method not implemented."));
                    break;
            }

        });

    },

    authenticate: function (api_key, callback) {

        // use session if provided - only works for ajax use and not across web service
        if (api_key == "session") {
            var account_data;
            if (sessionManager.data.account_id) {
                account_data = {
                    account_id: sessionManager.data.account_id
                };
            }
            callback (account_data);
        }

        // check for the key association to the account within the database
        else {
            database.query.getAccountByApiKey(api_key, callback);
        }

    },

    logError: function (req, error_data, callback) {

        this.uploadFiles (req, function (error_message) {

            // return if an error loading files
            if (error_message) {
                callback (error_message);
                return;
            }

            // save the base error type
            database.query.logError (
                error_data,
                files,
                callback
            );

        });

    },

    uploadFiles: function (req, callback) {
        var that = this;
        files = [];

        if (req.busboy) {

            // skip if query string not part of url - means post provided, but no file available
            // this is only applicable if set for body of post to be blank and use URL variables with post
            if (req.originalUrl.indexOf ("?") < 0) {
                callback ();
                return;
            }

            // open request to accept files
            req.pipe (req.busboy);

            // save files to local variable
            req.busboy.on ("file", function (field_name, file, file_name, encoding, mime_type) {

                // load the file data
                file.on ("data", function (data) {

                    var file_data = {
                        file_name: file_name,
                        file_type: that.getFileType(file_name),
                        source: data
                    };

                    files.push(file_data);

                });

            });

            // continue when all files have completed uploading
            req.busboy.on("finish", function () {
                callback();
            });
        }
        else callback ();

    },

    getFileType: function (file_name) {

        var file_name_parts = file_name.split (".");
        return file_name_parts[file_name_parts.length - 1].toLowerCase ();

    },

    getLatestErrors: function (account_id, environment, num_errors, callback) {

        database.query.getLatestErrorOccurrences (account_id, environment, num_errors, function (results) {

            // return error if no results
            if (! results.rows.length) callback ({}, "No errors found.");
            else callback (results.rows);

        });

    },

    getErrorResponseData: function (error_message) {

        var error = {
            error: error_message
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

    sendResponse: function (res, return_data) {

        res.writeHead (200, {"Content-Type": "application/json"});
        res.end (JSON.stringify (return_data));

    }

}