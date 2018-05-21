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
                default:
                    errorMessage = "An unhandled error response was returned: " + error.code;
                    break;
            }

            return callback(new models.MonitorResponse(0, "", "", 0, errorMessage));

        }

        // return response information
        callback(new models.MonitorResponse(
            response.statusCode,
            response.headers["content-type"].split(";")[0],
            body,
            Date.now() - startTime,
            ""
        ));

    });

};
