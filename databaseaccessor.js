var dbLocation, pg;

exports.init = function (initDbLocation, initPg) {
    dbLocation = initDbLocation;
    pg = initPg;
}

exports.query = {

    // authenticate the user
    loadUser: function (userName, password, success, fail) {

        this.run (
            "select * from users where user_name = $1 and password = md5($2)",
            [userName, password],
            function (result) {
                if (result.rows.length != 1) fail ();
                else success (result.rows[0]);
            },
            fail
        );

    },

    // load an existing error by product and stack trace
    getErrorByData: function (errorData, success, fail) {

        this.run (
            "select error_id " +
            "from   errors " +
            "where  user_id = $1 " +
            "and    product = $2 " +
            "and    md5(stack_trace) = md5($3)",
            [errorData.user_id, errorData.product, errorData.stack_trace],
            function (result) {

                if (result.rows.length) success (result.rows[0].error_id);
                else success ();

            },
            fail
        );

    },

    // save a new error type
    logError: function (errorData, files, success, fail) {
        var that = this;

        this.getErrorByData (
            errorData,
            function (errorId) {

                // add to the existing error if found
                if (errorId) {
                    errorData.error_id = errorId;
                    that.logErrorOccurrence (
                        errorData,
                        function (errorMessage) {
                            // TODO: Save the files
                            success (errorMessage);
                        },
                        fail
                    );
                }

                // create a new error and add the error occurrence if not found
                else {
                    that.run (
                        "insert into    errors " +
                        "(              user_id, product, stack_trace) " +
                        "values (       $1, $2, $3) " +
                        "returning      error_id",
                        [errorData.user_id, errorData.product, errorData.stack_trace],
                        function (result) {
                            if (! result.rows) fail ();

                            var errorId = result.rows[0].error_id;

                            console.log ("added record " + errorId);
                            errorData.error_id = errorId;

                            that.logErrorOccurrence (
                                errorData,
                                function (errorMessage) {
                                    // TODO: Save the files
                                    success (errorMessage);
                                },
                                fail
                            );
                        },
                        fail
                    );
                }

            },
            fail
        );

    },

    // save a new occurrence of an existing error
    logErrorOccurrence: function (errorData, success, fail) {

        this.run (
            "insert into    error_occurrences " +
            "(              error_id, environment, message, server) " +
            "values (       $1, $2, $3, $4) " +
            "returning      error_occurrence_id",
            [errorData.error_id, errorData.environment, errorData.message, errorData.server],
            function (result) {

                if (! result.rows) {} // error

                var errorOccurrenceId = result.rows[0].error_occurrence_id;
                console.log ("address occ record " + errorOccurrenceId);

                success();

            },
            fail
        );

    },

    // save a file related to an error occurrence
    logErrorAttachment: function () {

    },

    // run a query against the database
    run: function (query, fields, success, fail) {

        pg.connect (dbLocation, function (err, client, done) {
            if (err) {
                fail ();
            }
            else {
                client.query (query, fields, function (err, result) {
                    done();
                    if (err) { console.log(err); fail(); }
                    else success(result);
                });
            }
        });

    }

}