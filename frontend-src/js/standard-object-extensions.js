/***********************************************************************************************************************
 *
 * ADDED FUNCTIONALITY TO BUILT-IN OBJECTS
 *
 **********************************************************************************************************************/

// Allows string format in format of:
// "Val1: {0} Val2: {1}".format ("one", "two")
String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
