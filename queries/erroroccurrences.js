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
exports.getLatestByAccountAndEnvironment = function (db, accountId, environmentId, numRecords,
    sinceDate, productName, occurrenceFilter, occurrenceThreshold,
    callback) {

    // create the having clause based upon filtering on aggregates
    let havingClause = "";
    if (occurrenceThreshold && occurrenceFilter === "first") // show on the first occurrence of each error that has happened a number of times
        havingClause = "HAVING OccurrenceIteration = 1 AND OccurrenceTotal >= " + occurrenceThreshold + " ";
    else if (occurrenceFilter === "first") // show only the first occurrence of each error
        havingClause = "HAVING OccurrenceIteration = 1 ";
    else if (occurrenceThreshold && !occurrenceFilter) // show ALL errors that have happened at least a number of times
        havingClause = "HAVING OccurrenceTotal >= " + occurrenceThreshold + " ";
    else if (occurrenceThreshold && occurrenceFilter === "last") // show only the last error occurrence of errors that had happened at least a number of times
        havingClause = "HAVING OccurrenceTotal >= " + occurrenceThreshold + " AND OccurrenceIteration = OccurrenceTotal ";
    else if (occurrenceFilter === "last") // show only the last occurrence of each error
        havingClause = "HAVING OccurrenceIteration = OccurrenceTotal ";

    db.selectMultiple(
        {
            sql:
            "SELECT     eo.ErrorOccurrenceId, SUBSTRING_INDEX(eo.Message, '\n', 1) AS Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.ErrorId " +
            ",          p.Name AS ProductName " +
            ",          en.Name AS EnvironmentName " +
            ", (        SELECT COUNT(*) FROM ErrorOccurrences WHERE ErrorId = e.ErrorId AND EnvironmentId = ? AND ErrorOccurrenceId <= eo.ErrorOccurrenceId) AS OccurrenceIteration " +
            ", (        SELECT COUNT(*) FROM ErrorOccurrences WHERE ErrorId = e.ErrorId AND EnvironmentId = ?) AS OccurrenceTotal " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "INNER JOIN Products p ON p.ProductId = e.ProductId " +
            "INNER JOIN Environments en ON en.EnvironmentId = eo.EnvironmentId " +
            "WHERE      e.AccountId = ? " +
            "AND        eo.EnvironmentId = ? " +
            "AND        eo.Date > CONVERT_TZ(?, '+00:00', @@global.time_zone) " +
            "AND (      '' = ? OR p.Name = ?) " +
            havingClause +
            "ORDER BY   Date DESC " +
            "LIMIT      ? OFFSET 0 ",
            values: [
                environmentId,
                environmentId,
                accountId,
                environmentId,
                sinceDate,
                productName, productName,
                numRecords
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
