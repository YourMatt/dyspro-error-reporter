var db_location, pg;

exports.init = function (init_db_location, init_pg) {
    db_location = init_db_location;
    pg = init_pg;
}

exports.query = {

    // authenticate the user
    loadUser: function (user_name, password, success, fail) {

        this.run (
            "select * from users where user_name = $1 and password = md5($2)",
            [user_name, password],
            function (result) {
                if (result.rows.length != 1) fail ();
                else success (result.rows[0]);
            },
            fail
        );

    },

    // load an existing error by product and stack trace
    getErrorByData: function (error_data, success, fail) {

        this.run (
            "select error_id " +
            "from   errors " +
            "where  user_id = $1 " +
            "and    product = $2 " +
            "and    md5(stack_trace) = md5($3)",
            [error_data.user_id, error_data.product, error_data.stack_trace],
            function (result) {

                if (result.rows.length) success (result.rows[0].error_id);
                else success ();

            },
            fail
        );

    },

    // save a new error type
    logError: function (error_data, files, success, fail) {
        var that = this;

        this.getErrorByData (
            error_data,
            function (error_id) {

                // add to the existing error if found
                if (error_id) {
                    error_data.error_id = error_id;
                    that.logErrorOccurrence (
                        error_data,
                        function (error_message) {
                            // TODO: Save the files
                            success (error_message);
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
                        [error_data.user_id, error_data.product, error_data.stack_trace],
                        function (result) {
                            if (! result.rows) fail ();

                            var error_id = result.rows[0].error_id;

                            console.log ("added record " + error_id);
                            error_data.error_id = error_id;

                            that.logErrorOccurrence (
                                error_data,
                                function (error_message) {
                                    // TODO: Save the files
                                    success (error_message);
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
    logErrorOccurrence: function (error_data, success, fail) {

        this.run (
            "insert into    error_occurrences " +
            "(              error_id, environment, message, server) " +
            "values (       $1, $2, $3, $4) " +
            "returning      error_occurrence_id",
            [error_data.error_id, error_data.environment, error_data.message, error_data.server],
            function (result) {

                if (! result.rows) {} // error

                var error_occurrence_id = result.rows[0].error_occurrence_id;
                console.log ("address occ record " + error_occurrence_id);

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

        pg.connect (db_location, function (err, client, done) {
            if (err) {
                fail ();
            }
            else {
                client.query (query, fields, function (err, result) {
                    done ();
                    if (err) {
                        console.log(err);
                        fail();
                    }
                    else success (result);
                });
            }
        });

    }

}