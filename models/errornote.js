/***********************************************************************************************************************
 *
 * ERROR NOTE MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, errorId, message, userId, userName, date, errorNoteId) {
    this.accountId = utils.toInt(accountId);
    this.errorId = utils.toInt(errorId);
    this.userId = utils.toInt(userId);
    this.userName = userName;
    this.message = message;
    this.date = date;
    this.errorNoteId = utils.toInt(errorNoteId);

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.errorId) missingFields.push("errorId");

        if (!this.userId) missingFields.push("userId");

        if (!this.message) missingFields.push("message");
        else if (this.message.length > 64000) maxLengthExceededFields.push("message");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
