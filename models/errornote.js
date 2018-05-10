/***********************************************************************************************************************
 *
 * ERROR NOTE MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (accountId, errorId, message, userId, userName, date, errorNoteId) {
    this.accountId = utils.toInt(accountId);
    this.errorId = utils.toInt(errorId);
    this.userId = utils.toInt(userId);
    this.userName = userName;
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
