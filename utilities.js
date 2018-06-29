/***********************************************************************************************************************
 *
 * GENERAL UTILITIES FOR USE WITHIN THE APP
 *
 **********************************************************************************************************************/

// Converts a string to int, forcing to 0 instead of NaN situations.
exports.toInt = function (string) {
    let int = 0;
    if (string) int = parseInt(string);
    if (!int) int = 0;
    return int;
};

// Converts a value to a string, forcing to an empty string instead of undefined.
exports.toString = function (value) {
    let string = value;
    if (!string) string = "";
    return string;
};

// Creates common error messages for object validations.
exports.buildApiFieldErrorMessage = function (missingFields, maxLengthExceededFields, outOfBoundsFields) {

    let errorMessages = [];

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
