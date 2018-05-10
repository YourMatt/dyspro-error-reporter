/***********************************************************************************************************************
 *
 * MAKES ALL QUERIES AVAILABLE ON A SINGLE OBJECT
 *
 **********************************************************************************************************************/

module.exports = {
    accounts: require("./accounts"),
    errors: require("./errors"),
    errorAttachments: require("./errorattachments"),
    errorNotes: require("./errornotes"),
    errorOccurrences: require("./erroroccurrences"),
    monitors: require("./monitors"),
    users: require("./users")
};