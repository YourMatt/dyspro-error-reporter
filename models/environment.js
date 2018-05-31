/***********************************************************************************************************************
 *
 * ENVIRONMENT MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, name, sequence, createDate, environmentId) {
    this.accountId = accountId;
    this.name = name;
    this.sequence = sequence;
    this.createDate = createDate;
    this.environmentId = utils.toInt(environmentId);
    this.errorMessage = ""; // set by isValid
};

self.prototype.isValid = function () {

    let missingFields = [];
    let maxLengthExceededFields = [];
    let outOfBoundsFields = [];

    if (!this.name) missingFields.push("name");
    else if (this.name.length > 25) maxLengthExceededFields.push("name");

    if (this.sequence && (this.sequence < 1 || this.sequence > 100)) outOfBoundsFields.push("sequence");

    this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
    return (this.errorMessage === "");

};

module.exports = self;
