/***********************************************************************************************************************
 *
 * USER MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (accountId, name, email, phone, password, createDate, userId) {
    this.accountId = utils.toInt(accountId);
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.createDate = createDate;
    this.userId = utils.toInt(userId);

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.accountId) missingFields.push("accountId");

        if (!this.name) missingFields.push("name");
        else if (this.name.length > 50) maxLengthExceededFields.push("name");

        if (!this.email) missingFields.push("email");
        else if (this.email.length > 50) maxLengthExceededFields.push("email");

        if (this.phone && this.phone.length !== 10) outOfBoundsFields.push("phone");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
