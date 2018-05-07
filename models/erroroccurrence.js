/***********************************************************************************************************************
 *
 * ERROR OCCURRENCE MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (errorId, environment, message, server, userName, date, errorOccurrenceId) {
    this.errorId = utils.toInt(errorId);
    this.environment = environment;
    this.message = message;
    this.server = server;
    this.userName = userName;
    this.date = date;
    this.errorOccurrenceId = utils.toInt(errorOccurrenceId);
    this.attachments = [];

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!errorId) missingFields.push("errorId");

        if (!environment) missingFields.push("environment");
        else if (environment.length > 25) maxLengthExceededFields.push("environment");

        if (message.length > 64000) maxLengthExceededFields.push("message");

        if (server.length > 50) maxLengthExceededFields.push("server");

        if (userName.length > 50) maxLengthExceededFields.push("userName");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
