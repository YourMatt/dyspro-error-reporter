/***********************************************************************************************************************
 *
 * MAKES ALL QUERIES AVAILABLE ON A SINGLE OBJECT
 *
 **********************************************************************************************************************/

module.exports = {
    accounts: require("./accounts"),
    environments: require("./environments"),
    errors: require("./errors"),
    errorAttachments: require("./errorattachments"),
    errorNotes: require("./errornotes"),
    errorOccurrences: require("./erroroccurrences"),
    monitors: require("./monitors"),
    monitorResults: require("./monitorresults"),
    products: require("./products"),
    users: require("./users")
};