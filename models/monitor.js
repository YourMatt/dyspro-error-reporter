/***********************************************************************************************************************
 *
 * MONITOR MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, productId, productName, environmentId, environmentName, endpointUri, intervalSeconds, monitorId) {
    this.accountId = utils.toInt(accountId);
    this.productId = utils.toInt(productId);
    this.productName = productName;
    this.environmentId = utils.toInt(environmentId);
    this.environmentName = environmentName;
    this.endpointUri = endpointUri;
    this.intervalSeconds = utils.toInt(intervalSeconds);
    this.monitorId = utils.toInt(monitorId);
    this.errorMessage = ""; // set by isValid
};

self.prototype.isValid = function () {

    let missingFields = [];
    let maxLengthExceededFields = [];
    let outOfBoundsFields = [];

    if (!this.accountId) missingFields.push("accountId");

    if (!this.productId) missingFields.push("productId");

    if (!this.environmentId) missingFields.push("environmentId");

    if (!this.endpointUri) missingFields.push("endpointUri");
    else if (this.endpointUri.length > 500) maxLengthExceededFields.push("endpointUri");

    if (!this.intervalSeconds) missingFields.push("intervalSeconds");
    else if (this.intervalSeconds < 1 || this.intervalSeconds >= (60 * 60 * 24)) outOfBoundsFields.push("intervalSeconds");

    this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
    return (this.errorMessage === "");

};

module.exports = self;
