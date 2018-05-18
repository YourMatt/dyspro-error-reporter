/***********************************************************************************************************************
 *
 * HANDLES ALL DATABASE INTERACTION
 * This is meant to be created as an object on req, ensuring the database connection is scoped to the current request.
 *
 **********************************************************************************************************************/
const mysql = require("mysql");

// Constructor.
// callback(bool: True if connected)
let self = function (callback) {

    this.db = {}; // database connection - will be set on open

    this.open(callback);

};

// Returns a single record from the database. If multiple records found, returns the first row.
// callback(object: Results)
self.prototype.selectSingle = function (query, callback) {

    this.selectMultiple(query, callback, true);

};

// Returns rows from the database.
// callback(array: List of objects)
self.prototype.selectMultiple = function (query, callback, returnSingle) {
    let base = this;

    this.query(query, function (error, rows) {

        // report error and return if error state
        if (error) {
            base.handleError(query, error);
            return callback();
        }

        // call the callback with data
        if (returnSingle) callback(rows[0]);
        else callback(rows);

    });

};


// Runs an insert against the database.
// callback(int: Insert ID)
self.prototype.insert = function (query, callback) {
    let base = this;

    this.query(query, function (error, result) {

        // report error and return
        if (error) {
            base.handleError(query, error);
            return callback(0);
        }

        // call the callback with the insert ID
        callback(result.insertId);

    });

};

// Runs an update against the database.
// callback(int: Number of updated rows)
self.prototype.update = function (query, callback) {
    let base = this;

    // run the update
    this.query(query, function (error, result) {

        if (error) {
            base.handleError(query, error);
            return callback(0);
        }

        // call the callback
        callback(result.affectedRows);

    });

};

// Runs a delete against the database.
// callback(int: Number of deleted rows)
self.prototype.delete = function (query, callback) {
    let base = this;

    this.query(query, function (error, result) {

        if (error) {
            base.handleError(query, error);
            return callback(0);
        }

        // call the callback
        callback(result.affectedRows);

    });

};

// Creates the connection to the database.
// callback(bool: True if success)
self.prototype.open = function (callback) {
    let base = this;

    // create the db connection
    this.db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // connect to the database
    this.db.connect(function (error) {
        if (error) {
            if (error) base.handleError("Connection Open Operation", error);
            return callback(false);
        }

        callback(true);

    });

};

// Closes the connection to the database.
self.prototype.close = function () {
    let base = this;

    this.db.end(function (error) {
        if (error) base.handleError("Connection Close Operation", error);
    });

};

// Runs a query against the database.
// callback(string: Error, object: Results)
self.prototype.query = function (query, callback) {

    this.db.query(query, callback);

};

// Handles any errors interacting with the database.
self.prototype.handleError = function (query, error) {

    // TODO: write error data to logs
    console.log("Error running query: " + error);
    console.log(query);

};

module.exports = self;
