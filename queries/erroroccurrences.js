/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ERROR OCCURRENCES
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single error occurrence
// callback(models.ErrorOccurrence: Error occurrence data)
exports.get = function (errorOccurrenceId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.Environment, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId, e.AccountId, e.Product, e.StackTrace " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "WHERE      eo.ErrorOccurrenceId = ? ",
            values: [
                errorOccurrenceId
            ]
        },
        function (eo) {
            if (!eo) return callback(new models.ErrorOccurrence());

            let errorOccurrence = new models.ErrorOccurrence(
                eo.ErrorId,
                eo.Environment,
                eo.Message,
                eo.Server,
                eo.UserName,
                eo.Date,
                eo.ErrorOccurrenceId
            );
            callback(errorOccurrence);

        }
    );

};

// Loads all error occurrences of a given error ID.
// callback(array: List of error occurrences)
exports.getAllByErrorAndEnvironment = function (errorId, environment, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.Environment, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId, e.AccountId, e.Product, e.StackTrace " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "WHERE      eo.ErrorId = ? " +
            "AND        eo.Environment = ? " +
            "ORDER BY   Date DESC ",
            values: [
                errorId,
                environment
            ]
        },
        callback
    );

};

// Loads the latest errors from an account.
// callback(array: List of error occurrences)
exports.getLatestByAccountAndEnvironment = function (accountId, environment, limit, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.Environment, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId, e.AccountId, e.Product, e.StackTrace " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "WHERE      e.AccountId = ? " +
            "AND        eo.Environment = ? " +
            "ORDER BY   Date DESC " +
            "LIMIT ?    OFFSET 0 ",
            values: [
                accountId,
                environment,
                limit
            ]
        },
        callback
    );

};

// Creates a new record.
// callback(int: Error occurrence ID)
exports.create = function (errorOccurrence, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    ErrorOccurrences " +
            "(              ErrorId, Environment, Message, Server, UserName) " +
            "VALUES (       ?, ?, ?, ?, ?) ",
            values: [
                errorOccurrence.errorId,
                errorOccurrence.environment,
                errorOccurrence.message,
                errorOccurrence.server,
                errorOccurrence.userName
            ]
        },
        callback
    );

};
