/***********************************************************************************************************************
 *
 * USER MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (accountId, name, email, phone, password, createDate, userId) {
    this.accountId = utils.toInt(accountId);
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.createDate = createDate;
    this.userId = utils.toInt(userId);

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!accountId) missingFields.push("accountId");

        if (!name) missingFields.push("name");
        else if (name.length > 50) maxLengthExceededFields.push("name");

        if (!email) missingFields.push("email");
        else if (email.length > 50) maxLengthExceededFields.push("email");

        if (phone.length !== 10) outOfBoundsFields.push("phone");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
