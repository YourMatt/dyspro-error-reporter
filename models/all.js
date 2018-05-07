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
    Monitor: require("./monitor"),
    MonitorResult: require("./monitorresult"),
    Session: require("./session"),
    User: require("./user")
};