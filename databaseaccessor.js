var db_location, pg;

exports.init = function (init_db_location, init_pg) {
    db_location = init_db_location;
    pg = init_pg;
}

exports.query = {

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ACCOUNTS TABLE
     *
     ******************************************************************************************************************/

    // load account by api key
    getAccountByApiKey: function (api_key, callback) {

        this.run (
            "select * " +
            "from   accounts " +
            "where  api_key = $1",
            [api_key],
            function (result) {
                if (result.rows.length != 1) callback ();
                else callback (result.rows[0]);
            }
        );

    },

    // get all environments
    getAccountEnvironments: function (account_id, callback) {

        this.run (
                "select     distinct eo.environment " +
                "from       errors e " +
                "inner join error_occurrences eo on eo.error_id = e.error_id " +
                "where      e.account_id = $1",
            [account_id],
            function (result) {
                var environments = [];
                if (result.rows) {
                    for (var i = 0; i < result.rows.length; i++) {
                        environments.push (result.rows[i].environment);
                    }
                }
                callback (environments);
            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH USERS TABLE
     *
     ******************************************************************************************************************/

    // authenticate the user
    getUserByLogin: function (email, password, callback) {

        this.run (
            "select * " +
            "from   users " +
            "where  email = $1 " +
            "and    password = md5($2)",
            [email, password],
            function (result) {
                if (result.rows.length != 1) callback ();
                else callback (result.rows[0]);
            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERRORS TABLE
     *
     ******************************************************************************************************************/

    // load an existing error by product and stack trace
    getErrorByData: function (error_data, callback) {

        this.run (
            "select error_id " +
            "from   errors " +
            "where  account_id = $1 " +
            "and    product = $2 " +
            "and    md5(stack_trace) = md5($3)",
            [error_data.account_id, error_data.product, error_data.stack_trace],
            function (result) {

                if (result.rows.length) callback (result.rows[0].error_id);
                else callback ();

            }
        );

    },

    // save a new error type
    logError: function (error_data, files, callback) {
        var that = this;

        this.getErrorByData (
            error_data,
            function (error_id) {

                // add to the existing error if found
                if (error_id) {
                    error_data.error_id = error_id;
                    that.logErrorOccurrence (
                        error_data,
                        files,
                        callback
                    );
                }

                // create a new error and add the error occurrence if not found
                else {
                    that.run (
                        "insert into    errors " +
                        "(              account_id, product, stack_trace) " +
                        "values (       $1, $2, $3) " +
                        "returning      error_id",
                        [error_data.account_id, error_data.product, error_data.stack_trace],
                        function (result) {
                            if (! result.rows) {
                                callback ("Error saving to errors table.");
                                return;
                            }

                            // save the new occurrence of the error
                            error_data.error_id = result.rows[0].error_id;
                            that.logErrorOccurrence (
                                error_data,
                                files,
                                callback
                            );

                        }
                    );
                }

            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERROR_OCCURRENCES TABLE
     *
     ******************************************************************************************************************/

    // retrieve the latest errors
    getLatestErrorOccurrences: function (account_id, limit, callback) {

        this.run (
            "select     eo.*, e.* " +
            "from       error_occurrences eo " +
            "inner join errors e on e.error_id = eo.error_id " +
            "where      e.account_id = $1 " +
            "order by   date desc " +
            "limit $2   offset 0",
            [account_id, limit],
            callback
        );

    },

    // save a new occurrence of an existing error
    logErrorOccurrence: function (error_data, files, callback) {
        var that = this;

        this.run (
            "insert into    error_occurrences " +
            "(              error_id, environment, message, server, user_name) " +
            "values (       $1, $2, $3, $4, $5) " +
            "returning      error_occurrence_id",
            [error_data.error_id, error_data.environment, error_data.message, error_data.server, error_data.user_name],
            function (result) {
                if (! result.rows) callback ("Error saving to the error_occurrences table.");

                // save the attachments provided with the error
                var error_occurrence_id = result.rows[0].error_occurrence_id;
                if (files.length) that.logErrorAttachments (error_occurrence_id, files, callback);
                else callback ();

            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERROR_ATTACHMENTS TABLE
     *
     ******************************************************************************************************************/

    // load an existing error by product and stack trace
    getErrorAttachment: function (error_occurrence_id, file_name, callback) {

        this.run (
            "select * " +
            "from   error_attachments " +
            "where  error_occurrence_id = $1 " +
            "and    file_name = $2",
            [error_occurrence_id, file_name],
            function (result) {

                if (result.rows.length) callback (result.rows[0]);
                else callback ();

            }
        );

    },

    // save a file related to an error occurrence
    numAttachmentsSaved: 0,
    logErrorAttachments: function (error_occurrence_id, files, callback) {
        var that = this;

        this.numAttachmentsSaved = 0; // reset the saved attachments counter
        for (var i = 0; i < files.length; i++) {

            this.run (
                "insert into    error_attachments " +
                "(              error_occurrence_id, file_name, file_type, source) " +
                "values (       $1, $2, $3, $4)",
                [error_occurrence_id, files[i].file_name, files[i].file_type, files[i].source],
                function (result) {

                    that.numAttachmentsSaved++;
                    if (that.numAttachmentsSaved == files.length) callback ();

                }
            );

        }

    },

    /*******************************************************************************************************************
     *
     * GENERAL METHODS
     *
     ******************************************************************************************************************/

    // run a query against the database
    run: function (query, fields, callback) {

        pg.connect (db_location, function (err, client, done) {
            if (err) {
                console.error (err);
                callback ({});
            }
            else {
                client.query (query, fields, function (err, result) {
                    done ();
                    if (err) {
                        console.error (err);
                        callback ({});
                    }
                    else callback (result);
                });
            }
        });

    }

}