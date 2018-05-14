/***********************************************************************************************************************
 *
 * MAKES ALL MODELS AVAILABLE ON A SINGLE OBJECT
 *
 **********************************************************************************************************************/

module.exports = {
    Account: require("./account"),
    Environment: require("./environment"),
    Error: require("./error"),
    ErrorAttachment: require("./errorattachment"),
    ErrorNote: require("./errornote"),
    ErrorOccurrence: require("./erroroccurrence"),
    Monitor: require("./monitor"),
    MonitorResult: require("./monitorresult"),
    Product: require("./product"),
    Session: require("./session"),
    User: require("./user")
};
