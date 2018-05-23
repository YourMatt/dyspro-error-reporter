/***********************************************************************************************************************
 *
 * HANDLES ALL ACTIONS RELATED TO URI MONITORING
 *
 **********************************************************************************************************************/
const httpRequest = require("request"),
    models = require("./models/all");

// Makes a request to a URI and returns the response.
// callback(models.MonitorResponse)
exports.getResponse = function (uri, callback) {

    const timeoutSeconds = 15; // TODO: Allow this to be configurable for each monitor
    const startTime = Date.now();
    uri = monitorUtils.appendNoCacheParamToUri(uri);

    httpRequest(uri, {timeout: timeoutSeconds * 1000}, (error, response, body) => {

        // if no response, return error information with status of 0
        if (!response) {

            let errorMessage = "";
            switch (error.code) {
                case "ENOTFOUND":
                    errorMessage = "Host not found.";
                    break;
                case "ESOCKETTIMEDOUT":
                    errorMessage = "Timeout after " + timeoutSeconds + " seconds.";
                    break;
                case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
                    errorMessage = "Unable to connect over SSL.";
                    break;
                default:
                    errorMessage = "An unhandled error response was returned: " + error.code;
                    break;
            }

            return callback(new models.MonitorResponse(uri, 0, "", "", 0, errorMessage));

        }

        // return response information
        callback(new models.MonitorResponse(
            uri,
            response.statusCode,
            response.headers["content-type"].split(";")[0],
            body,
            Date.now() - startTime,
            ""
        ));

    });

};

// Common methods to this module.
const monitorUtils = {

    // Adds a parameter to the URI prior to running the request to absolutely ensure that a cached response will not be
    // returned.
    appendNoCacheParamToUri: function (uri) {

        return uri + ((uri.indexOf("?") >= 0) ? "&" : "?") + "cache=" + Date.now();

    }

};
