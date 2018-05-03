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
};

self.prototype = {
    errorOccurrenceId: 0,
    fileName: "",
    fileType: "",
    source: ""
};

module.exports = self;
