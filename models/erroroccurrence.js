/***********************************************************************************************************************
 *
 * ERROR OCCURRENCE MODEL
 *
 **********************************************************************************************************************/

var self = function (errorId, environment, message, server, userName, date, errorOccurrenceId) {
    this.errorId = errorId;
    this.environment = environment;
    this.message = message;
    this.server = server;
    this.userName = userName;
    this.date = date;
    if (errorOccurrenceId) this.errorOccurrenceId = errorOccurrenceId;
};

self.prototype = {
    errorOccurrenceId: 0,
    errorId: 0,
    environment: "",
    message: "",
    server: "",
    userName: "",
    date: {}
};

module.exports = self;
