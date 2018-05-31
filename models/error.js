/***********************************************************************************************************************
 *
 * ERROR MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, productId, productName, stackTrace, errorId) {
    this.accountId = utils.toInt(accountId);
    this.productId = utils.toInt(productId);
    this.productName = productName;
    this.stackTrace = stackTrace;
    this.errorId = utils.toInt(errorId);
    this.errorMessage = ""; // set by isValid
};

self.prototype.isValid = function () {

    let missingFields = [];
    let maxLengthExceededFields = [];
    let outOfBoundsFields = [];

    if (!this.accountId) missingFields.push("accountId");

    if (!this.productId) missingFields.push("productId");

    if (!this.stackTrace) missingFields.push("stackTrace");
    else if (this.stackTrace.length > 16000000) maxLengthExceededFields.push("stackTrace");

    this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
    return (this.errorMessage === "");

};

module.exports = self;
