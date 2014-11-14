var database;
var files = [];

exports.init = function (initDatabase) {
    database = initDatabase;
};

exports.processor = {

    authenticate: function (req, callback) {

        var checkUser = req.headers.username;
        var checkPassword = req.headers.password;

        database.query.loadUser (checkUser, checkPassword,
            function (userData) {
                callback (userData);
            },
            function () {
                callback ();
            }
        );

    },

    logError: function (req, errorData, callback) {

        this.uploadFiles (req, function (errorMessage) {

            // return if an error loading files
            if (errorMessage) {
                callback(errorMessage);
                return;
            }

            // save the base error type
            database.query.logError (
                errorData,
                files,
                function () {
                    callback ();
                },
                function () {
                    callback ("Error saving data.");
                }
            );

        });

    },

    uploadFiles: function (req, callback) {
        var that = this;

        // open reqest to accept files
        req.pipe (req.busboy);

        // save files to local variable
        req.busboy.on ("file", function (fieldname, file, filename, encoding, mimetype) {

            // load the file data
            file.on ("data", function (data) {

                var fileData = {
                    file_name: filename,
                    file_type: that.getFileType (filename),
                    source: data.toString ("utf8")
                };

                files.push (fileData);

            });

        });

        // continue when all files have completed uploading
        req.busboy.on ("finish", function() {
            callback ();
        });

    },

    getFileType: function (fileName) {

        var fileNameParts = fileName.split (".");
        return fileNameParts[fileNameParts.length - 1].toLowerCase ();

    },

    getErrorResponseData: function (errorMessage) {

        var error = {
            error: errorMessage
        };

        return error;

    },

    getSuccessResponseData: function () {

        var success = {
            status: "success"
        };

        return success;

    },

    sendResponse: function (res, returnData) {

        res.writeHead (200, {"Content-Type": "application/json"});
        res.end (JSON.stringify (returnData));

    }

}