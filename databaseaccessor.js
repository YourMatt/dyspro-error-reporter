var mysql = require("mysql");

exports.query = {

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ACCOUNTS TABLE
     *
     ******************************************************************************************************************/

    // load account by api key
    // callback(object: Account data)
    getAccountByApiKey: function (apiKey, callback) {

        exports.access.selectSingle ({
            sql:    "select * " +
                    "from   Accounts " +
                    "where  ApiKey = ? ",
            values: [apiKey]
        },
        callback);

    },

    // get all environments
    // callback(array: List of environment strings)
    getAccountEnvironments: function (accountId, callback) {

        exports.access.selectMultiple({
            sql:    "select     distinct eo.Environment " +
                    "from       Errors e " +
                    "inner join ErrorOccurrences eo on eo.ErrorId = e.ErrorId " +
                    "where      e.AccountId = ? ",
            values: [accountId]
        },
        function(result) {
            var environments = [];
            if (result.rows) {
                for (var i = 0; i < result.rows.length; i++) {
                    environments.push (result.rows[i].Environment);
                }
            }
            callback (environments);
        });

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH USERS TABLE
     *
     ******************************************************************************************************************/

    // authenticate the user
    // callback(object: User data)
    getUserByLogin: function (email, password, callback) {

        exports.access.selectSingle({
            sql:    "select * " +
                    "from   Users " +
                    "where  Email = ? " +
                    "and    Password = md5(?) ",
            values: [email, password]
        },
        callback);

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERRORS TABLE
     *
     ******************************************************************************************************************/

    // retrieve single error occurrence
    // callback(object: Error data)
    getError: function (errorId, callback) {

        exports.access.selectSingle({
            sql:    "select     * " +
                    "from       Errors " +
                    "where      ErrorId = ? ",
            values: [errorId]
        },
        callback);

    },

    // load an existing error by product and stack trace
    // callback(int: Error ID)
    getErrorByData: function (errorData, callback) {

        exports.access.selectSingle({
            sql:    "select ErrorId " +
                    "from   Errors " +
                    "where  AccountId = ? " +
                    "and    Product = ? " +
                    "and    md5(StackTrace) = md5(?) ",
            values: [errorData.accountId, errorData.product, errorData.stackTrace]
        },
        function(result) {
            callback(result.ErrorId);
        });

    },

    // save a new error type
    // callback(string: Error message)
    logError: function (errorData, files, callback) {

        exports.query.getErrorByData(
            errorData,
            function(errorId) {

                // add a new occurrence to the existing error if found
                if (errorId) {
                    errorData.errorId = errorId;
                    exports.access.logErrorOccurrence(
                        errorData,
                        files,
                        callback
                    );
                }

                // add a new error if not found
                else {

                    exports.access.insert({
                        sql:    "insert into    Errors " +
                                "(              AccountId, Product, StackTrace) " +
                                "values (       ?, ?, ?) ",
                        values: [errorData.accountId, errorData.product, errorData.stackTrace]
                    },
                    function (errorId) {
                        if (!errorId) return callback("Error saving to the errors table.");

                        errorData.errorId = errorId;
                        exports.access.logErrorOccurrence(
                            errorData,
                            files,
                            callback
                        );

                    });

                }

            }
        );

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERROROCCURRENCES TABLE
     *
     ******************************************************************************************************************/

    // retrieve single error occurrence
    // callback(object: Error occurrence data)
    getErrorOccurrence: function (errorOccurrenceId, callback) {

        exports.access.selectSingle({
            sql:    "select     eo.*, e.* " +
                    "from       ErrorOccurrences eo " +
                    "inner join Errors e on e.ErrorId = eo.ErrorId " +
                    "where      eo.ErrorOccurrenceId = ? ",
            values: [errorOccurrenceId]
        },
        callback);

    },

    // retrieve error occurrences for a given ID
    // callback(array: List of error occurrences)
    getErrorOccurrencesByErrorId: function (accountId, environment, errorId, callback) {

        exports.access.selectMultiple({
            sql:    "select     eo.*, e.* " +
                    "from       ErrorOccurrences eo " +
                    "inner join Errors e on e.ErrorId = eo.ErrorId " +
                    "where      eo.ErrorId = ? " +
                    "and        e.AccountId = ? " +
                    "and        eo.Environment = ? " +
                    "order by   Date desc ",
            values: [errorId, accountId, environment]
        },
        callback);

    },

    // retrieve the latest errors
    // callback(array: List of error occurrences)
    getLatestErrorOccurrences: function (accountId, environment, limit, callback) {

        exports.access.selectMultiple({
            sql:    "select     eo.*, e.* " +
                    "from       ErrorOccurrences eo " +
                    "inner join Errors e on e.ErrorId = eo.ErrorId " +
                    "where      e.AccountId = ? " +
                    "and        eo.Environment = ? " +
                    "order by   Date desc " +
                    "limit ?    offset 0 ",
            values: [accountId, environment, limit]
        },
        callback);

    },

    // save a new occurrence of an existing error
    // callback(string: Error message)
    logErrorOccurrence: function (errorData, files, callback) {

        exports.access.insert({
            sql:    "insert into    ErrorOccurrences " +
                    "(              ErrorId, Environment, Message, Server, UserName) " +
                    "values (       ?, ?, ?, ?, ?) ",
            values: [errorData.errorId, errorData.environment, errorData.message, errorData.server, errorData.userName]
        },
        function (errorOccurrenceId) {
            if (!errorOccurrenceId) return callback ("Error saving to the ErrorOccurrences table.");

            // save the attachments provided with the error
            if (files.length) exports.query.logErrorAttachments(errorOccurrenceId, files, callback);
            else callback();

        });

    },

    /*******************************************************************************************************************
     *
     * INTERACTION WITH ERRORATTACHMENTS TABLE
     *
     ******************************************************************************************************************/

    // load all attachment metadata related to an error occurrence
    // callback(array: List of attachment data)
    getErrorAttachments: function (errorOccurrenceId, callback) {

        exports.access.selectMultiple({
            sql:    "select     ErrorOccurrenceId, FileName, FileType " +
                    "from       ErrorAttachments " +
                    "where      ErrorOccurrenceId = ? " +
                    "order by   FileName ",
            values: [errorOccurrenceId]
        },
        callback);

    },

    // load an existing error by product and stack trace
    // callback(object: Error attachment data)
    getErrorAttachment: function (errorOccurrenceId, fileName, callback) {

        exports.access.selectSingle({
            sql:    "select ErrorOccurrenceId, FileName, FileType, Source " +
                    "from   ErrorAttachments " +
                    "where  ErrorOccurrenceId = ? " +
                    "and    FileName = ? ",
            values: [errorOccurrenceId, fileName]
        },
        callback);

    },

    // save a file related to an error occurrence
    // callback(string: Error message)
    logErrorAttachments: function (errorOccurrenceId, files, callback) {

        var numAttachmentsSaved = 0; // reset the saved attachments counter
        for (var i = 0; i < files.length; i++) {
            exports.access.insert({
                sql:    "insert into    ErrorAttachments " +
                        "(              ErrorOccurrenceId, FileName, FileType, Source) " +
                        "values (       ?, ?, ?, ?) ",
                values: [errorOccurrenceId, files[i].fileName, files[i].fileType, files[i].source]
            },
            function() {
                numAttachmentsSaved++;
                if (numAttachmentsSaved == files.length) callback();
            });

        }

    }

};

exports.access = {

    db: null,

    init: function () {

        // create the db connection
        this.db = mysql.createConnection ({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // connect to the database
        this.db.connect (function (error) {
            if (error) {
                // TODO: write error data to logs
                console.log('Error connecting to Db: ' + error);
            }
        });

    },

    close: function () {

        // close the database connection
        this.db.end ();

    },

    handleError: function (query, error) {

        // TODO: write error data to logs
        console.log ("Error running query: " + error);
        console.log (query);

    },

    // runs a select query returning the first returned row
    // callback(object: Results)
    selectSingle: function (query, callback) {

        this.selectMultiple (query, callback, true);

    },

    // run a select query returning multiple rows
    // callback(array: List of returned objects)
    selectMultiple: function (query, callback, returnSingle) {

        this.init();

        // run the query
        this.db.query(query, function (error, rows) {

            // report error and return if error state
            if (error) return exports.access.handleError (query, error);

            // call the callback with data
            if (returnSingle) callback(rows[0]);
            else callback (rows);

        });

        this.close();

    },

    // insert record
    // callback(int: Insert ID)
    insert: function (query, callback) {

        this.init();

        // run the insert
        this.db.query(query, function (error, result) {

            // report error and return
            if (error) return exports.access.handleError (query, error);

            // call the callback with the insert ID
            callback (result.insertId);

        });

        this.close();

    }

};
