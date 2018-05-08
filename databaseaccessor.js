const mysql = require("mysql");

// Handles all interaction with the database object.
const connection = {

    db: {}, // database connection - will be set on open

    // Creates the connection to the database.
    // callback(bool: True if success)
    open: function (callback) {

        // create the db connection
        connection.db = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // connect to the database
        connection.db.connect(function (error) {
            if (error) {
                // TODO: write error data to logs
                console.log("Error connecting to Db: " + error);
                return callback(false);
            }

            callback(true);

        });

    },

    // Runs a query against the database.
    // callback(string: Error, object: Results)
    query: function (query, callback) {

        connection.db.query(query, callback);

    },

    // Closes the database connection.
    close: function () {

        connection.db.end();

    },

    // Logs a database error.
    handleError: function (query, error) {

        // TODO: write error data to logs
        console.log("Error running query: " + error);
        console.log(query);

    }

};

// Returns a single record from the database. If multiple records found, returns the first row.
// callback(object: Results)
exports.selectSingle = function (query, callback) {

    exports.selectMultiple(query, callback, true);

};

// Returns rows from the database.
// callback(array: List of objects)
exports.selectMultiple = function (query, callback, returnSingle) {

    connection.open(function (success) {
        if (!success) return callback();

        // run the query
        connection.query(query, function (error, rows) {
            connection.close();

            // report error and return if error state
            if (error) {
                connection.handleError(query, error);
                return callback();
            }

            // call the callback with data
            if (returnSingle) callback(rows[0]);
            else callback(rows);

        });

    });

};

// Runs an insert against the database.
// callback(int: Insert ID)
exports.insert = function (query, callback) {

    connection.open(function (success) {
        if (!success) return callback();

        // run the insert
        connection.query(query, function (error, result) {
            connection.close();

            // report error and return
            if (error) {
                connection.handleError(query, error);
                return callback(0);
            }

            // call the callback with the insert ID
            callback(result.insertId);

        });

    });

};

// Runs an update against the database.
// callback(int: Number of updated rows)
exports.update = function (query, callback) {

    connection.open(function (success) {
        if (!success) return callback();

        // run the update
        connection.query(query, function (error, result) {
            connection.close();

            if (error) {
                connection.handleError(query, error);
                return callback(0);
            }

            // call the callback
            callback(result.affectedRows);

        });

    });

};

// Runs a delete against the database.
// callback(int: Number of deleted rows)
exports.delete = function (query, callback) {

    connection.open(function (success) {
        if (!success) return callback();

        // run the delete
        connection.query(query, function (error, result) {
            connection.close();

            if (error) {
                connection.handleError(query, error);
                return callback(0);
            }

            // call the callback
            callback(result.affectedRows);

        });

    });

};
