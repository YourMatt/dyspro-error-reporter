/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ERROR ATTACHMENTS
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single error attachment.
// callback(model.ErrorAttachment: Error attachment data)
exports.get = function (errorOccurrenceId, fileName, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     ErrorOccurrenceId, FileName, FileType, Source " +
            "FROM       ErrorAttachments " +
            "WHERE      ErrorOccurrenceId = ? " +
            "AND        FileName = ? ",
            values: [
                errorOccurrenceId,
                fileName
            ]
        },
        function (ea) {
            if (!ea) return callback(new models.ErrorAttachment());

            let errorAttachment = new models.ErrorAttachment(
                ea.ErrorOccurrenceId,
                ea.FileName,
                ea.FileType,
                ea.Source
            );
            callback(errorAttachment);

        }
    );

};

// Loads all attachments for an error occurrence.
// callback(array: List of attachment data)
exports.getAllByErrorOccurrence = function (errorOccurrenceId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     ErrorOccurrenceId, FileName, FileType " +
            "FROM       ErrorAttachments " +
            "WHERE      ErrorOccurrenceId = ? " +
            "ORDER BY   FileName ASC ",
            values: [
                errorOccurrenceId
            ]
        },
        function (ea) {
            if (!ea) return callback([]);

            let errorAttachments = [];
            for (let i = 0; i < ea.length; i++) {
                errorAttachments.push(new models.ErrorAttachment(
                    ea[i].ErrorOccurrenceId,
                    ea[i].FileName,
                    ea[i].FileType
                ));
            }
            callback(errorAttachments);

        }
    );

};

// Creates a new record.
// callback(bool: True if successful)
exports.create = function (errorOccurrenceId, errorAttachment, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    ErrorAttachments " +
            "(              ErrorOccurrenceId, FileName, FileType, Source) " +
            "VALUES (       ?, ?, ?, ?) ",
            values: [
                errorOccurrenceId,
                errorAttachment.fileName,
                errorAttachment.fileType,
                errorAttachment.source
            ]
        },
        function () {
            // TODO: Evaluate if error - Currently, all inserts return an insert ID, but this query doesn't create an insert ID
            callback(true);
        }
    );

};
