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
            ",          e.AccountId, e.Product, e.StackTrace " +
            "FROM       ErrorOccurrences eo " +
            "INNER JOIN Errors e ON e.ErrorId = eo.ErrorId " +
            "WHERE      eo.ErrorOccurrenceId = ? ",
            values: [
                errorOccurrenceId
            ]
        },
        function (eo) {
            if (!eo) return callback();

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
            ",          e.AccountId, e.Product, e.StackTrace " +
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
            "SELECT     eo..ErrorOccurrenceId, eo.Environment, eo.Message, eo.Server, eo.UserName, eo.Date " +
            ",          e.AccountId, e.Product, e.StackTrace " +
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
create = function (errorData, files, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    ErrorOccurrences " +
            "(              ErrorId, Environment, Message, Server, UserName) " +
            "VALUES (       ?, ?, ?, ?, ?) ",
            values: [
                errorData.errorId,
                errorData.environment,
                errorData.message,
                errorData.server,
                errorData.userName
            ]
        },
        function (errorOccurrenceId) {
            if (!errorOccurrenceId) return callback(0);

            // return if no attachments to save
            if (!files.length) return callback(errorOccurrenceId);

            // save the attachments provided with the error
            let numAttachmentsSaved = 0;
            for (let i = 0; i < files.length; i++) {
                queries.errorAttachments.create(
                    errorOccurrenceId,
                    files[i],
                    function (success) {
                        // TODO: Handle attachment save error - currently success is always true

                        numAttachmentsSaved++;
                        if (numAttachmentsSaved === files.length)
                            callback(errorOccurrenceId);

                    }
                )
            }

        }
    );

};
