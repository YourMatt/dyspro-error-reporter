var database;
var files = [];

exports.init = function (init_database) {
    database = init_database;
};

exports.processor = {

    authenticate: function (api_key, callback) {

        database.query.getAccountByApiKey (api_key, callback);

    },

    logError: function (req, error_data, callback) {

        this.uploadFiles (req, function (error_message) {

            // return if an error loading files
            if (error_message) {
                callback (error_message);
                return;
            }

            // save the base error type
            database.query.logError (
                error_data,
                files,
                callback
            );

        });

    },

    uploadFiles: function (req, callback) {
        var that = this;
        files = [];

        if (req.busboy) {

            // skip if query string not part of url - means post provided, but no file available
            // this is only applicable if set for body of post to be blank and use URL variables with post
            if (req.originalUrl.indexOf ("?") < 0) {
                callback ();
                return;
            }

            // open request to accept files
            req.pipe (req.busboy);

            // save files to local variable
            req.busboy.on ("file", function (field_name, file, file_name, encoding, mime_type) {

                // load the file data
                file.on ("data", function (data) {

                    var file_data = {
                        file_name: file_name,
                        file_type: that.getFileType(file_name),
                        source: data
                    };

                    files.push(file_data);

                });

            });

            // continue when all files have completed uploading
            req.busboy.on("finish", function () {
                callback();
            });
        }
        else callback ();

    },

    getFileType: function (file_name) {

        var file_name_parts = file_name.split (".");
        return file_name_parts[file_name_parts.length - 1].toLowerCase ();

    },

    getErrorResponseData: function (error_message) {

        var error = {
            error: error_message
        };

        return error;

    },

    getSuccessResponseData: function () {

        var success = {
            status: "success"
        };

        return success;

    },

    sendResponse: function (res, return_data) {

        res.writeHead (200, {"Content-Type": "application/json"});
        res.end (JSON.stringify (return_data));

    }

}