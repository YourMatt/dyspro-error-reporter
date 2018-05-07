/***********************************************************************************************************************
 *
 * ERROR NOTE MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (errorId, userId, message, date, errorNoteId) {
    this.errorId = utils.toInt(errorId);
    this.userId = userId;
    this.message = message;
    this.date = date;
    this.errorNoteId = utils.toInt(errorNoteId);

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!errorId) missingFields.push("errorId");

        if (!userId) missingFields.push("userId");

        if (!message) missingFields.push("message");
        else if (message.length > 64000) maxLengthExceededFields.push("message");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
