/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ERROR OCCURRENCES
 *
 **********************************************************************************************************************/
const models = require("../models/all");

// Loads a single error occurrence
// callback(models.ErrorOccurrence: Error occurrence data)
exports.get = function (db, errorOccurrenceId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.EnvironmentId, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId, e.AccountId, e.ProductId, e.StackTrace " +
            ",          en.Name AS EnvironmentName " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "INNER JOIN Environments en ON en.EnvironmentId = eo.EnvironmentId " +
            "WHERE      eo.ErrorOccurrenceId = ? ",
            values: [
                errorOccurrenceId
            ]
        },
        function (eo) {
            if (!eo) return callback(new models.ErrorOccurrence());

            let errorOccurrence = new models.ErrorOccurrence(
                eo.ErrorId,
                eo.EnvironmentId,
                eo.EnvironmentName,
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
exports.getAllByErrorAndEnvironment = function (db, errorId, environmentId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.EnvironmentId, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId, e.AccountId, e.ProductId, e.StackTrace " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "WHERE      eo.ErrorId = ? " +
            "AND        eo.EnvironmentId = ? " +
            "ORDER BY   Date DESC ",
            values: [
                errorId,
                environmentId
            ]
        },
        callback
    );

};

// Loads the latest errors from an account.
// callback(array: List of error occurrences)
exports.getLatestByAccountAndEnvironment = function (db, accountId, environmentId, limit, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId " +
            ",          p.Name AS ProductName " +
            ", (        SELECT COUNT(*) FROM ErrorOccurrences WHERE ErrorId = e.ErrorId AND Date <= eo.Date) AS NumOccurrences " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "INNER JOIN Products p ON p.ProductId = e.ProductId " +
            "WHERE      e.AccountId = ? " +
            "AND        eo.EnvironmentId = ? " +
            "ORDER BY   Date DESC " +
            "LIMIT ?    OFFSET 0 ",
            values: [
                accountId,
                environmentId,
                limit
            ]
        },
        callback
    );

};

// Creates a new record.
// callback(int: Error occurrence ID)
exports.create = function (db, errorOccurrence, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    ErrorOccurrences " +
            "(              ErrorId, EnvironmentId, Message, Server, UserName) " +
            "VALUES (       ?, ?, ?, ?, ?) ",
            values: [
                errorOccurrence.errorId,
                errorOccurrence.environmentId,
                errorOccurrence.message,
                errorOccurrence.server,
                errorOccurrence.userName
            ]
        },
        callback
    );

};
