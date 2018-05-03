/***********************************************************************************************************************
 *
 * MAKES ALL MODELS AVAILABLE ON A SINGLE OBJECT
 *
 **********************************************************************************************************************/

module.exports = {
    Account: require("./account"),
    Error: require("./error"),
    ErrorAttachment: require("./errorattachment"),
    ErrorNote: require("./errornote"),
    ErrorOccurrence: require("./erroroccurrence"),
    User: require("./user"),
    Session: require("./session")
};