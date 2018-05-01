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
            "from   Accounts " +
            "where  ApiKey = $1",
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
                "select     distinct eo.Environment " +
                "from       Errors e " +
                "inner join ErrorOccurrences eo on eo.ErrorId = e.ErrorId " +
                "where      e.AccountId = $1",
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
            "from   Users " +
            "where  Email = $1 " +
            "and    Password = md5($2)",
            [email, password],
            function (result) {
                if (!result.rows || result.rows.length != 1) callback ();
                else callback (result.rows[0]);
            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERRORS TABLE
     *
     ******************************************************************************************************************/

    // retrieve single error occurrence
    getError: function (error_id, callback) {

        this.run (
            "select     * " +
            "from       Errors " +
            "where      ErrorId = $1",
            [error_id],
            function (result) {
                if (result.rows && result.rows.length) callback (result.rows[0]);
                else callback ();
            }
        );

    },

    // load an existing error by product and stack trace
    getErrorByData: function (error_data, callback) {

        this.run (
            "select ErrorId " +
            "from   Errors " +
            "where  AccountId = $1 " +
            "and    Product = $2 " +
            "and    md5(StackTrace) = md5($3)",
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
                        "insert into    Errors " +
                        "(              AccountId, Product, StackTrace) " +
                        "values (       $1, $2, $3) " +
                        "returning      ErrorId",
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

    // retrieve single error occurrence
    getErrorOccurrence: function (error_occurrence_id, callback) {

        this.run (
            "select     eo.*, e.* " +
            "from       ErrorOccurrences eo " +
            "inner join Errors e on e.ErrorId = eo.ErrorId " +
            "where      eo.ErrorOccurrenceId = $1",
            [error_occurrence_id],
            function (result) {
                if (result.rows && result.rows.length) callback (result.rows[0]);
                else callback ();
            }
        );

    },

    // retrieve error occurrences for a given ID
    getErrorOccurrencesByErrorId: function (account_id, environment, error_id, callback) {

        this.run (
            "select     eo.*, e.* " +
            "from       ErrorOccurrences eo " +
            "inner join Errors e on e.ErrorId = eo.ErrorId " +
            "where      eo.ErrorId = $1 " +
            "and        e.AccountId = $2 " +
            "and        eo.Environment = $3 " +
            "order by   Date desc",
            [error_id, account_id, environment],
            function (result) {
                if (result.rows) callback (result.rows);
                else callback ();
            }
        );

    },

    // retrieve the latest errors
    getLatestErrorOccurrences: function (account_id, environment, limit, callback) {

        this.run (
            "select     eo.*, e.* " +
            "from       ErrorOccurrences eo " +
            "inner join Errors e on e.ErrorId = eo.ErrorId " +
            "where      e.AccountId = $1 " +
            "and        eo.Environment = $2 " +
            "order by   Date desc " +
            "limit $3   offset 0",
            [account_id, environment, limit],
            callback
        );

    },

    // save a new occurrence of an existing error
    logErrorOccurrence: function (error_data, files, callback) {
        var that = this;

        this.run (
            "insert into    ErrorOccurrences " +
            "(              ErrorId, Environment, Message, Server, UserName) " +
            "values (       $1, $2, $3, $4, $5) " +
            "returning      ErrorOccurrenceId",
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

    // load all attachment metadata related to an error occurrence
    getErrorAttachments: function (error_occurrence_id, callback) {

        this.run (
            "select     ErrorOccurrenceId, FileName, FileType " +
            "from       ErrorAttachments " +
            "where      ErrorOccurrenceId = $1 " +
            "order by   FileName",
            [error_occurrence_id],
            function (result) {
                callback (result.rows);
            }
        );

    },

    // load an existing error by product and stack trace
    getErrorAttachment: function (error_occurrence_id, file_name, callback) {

        this.run (
            "select ErrorOccurrenceId, FileName, FileType, Source " +
            "from   ErrorAttachments " +
            "where  ErrorOccurrenceId = $1 " +
            "and    FileName = $2",
            [error_occurrence_id, file_name],
            function (result) {

                if (result.rows.length) {
                    // following was part of attempt at fixing error when saving images
                    // decode the source value
                    //console.log (result.rows[0]);
                    //result.rows[0].source = new Buffer(result.rows[0].source, 'utf8').toString('binary');
                    //result.rows[0].source = result.rows[0].source.toString('ucs2');
                    //console.log (result.rows[0].source);
                    callback (result.rows[0]);
                }
                else callback ();

            }
        );

    },

    // save a file related to an error occurrence
    logErrorAttachments: function (error_occurrence_id, files, callback) {
        var that = this;

        var numAttachmentsSaved = 0; // reset the saved attachments counter
        for (var i = 0; i < files.length; i++) {
            //console.log (files[i].source);
            //files[i].source = String.fromCharCode(92) + "x" + files[i].source;
            //files[i].source = files[i].source.toString("hex");
            this.run (
                "insert into    ErrorAttachments " +
                "(              ErrorOccurrenceId, FileName, FileType, Source) " +
                "values (       $1, $2, $3, $4::bytea)",
                [error_occurrence_id, files[i].file_name, files[i].file_type, files[i].source],
                function (result) {

                    numAttachmentsSaved++;
                    if (numAttachmentsSaved == files.length) callback ();

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
                        console.log (query);
                        console.log (fields);
                        console.error (err);
                        callback ({});
                    }
                    else callback (result);
                });
            }
        });

    }

}