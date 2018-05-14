/***********************************************************************************************************************
 *
 * ERROR ATTACHMENT MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (errorOccurrenceId, fileName, fileType, source) {
    this.errorOccurrenceId = errorOccurrenceId;
    this.fileName = fileName;
    this.fileType = fileType;
    this.source = source;

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.errorOccurrenceId) missingFields.push("errorOccurrenceId");

        if (!this.fileName) missingFields.push("fileName");
        else if (this.fileName.length > 50) maxLengthExceededFields.push("fileName");

        if (!this.fileName) missingFields.push("fileType");
        else if (this.fileName.length > 25) maxLengthExceededFields.push("fileType");

        if (this.source.length > 16000000) maxLengthExceededFields.push("source");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
