/***********************************************************************************************************************
 *
 * MONITOR RESPONSE MODEL
 * This holds all relevant data from a URL monitor's response.
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (checkedUri, statusCode, contentType, response, responseMilliseconds, errorMessage) {
    this.checkedUri = checkedUri;
    this.statusCode = utils.toInt(statusCode);
    this.contentType = contentType;
    this.response = response;
    this.responseParsed = this.parseResponse(contentType, response);
    this.responseMilliseconds = responseMilliseconds;
    this.requestErrorMessage = errorMessage;
};

self.prototype.parseResponse = function (contentType, response) {

    switch (contentType) {
        case "application/json":
            return JSON.parse(response);
        default:
            return {};
    }

};

module.exports = self;
