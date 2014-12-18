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
                    var queryValues = (req.body.product) ? req.body : req.query;
                    var error_data = {
                        account_id: account_data.account_id,
                        product: queryValues.product,
                        environment: queryValues.environment,
                        server: queryValues.server,
                        message: queryValues.message,
                        user_name: queryValues.user_name,
                        stack_trace: queryValues.stack_trace
                    };

                    // TODO: Add validation at this point
                    if (! error_data.product) {
                        that.sendResponse (res, that.getErrorResponseData ("No product."));
                        return;
                    }

                    // save the error to the database
                    database.query.logError (
                        error_data,
                        req.files,
                        function (error_message) {
                            if (error_message) that.sendResponse (res, that.getErrorResponseData(error_message));
                            else that.sendResponse (res, that.getSuccessResponseData());
                        }
                    );

                    break;
                case "errors":

                    // pull all errors associated to a specific error ID if provided
                    if ( req.params.id ) {
                        database.query.getErrorOccurrencesByErrorId (account_data.account_id, req.params.type, req.params.id, function (results) {
                            that.sendResponse (res, that.getSuccessResponseData (results));
                        });
                    }

                    // show a list of the latest errors if no ID provided
                    else {
                        that.getLatestErrors(account_data.account_id, req.params.type, 20, function (results, error_message) {
                            if (error_message) that.sendResponse(res, that.getErrorResponseData(error_message));
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

    getFileType: function (file_name) {

        var file_name_parts = file_name.split (".");
        return file_name_parts[file_name_parts.length - 1].toLowerCase ();

    },

    getLatestErrors: function (account_id, environment, num_errors, callback) {

        database.query.getLatestErrorOccurrences (account_id, environment, num_errors, function (results) {

            // return error if no results
            if (! results.rows.length) {
                callback ({}, "No errors found.");
                return;
            }

            callback (results.rows);

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