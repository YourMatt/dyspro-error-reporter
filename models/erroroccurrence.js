/***********************************************************************************************************************
 *
 * ERROR OCCURRENCE MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (errorId, environmentId, environmentName, message, server, userName, date, errorOccurrenceId) {
    this.errorId = utils.toInt(errorId);
    this.environmentId = environmentId;
    this.environmentName = environmentName;
    this.message = message;
    this.server = server;
    this.userName = userName;
    this.date = date;
    this.errorOccurrenceId = utils.toInt(errorOccurrenceId);
    this.attachments = [];

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.errorId) missingFields.push("errorId");

        if (!this.environmentId) missingFields.push("environmentId");

        if (this.message.length > 64000) maxLengthExceededFields.push("message");

        if (this.server.length > 50) maxLengthExceededFields.push("server");

        if (this.userName.length > 50) maxLengthExceededFields.push("userName");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
