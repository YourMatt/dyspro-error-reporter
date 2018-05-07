/***********************************************************************************************************************
 *
 * ERROR ATTACHMENT MODEL
 *
 **********************************************************************************************************************/

var self = function (errorOccurrenceId, fileName, fileType, source) {
    this.errorOccurrenceId = errorOccurrenceId;
    this.fileName = fileName;
    this.fileType = fileType;
    this.source = source;

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!errorOccurrenceId) missingFields.push("errorOccurrenceId");

        if (!fileName) missingFields.push("fileName");
        else if (fileName.length > 50) maxLengthExceededFields.push("fileName");

        if (!fileName) missingFields.push("fileType");
        else if (fileName.length > 25) maxLengthExceededFields.push("fileType");

        if (source.length > 16000000) maxLengthExceededFields.push("source");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
