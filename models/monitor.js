/***********************************************************************************************************************
 *
 * MONITOR MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (accountId, product, environment, endpointUri, intervalSeconds, monitorId) {
    this.accountId = utils.toInt(accountId);
    this.product = product;
    this.environment = environment;
    this.endpointUri = endpointUri;
    this.intervalSeconds = utils.toInt(intervalSeconds);
    this.monitorId = utils.toInt(monitorId);

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!accountId) missingFields.push("accountId");

        if (!product) missingFields.push("product");
        else if (product.length > 50) maxLengthExceededFields.push("product");

        if (!environment) missingFields.push("environment");
        else if (environment.length > 25) maxLengthExceededFields.push("environment");

        if (!endpointUri) missingFields.push("endpointUri");
        else if (endpointUri.length > 500) maxLengthExceededFields.push("endpointUri");

        if (!intervalSeconds) missingFields.push("intervalSeconds");
        else if (intervalSeconds < 1 || intervalSeconds >= (60 * 60 * 24)) outOfBoundsFields.push("intervalSeconds");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
