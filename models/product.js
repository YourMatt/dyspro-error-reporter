/***********************************************************************************************************************
 *
 * PRODUCT MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, name, sequence, createDate, productId) {
    this.accountId = accountId;
    this.name = name;
    this.sequence = sequence;
    this.createDate = createDate;
    this.productId = utils.toInt(productId);

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.name) missingFields.push("name");
        else if (this.name.length > 50) maxLengthExceededFields.push("name");

        if (this.sequence && (this.sequence < 1 || this.sequence > 100)) outOfBoundsFields.push("sequence");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
