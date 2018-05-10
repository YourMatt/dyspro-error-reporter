/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ERRORS
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single error definition.
// callback(models.Error: Error data)
exports.get = function (errorId, callback) {

    db.selectSingle({
            sql:
            "SELECT     ErrorId, AccountId, Product, StackTrace " +
            "FROM       Errors " +
            "WHERE      ErrorId = ? ",
            values: [
                errorId
            ]
        },
        function (e) {
            if (!e) return callback(new models.Error());

            let error = new models.Error(
                e.AccountId,
                e.Product,
                e.StackTrace,
                e.ErrorId
            );
            callback(error);

        }
    );

};

// Load a single error definition by product and stack trace.
// callback(int: Error ID)
exports.getIdByProductAndStackTrace = function (errorData, callback) {

    // TODO: Hash the stack trace before sending to the query.

    db.selectSingle(
        {
            sql:
            "SELECT     ErrorId " +
            "FROM       Errors " +
            "WHERE      AccountId = ? " +
            "AND        Product = ? " +
            "AND        MD5(StackTrace) = MD5(?) ",
            values: [
                errorData.accountId,
                errorData.product,
                errorData.stackTrace
            ]
        },
        function (result) {
            callback((result) ? result.ErrorId : 0);
        }
    );

};

// Creates a new record.
// callback(int: Error ID)
exports.create = function (error, callback) {

    exports.getIdByProductAndStackTrace(
        error,
        function (errorId) {

            // return the error ID if already exists
            if (errorId) return callback(errorId);

            // add a new error if not found
            db.insert(
                {
                    sql:
                    "INSERT INTO    Errors " +
                    "(              AccountId, Product, StackTrace) " +
                    "VALUES (       ?, ?, ?) ",
                    values: [
                        error.accountId,
                        error.product,
                        error.stackTrace
                    ]
                },
                callback
            );

        }
    );

};
