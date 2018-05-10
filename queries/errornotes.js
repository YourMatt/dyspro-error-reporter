/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ERROR NOTES
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single error note.
// callback(models.ErrorNote: Error note details)
exports.get = function(errorNoteId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     en.ErrorNoteId, en.ErrorId, en.UserId, en.Message, en.Date " +
            ",          u.Name, u.AccountId " +
            "FROM       ErrorNotes en " +
            "INNER JOIN Users u ON u.UserId = en.UserId " +
            "WHERE      en.ErrorNoteId = ? ",
            values: [
                errorNoteId
            ]
        },
        function (en) {
            if (!en) return callback(new models.ErrorNote());

            let errorNote = new models.ErrorNote(
                en.AccountId,
                en.ErrorId,
                en.Message,
                en.UserId,
                en.Name,
                en.Date,
                en.ErrorNoteId
            );
            callback(errorNote);

        }
    );

};

// Loads all for a given error.
// callback(array: List of model.ErrorNote)
exports.getAllByErrorId = function(errorId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     en.ErrorNoteId, en.ErrorId, en.UserId, en.Message, en.Date " +
            ",          u.Name, u.AccountId " +
            "FROM       ErrorNotes en " +
            "INNER JOIN Users u ON u.UserId = en.UserId " +
            "WHERE      ErrorId = ? " +
            "ORDER BY   Date ASC ",
            values: [
                errorId
            ]
        },
        function (en) {
            if (!en) return callback([]);

            let errorNotes = [];
            for (let i = 0; i < en.length; i++) {
                errorNotes.push(new models.ErrorNote(
                    en[i].AccountId,
                    en[i].ErrorId,
                    en[i].Message,
                    en[i].UserId,
                    en[i].Name,
                    en[i].Date,
                    en[i].ErrorNoteId
                ));
            }
            callback(errorNotes);

        }
    );

};

// Creates a new record.
// callback(int: Error Note ID)
exports.create = function(errorNote, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    ErrorNotes " +
            "(              ErrorId, UserId, Message, Date) " +
            "VALUES (       ?, ?, ?, NOW()) ",
            values: [
                errorNote.errorId,
                errorNote.userId,
                errorNote.message
            ]
        },
        callback
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(errorNote, callback) {

    db.update(
        {
            sql:
            "UPDATE ErrorNotes " +
            "SET    UserId = ?, Message = ? " +
            "WHERE  ErrorNoteId = ? ",
            values: [
                errorNote.userId,
                errorNote.message,
                errorNote.errorNoteId
            ]
        },
        callback
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(errorNoteId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    ErrorNotes " +
            "WHERE          ErrorNoteId = ? ",
            values: [
                errorNoteId
            ]
        },
        callback
    );

};
