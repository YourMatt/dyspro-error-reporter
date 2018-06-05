/***********************************************************************************************************************
 *
 * GENERAL UTILITIES FOR USE WITHIN THE APP
 *
 **********************************************************************************************************************/

// Converts a string to int, forcing to 0 instead of NaN situations.
exports.toInt = function (string) {
    var int = 0;
    if (string) int = parseInt(string);
    if (!int) int = 0;
    return int;
};

// Creates common error messages for object validations.
exports.buildApiFieldErrorMessage = function (missingFields, maxLengthExceededFields, outOfBoundsFields) {

    var errorMessages = [];

    if (missingFields.length) {
        errorMessages.push("Missing required data: " + missingFields.join(", ") + ".");
    }
    if (maxLengthExceededFields.length) {
        errorMessages.push("Max field length exceeded for: " + fieldLengthExceededFields.join(", ") + ".");
    }
    if (outOfBoundsFields.length) {
        errorMessages.push("Out of bounds error for: " + outOfBoundsFields.join(", ") + ".");
    }

    if (errorMessages.length)
        return errorMessages.join(" ");
    else return "";

};
