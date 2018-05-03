/***********************************************************************************************************************
 *
 * ERROR NOTE MODEL
 *
 **********************************************************************************************************************/

var self = function (errorId, userId, message, date, errorNoteId) {
    this.errorId = errorId;
    this.userId = userId;
    this.message = message;
    this.date = date;
    if (errorNoteId) this.errorNoteId = errorNoteId;
};

self.prototype = {
    errorNoteId: 0,
    errorId: 0,
    userId: 0,
    message: "",
    date: {}
};

module.exports = self;
