/***********************************************************************************************************************
 *
 * ERROR MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (accountId, product, stackTrace, errorId) {
    this.accountId = utils.toInt(accountId);
    this.product = product;
    this.stackTrace = stackTrace;
    this.errorId = utils.toInt(errorId);

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!accountId) missingFields.push("accountId");

        if (!product) missingFields.push("product");
        else if (product.length > 50) maxLengthExceededFields.push("product");

        if (stackTrace.length > 16000000) maxLengthExceededFields.push("stackTrace");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
